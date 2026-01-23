
'use client';

import { useState } from 'react';
import type { ProcessedCsvData, DataType, ColumnProfile } from '@/lib/types';

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
): Omit<ProcessedCsvData, 'fileHash' | 'processingTime' | 'anomaliesFound'> & { anomaliesFound: number } {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      fileName,
      fileSize,
      rowCount: 0,
      columnCount: 0,
      columnProfiles: [],
      sparsityScore: 0,
      anomaliesFound: 0,
    };
  }

  const header = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
  const rowCount = dataRows.length;
  const columnCount = header.length;

  // --- Active Cleaning Step 1: Auto-Imputation (Forward Fill) ---
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < columnCount; j++) {
      const isMissing = dataRows[i][j] === '' || ['null', 'na', 'n/a'].includes(dataRows[i][j].toLowerCase());
      if (isMissing) {
        if (i > 0) {
          dataRows[i][j] = dataRows[i - 1][j]; // Forward fill from row above
        }
      }
    }
  }
  // Second pass: Fill any remaining missing values (e.g., in the first row) with 0
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < columnCount; j++) {
       const isStillMissing = dataRows[i][j] === '' || ['null', 'na', 'n/a'].includes(dataRows[i][j].toLowerCase());
       if(isStillMissing) {
        dataRows[i][j] = '0';
       }
    }
  }


  // --- Profiling Step: Analyze the now-cleaned data ---
  let totalMissing = 0; // This will be 0 after imputation, showing the result of cleaning
  const columnProfiles: ColumnProfile[] = header.map((colName, colIndex) => {
    let missingCount = 0;
    const sampleValues: string[] = [];

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const value = dataRows[rowIndex][colIndex] || '';
      if (value === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'na') {
        missingCount++;
      } else if (sampleValues.length < 10) {
        sampleValues.push(value);
      }
    }

    totalMissing += missingCount;

    return {
      name: colName,
      missingCount,
      missingPercentage: rowCount > 0 ? (missingCount / rowCount) * 100 : 0,
      sampleValues,
      initialTypeGuess: 'TEXT',
    };
  });

  const totalCells = rowCount * columnCount;
  const sparsityScore = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;
  
  // --- Active Cleaning Step 2: Anomaly Detection (Z-Score) ---
  let anomaliesFound = 0;
  for (let j = 0; j < columnCount; j++) {
    const numericValues: number[] = [];
    for (let i = 0; i < rowCount; i++) {
        const num = parseFloat(dataRows[i][j]);
        if (!isNaN(num)) {
            numericValues.push(num);
        }
    }

    if(numericValues.length > 2) { // Need at least 3 points to calculate stdev meaningfully
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const stdDev = Math.sqrt(numericValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / numericValues.length);

        if (stdDev > 0) {
            for(const value of numericValues) {
                const zScore = (value - mean) / stdDev;
                if (Math.abs(zScore) > 3) {
                    anomaliesFound++;
                }
            }
        }
    }
  }


  return {
    fileName,
    fileSize,
    rowCount,
    columnCount,
    columnProfiles,
    sparsityScore,
    anomaliesFound,
  };
}


export function useCsvProcessor() {
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (
    file: File,
    onComplete: (data: ProcessedCsvData, rawContent: string) => void
  ) => {
    setIsProcessing(true);
    setProgress(0);
    const startTime = Date.now();

    const animationDuration = 3000;
    const intervalTime = 50;
    const progressStep = 100 / (animationDuration / intervalTime);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + progressStep;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, intervalTime);

    const animationPromise = new Promise(resolve => setTimeout(resolve, animationDuration));

    const processingPromise = (async () => {
        const fileContent = await file.text();
        const [fileHash, processedPart] = await Promise.all([
            realHash(file),
            new Promise<ReturnType<typeof processCsvContent>>(resolve => {
                const data = processCsvContent(file.name, file.size, fileContent);
                resolve(data);
            }),
        ]);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        // This assertion is needed because we can't modify the central type in this step
        const finalData: ProcessedCsvData = {
            ...processedPart,
            fileHash,
            processingTime: duration,
        } as ProcessedCsvData;
        
        return {
          finalData,
          rawContent: fileContent,
        };
    })();

    try {
        const [{ finalData, rawContent }] = await Promise.all([processingPromise, animationPromise]);
        
        clearInterval(interval);
        setProgress(100);
        onComplete(finalData, rawContent);

    } catch(e) {
        console.error("Failed to process file:", e);
        clearInterval(interval);
        setProgress(0);
    } finally {
        setIsProcessing(false);
    }
  };

  return { progress, isProcessing, processFile };
}
