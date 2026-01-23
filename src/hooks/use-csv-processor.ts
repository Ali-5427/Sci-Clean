
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

// Research-Grade CSV Parser and Profiler
function processCsvContent(
  fileName: string,
  fileSize: number,
  csvContent: string
): Omit<ProcessedCsvData, 'fileHash' | 'processingTime'> {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return {
      fileName,
      fileSize,
      rowCount: 0,
      columnCount: 0,
      columnProfiles: [],
      sparsityScore: 0,
    };
  }

  const header = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1).map(line => line.split(','));
  const rowCount = dataRows.length;
  const columnCount = header.length;

  let totalMissing = 0;
  const columnProfiles: ColumnProfile[] = header.map((colName, colIndex) => {
    let missingCount = 0;
    const sampleValues: string[] = [];

    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      // Ensure we don't go out of bounds if rows have inconsistent column counts
      const value = (dataRows[rowIndex][colIndex] || '').trim();

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
      missingPercentage: rowCount > 0 ? (missingCount / rowCount) * 100 : 0,
      sampleValues,
      initialTypeGuess: 'TEXT', // This is just a placeholder
    };
  });

  const totalCells = rowCount * columnCount;
  const sparsityScore = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;

  return {
    fileName,
    fileSize,
    rowCount,
    columnCount,
    columnProfiles,
    sparsityScore,
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

    const animationDuration = 1500; // Faster animation
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
        
        const finalData: ProcessedCsvData = {
            ...processedPart,
            fileHash,
            processingTime: duration,
        };
        
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
