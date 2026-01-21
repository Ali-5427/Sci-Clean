'use client';

import { useState } from 'react';
import type { ProcessedCsvData, DataType, ColumnProfile } from '@/lib/types';

// Mock SHA-256 Hashing
async function mockHash(file: File): Promise<string> {
  const text = `${file.name}-${file.size}-${file.lastModified}`;
  const buffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Mock CSV parsing and profiling
function mockProcess(file: File): Omit<ProcessedCsvData, 'fileHash' | 'processingTime'> {
  const fileSize = file.size;
  const rowCount = Math.floor(fileSize / (Math.random() * 200 + 100)); // Estimate rows
  const columnCount = Math.floor(Math.random() * 40) + 5;
  
  const columnNames = Array.from({ length: columnCount }, (_, i) => `column_${i + 1}`);
  
  const dataTypes: DataType[] = ['NUMERIC', 'TEXT', 'DATE', 'CATEGORICAL'];

  let totalMissing = 0;

  const columnProfiles: ColumnProfile[] = columnNames.map(name => {
    const missingCount = Math.floor(Math.random() * (rowCount * 0.3)); // up to 30% missing
    totalMissing += missingCount;
    const sampleValues = Array.from({ length: 10 }, () => {
      const type = dataTypes[Math.floor(Math.random() * dataTypes.length)];
      if (type === 'NUMERIC') return String(Math.floor(Math.random() * 1000));
      if (type === 'TEXT') return Math.random().toString(36).substring(7);
      if (type === 'DATE') return new Date(Date.now() - Math.random() * 1e12).toISOString().split('T')[0];
      return ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
    });

    return {
      name,
      missingCount,
      missingPercentage: (missingCount / rowCount) * 100,
      sampleValues,
      initialTypeGuess: dataTypes[Math.floor(Math.random() * dataTypes.length)],
    };
  });

  const totalCells = rowCount * columnCount;
  const sparsityScore = (totalMissing / totalCells) * 100;
  
  // Create more realistic profiles for some columns
  if (columnProfiles.length > 0) {
      columnProfiles[0].name = "age";
      columnProfiles[0].initialTypeGuess = "NUMERIC";
      columnProfiles[0].sampleValues = ["25", "34", "51", "28", "67", "NULL", "42"];
  }
  if (columnProfiles.length > 1) {
      columnProfiles[1].name = "income";
      columnProfiles[1].initialTypeGuess = "TEXT";
      columnProfiles[1].sampleValues = ["55000", "72000.50", "NULL", "120,000", "98500"];
  }
  if (columnProfiles.length > 2) {
    columnProfiles[2].name = "diagnosis";
    columnProfiles[2].initialTypeGuess = "CATEGORICAL";
    columnProfiles[2].sampleValues = ["Healthy", "Type 2 Diabetes", "Hypertension", "Healthy"];
  }
   if (columnProfiles.length > 3) {
    columnProfiles[3].name = "date_admitted";
    columnProfiles[3].initialTypeGuess = "DATE";
    columnProfiles[3].sampleValues = ["2022-01-15", "2023-05-20", "21/07/2023", "NULL"];
  }

  return {
    fileName: file.name,
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
    onComplete: (data: ProcessedCsvData) => void
  ) => {
    setIsProcessing(true);
    setProgress(0);
    const startTime = Date.now();

    const processingTime = Math.max(1000, file.size / 100000); // Simulate time based on size

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      if (currentProgress > 100) currentProgress = 100;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
      }
    }, processingTime / 10);

    // Simulate async operations like hashing and processing
    const [fileHash, processedPart] = await Promise.all([
      mockHash(file),
      new Promise<Omit<ProcessedCsvData, 'fileHash' | 'processingTime'>>(resolve => setTimeout(() => resolve(mockProcess(file)), processingTime)),
    ]);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    const finalData: ProcessedCsvData = {
      ...processedPart,
      fileHash,
      processingTime: duration,
    };
    
    onComplete(finalData);
    setIsProcessing(false);
  };

  return { progress, isProcessing, processFile };
}
