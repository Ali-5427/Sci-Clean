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

// Simple CSV Parser and Profiler
function processCsvContent(fileName: string, fileSize: number, csvContent: string): Omit<ProcessedCsvData, 'fileHash' | 'processingTime'> {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    // Not enough data to process, or just a header
    return {
      fileName,
      fileSize,
      rowCount: lines.length - 1 > 0 ? lines.length - 1 : 0,
      columnCount: lines[0]?.split(',').length || 0,
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
        // Handle rows that might have fewer columns than the header
        const value = dataRows[rowIndex][colIndex]?.trim() ?? '';
      
        const isMissing = value === '' || value.toLowerCase() === 'null' || value.toLowerCase() === 'na' || value.toLowerCase() === 'n/a';
      
        if (isMissing) {
            missingCount++;
        } else if (sampleValues.length < 10) {
            sampleValues.push(value);
        }
    }

    totalMissing += missingCount;

    // This is just a placeholder, the AI flow will determine the actual type.
    const initialTypeGuess: DataType = 'TEXT'; 

    return {
      name: colName,
      missingCount,
      missingPercentage: rowCount > 0 ? (missingCount / rowCount) * 100 : 0,
      sampleValues,
      initialTypeGuess,
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

    // --- MODIFICATION: Force a 5-second animation ---
    const animationDuration = 5000;
    const intervalTime = 50; // Update progress every 50ms
    const progressStep = 100 / (animationDuration / intervalTime); // This calculates to 1

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

    // This promise ensures the animation runs for at least 5 seconds.
    const animationPromise = new Promise(resolve => setTimeout(resolve, animationDuration));

    const processingPromise = (async () => {
        const fileContent = await file.text();
        const [fileHash, processedPart] = await Promise.all([
            realHash(file),
            new Promise<Omit<ProcessedCsvData, 'fileHash' | 'processingTime'>>(resolve => {
                const data = processCsvContent(file.name, file.size, fileContent);
                resolve(data);
            }),
        ]);
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        return {
          finalData: {
            ...processedPart,
            fileHash,
            processingTime: duration,
          },
          rawContent: fileContent,
        };
    })();

    try {
        // Wait for both the real processing and the minimum animation time to complete.
        const [{ finalData, rawContent }] = await Promise.all([processingPromise, animationPromise]);
        
        // Ensure progress is 100 and interval is cleared.
        clearInterval(interval);
        setProgress(100);
        onComplete(finalData, rawContent);

    } catch(e) {
        console.error("Failed to process file:", e);
        clearInterval(interval);
        setProgress(0); // Reset on error
    } finally {
        setIsProcessing(false);
    }
  };

  return { progress, isProcessing, processFile };
}
