
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
  cleanedCsvContent: string;
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
      fileHash: '', // Will be set later
    };
    return { profilingData: emptyResult, cleanedCsvContent: '' };
  }

  const header = lines[0].split(',').map(h => h.trim());
  const rawDataRows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));

  // --- PASS 0: Profile RAW data for dashboard ---
  const { columnProfiles: rawColumnProfiles, sparsityScore } = (() => {
      let totalMissing = 0;
      const profiles: ColumnProfile[] = header.map((colName, colIndex) => {
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

  // --- PASS 1: IMPUTATION (Forward Fill on Numeric Columns) ---
  const numericColumnIndices = new Set<number>();
  if (rawDataRows.length > 0) {
      header.forEach((_, colIndex) => {
          // Guess if a column is numeric by checking the first few non-empty values
          for (const row of rawDataRows) {
              const value = row[colIndex];
              if (value && value.trim()) {
                  if (!isNaN(Number(value))) {
                      numericColumnIndices.add(colIndex);
                  }
                  break;
              }
          }
      });
  }

  const cleanedRows: string[][] = [];
  const lastValidValues: { [key: number]: string } = {};

  rawDataRows.forEach(row => {
    const newRow = [...row];
    row.forEach((cell, colIndex) => {
      const isNumeric = numericColumnIndices.has(colIndex);
      const isMissing = cell === '' || ['null', 'na', 'n/a'].includes(cell.toLowerCase());

      if (isMissing && isNumeric) {
        newRow[colIndex] = lastValidValues[colIndex] !== undefined ? lastValidValues[colIndex] : '0';
      }
      
      if (!isMissing) {
        lastValidValues[colIndex] = cell;
      }
    });
    cleanedRows.push(newRow);
  });
  
  const cleanedDataObjects: any[] = cleanedRows.map(row => {
    const obj: any = {};
    header.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });

  // --- PASS 2: ANOMALY DETECTION (Z-Score) ---
  let anomaliesFound = 0;
  
  numericColumnIndices.forEach(colIndex => {
    const colName = header[colIndex];
    const values = cleanedDataObjects.map(row => parseFloat(row[colName])).filter(v => !isNaN(v));
    
    if (values.length > 1) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
      
      if (stdDev > 0) {
        cleanedDataObjects.forEach(row => {
          const value = parseFloat(row[colName]);
          if (!isNaN(value)) {
            const zScore = (value - mean) / stdDev;
            if (Math.abs(zScore) > 3) {
              row._isAnomaly = true;
            }
          }
        });
      }
    }
  });

  cleanedDataObjects.forEach(row => {
    if (row._isAnomaly) {
      anomaliesFound++;
    }
  });

  // --- FINAL PREPARATION ---
  const profilingData: ProcessedCsvData = {
    fileName,
    fileSize,
    rowCount: rawDataRows.length,
    columnCount: header.length,
    columnProfiles: rawColumnProfiles,
    sparsityScore,
    anomaliesFound, // Add the new metric
    processingTime: 0, // will be calculated in the hook
    fileHash: '', // will be calculated in the hook
  };

  const cleanedCsvContent = [
    header.join(','),
    ...cleanedDataObjects.map(row => {
      // Exclude _isAnomaly flag from the final CSV
      return header.map(h => row[h]).join(',');
    })
  ].join('\n');
  
  return { profilingData, cleanedCsvContent };
}


export function useCsvProcessor() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (
    file: File,
    onComplete: (data: ProcessedCsvData, cleanedContent: string) => void
  ) => {
    setIsProcessing(true);
    setProgress(0);
    const startTime = Date.now();

    const fileContent = await file.text();

    const [fileHash, { profilingData, cleanedCsvContent }] = await Promise.all([
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
    onComplete(profilingData, cleanedCsvContent);
  };

  return { progress, isProcessing, processFile };
}
