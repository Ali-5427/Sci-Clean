
'use client';

import { useState } from 'react';
import type { ProcessedCsvData, ColumnProfile } from '@/lib/types';

// Real SHA-256 Hashing
async function realHash(file: File): Promise<string> {
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Research-Grade CSV Parser and Profiler
function processCsvContent(
  fileName: string,
  fileSize: number,
  csvContent: string
): {
  profilingData: ProcessedCsvData;
  cleanedData: any[];
} {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    const emptyResult = {
      fileName,
      fileSize,
      rowCount: 0,
      columnCount: 0,
      columnProfiles: [],
      sparsityScore: 0,
      processingTime: 0,
      fileHash: '',
      anomaliesFound: 0,
    };
    return { profilingData: emptyResult, cleanedData: [] };
  }

  const header = lines[0].split(',').map(h => h.trim());
  const rawDataRows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));

  // --- PASS 1: Profile RAW data for dashboard ---
  let totalMissingRaw = 0;
  const rawColumnProfiles: ColumnProfile[] = header.map((colName, colIndex) => {
      const warnings: string[] = [];
      let missingCount = 0;
      const sampleValues: string[] = [];
      const allValues = rawDataRows.map(row => row[colIndex] || '');

      for (const value of allValues) {
          if (value === '' || ['null', 'na', 'n/a'].includes(value.toLowerCase())) {
              missingCount++;
          } else if (sampleValues.length < 10) {
              sampleValues.push(value);
          }
      }
      totalMissingRaw += missingCount;

      const nonEmptyValues = allValues.filter(v => v);
      const uniqueRaw = new Set(nonEmptyValues);
      const uniqueTrimmed = new Set(nonEmptyValues.map(v => v.trim()));
      if (uniqueRaw.size > uniqueTrimmed.size) {
          warnings.push("Inconsistent Whitespace Detected");
      }

      return {
          name: colName,
          missingCount,
          missingPercentage: rawDataRows.length > 0 ? (missingCount / rawDataRows.length) * 100 : 0,
          sampleValues,
          initialTypeGuess: 'TEXT', 
          anomaliesInColumn: 0, 
          warnings,
      };
  });
  
  const totalCells = rawDataRows.length * header.length;
  const sparsityScore = totalCells > 0 ? (totalMissingRaw / totalCells) * 100 : 0;
  
  // --- PASS 2: Active Cleaning & Imputation (Forward Fill) ---
  const numericColumnIndices = new Set<number>();
   if (rawDataRows.length > 0) {
      header.forEach((_, colIndex) => {
          for (const row of rawDataRows) {
              const value = row[colIndex];
              if (value && value.trim() && !isNaN(Number(value))) {
                  numericColumnIndices.add(colIndex);
                  break;
              }
          }
      });
  }

  const lastValidValues: { [key: number]: string } = {};
  const cleanedDataObjects = rawDataRows.map(row => {
    const newRow: any = {};
    header.forEach((h, colIndex) => {
      const cell = row[colIndex];
      const isNumeric = numericColumnIndices.has(colIndex);
      const isMissing = cell === '' || ['null', 'na', 'n/a'].includes(cell.toLowerCase());

      if (isMissing) {
        if(isNumeric) {
          newRow[h] = lastValidValues[colIndex] !== undefined ? lastValidValues[colIndex] : '0';
        } else {
          newRow[h] = lastValidValues[colIndex] !== undefined ? lastValidValues[colIndex] : '';
        }
      } else {
        newRow[h] = cell;
      }
      
      if (!isMissing) {
        lastValidValues[colIndex] = cell;
      }
    });
    return newRow;
  });

  // --- PASS 3: ANOMALY & VARIANCE DETECTION ---
  let anomaliesFound = 0;
  const anomaliesPerColumn: { [key: string]: number } = {};
  header.forEach(h => anomaliesPerColumn[h] = 0);

  numericColumnIndices.forEach(colIndex => {
    const colName = header[colIndex];
    const values = cleanedDataObjects.map(row => parseFloat(row[colName])).filter(v => !isNaN(v));
    
    if (values.length > 2) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / (values.length -1));
      
      if (stdDev > 0) {
        cleanedDataObjects.forEach(row => {
          const value = parseFloat(row[colName]);
          if (!isNaN(value)) {
            const zScore = (value - mean) / stdDev;
            if (Math.abs(zScore) > 3) {
              if (!row._isAnomaly) anomaliesFound++;
              row._isAnomaly = true;
              anomaliesPerColumn[colName] = (anomaliesPerColumn[colName] || 0) + 1;
            }
          }
        });
      }

      if (mean !== 0) {
        const cv = stdDev / Math.abs(mean);
        if (cv > 1.0) {
            const profile = rawColumnProfiles.find(p => p.name === colName);
            if (profile && !profile.warnings.includes("High Variance (Possible Unit Mismatch)")) {
                profile.warnings.push("High Variance (Possible Unit Mismatch)");
            }
        }
      }
    }
  });

  // --- FINAL PREPARATION ---
  const finalColumnProfiles: ColumnProfile[] = rawColumnProfiles.map(p => ({
      ...p,
      anomaliesInColumn: anomaliesPerColumn[p.name] || 0,
  }));

  const profilingData: ProcessedCsvData = {
    fileName,
    fileSize,
    rowCount: rawDataRows.length,
    columnCount: header.length,
    columnProfiles: finalColumnProfiles,
    sparsityScore,
    anomaliesFound,
    processingTime: 0,
    fileHash: '',
  };
  
  return { profilingData, cleanedData: cleanedDataObjects };
}


export function useCsvProcessor() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (
    file: File,
    onComplete: (data: ProcessedCsvData, cleanedData: any[]) => void
  ) => {
    setIsProcessing(true);
    setProgress(0);
    const startTime = Date.now();
    
    const BIG_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
    const simulationDuration = file.size < BIG_FILE_THRESHOLD ? 3000 : 5000;

    const actualProcessingPromise = (async () => {
        const fileContent = await file.text();
        const [fileHash, { profilingData, cleanedData }] = await Promise.all([
            realHash(file),
            Promise.resolve(processCsvContent(file.name, file.size, fileContent)),
        ]);
        
        profilingData.fileHash = fileHash;
        return { profilingData, cleanedData };
    })();

    const simulatedProgressPromise = new Promise<void>(resolve => {
        let currentProgress = 0;
        const interval = setInterval(() => {
            currentProgress += 1;
            setProgress(p => Math.min(p + 2, 95));
            if (currentProgress >= 100) {
                clearInterval(interval);
            }
        }, simulationDuration / 100);

        setTimeout(() => {
            clearInterval(interval);
            resolve();
        }, simulationDuration);
    });

    const [_, { profilingData, cleanedData }] = await Promise.all([
        simulatedProgressPromise,
        actualProcessingPromise
    ]);

    const endTime = Date.now();
    profilingData.processingTime = (endTime - startTime) / 1000;

    setProgress(100);
    setIsProcessing(false);
    onComplete(profilingData, cleanedData);
  };

  return { progress, isProcessing, processFile };
}
