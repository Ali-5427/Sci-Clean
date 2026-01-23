
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

// Research-Grade CSV Parser and Profiler with Active Cleaning
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

  // --- PASS 0: Profile RAW data for dashboard ---
  const { columnProfiles: rawColumnProfiles, sparsityScore } = (() => {
      let totalMissing = 0;
      const profiles: Omit<ColumnProfile, 'anomaliesInColumn'>[] = header.map((colName, colIndex) => {
        let missingCount = 0;
        const sampleValues: string[] = [];
        for (let rowIndex = 0; rowIndex < rawDataRows.length; rowIndex++) {
          const value = rawDataRows[rowIndex][colIndex] || '';
          if (value === '' || ['null', 'na', 'n/a'].includes(value.toLowerCase())) {
            missingCount++;
          } else if (sampleValues.length < 10) {
            sampleValues.push(value);
          }
        }
        totalMissing += missingCount;
        return {
          name: colName,
          missingCount,
          missingPercentage: rawDataRows.length > 0 ? (missingCount / rawDataRows.length) * 100 : 0,
          sampleValues,
          initialTypeGuess: 'TEXT',
        };
      });
      const totalCells = rawDataRows.length * header.length;
      const score = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;
      return { columnProfiles: profiles, sparsityScore: score };
  })();
  
  // --- PASS 1: Active Cleaning & Imputation (Forward Fill) ---
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

  // --- PASS 2: ANOMALY DETECTION (Z-Score) ---
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
              if (!row._isAnomaly) {
                  anomaliesFound++;
              }
              row._isAnomaly = true;
              anomaliesPerColumn[colName] = (anomaliesPerColumn[colName] || 0) + 1;
            }
          }
        });
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
    processingTime: 0, // will be calculated in the hook
    fileHash: '', // will be calculated in the hook
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

    const fileContent = await file.text();

    const [fileHash, { profilingData, cleanedData }] = await Promise.all([
      realHash(file),
      new Promise<ReturnType<typeof processCsvContent>>(resolve => {
        const result = processCsvContent(file.name, file.size, fileContent);
        resolve(result);
      }),
    ]);
    
    const endTime = Date.now();
    
    profilingData.processingTime = (endTime - startTime) / 1000;
    profilingData.fileHash = fileHash;
    
    setIsProcessing(false);
    setProgress(100);
    onComplete(profilingData, cleanedData);
  };

  return { progress, isProcessing, processFile };
}
