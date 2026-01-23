'use server';

import type { InferAndConfirmColumnTypesOutput } from '@/ai/flows/infer-and-confirm-column-types';

export type DataType = 'NUMERIC' | 'TEXT' | 'DATE' | 'CATEGORICAL' | 'BOOLEAN';

export interface ColumnProfile {
  name: string;
  missingCount: number;
  missingPercentage: number;
  sampleValues: string[];
  initialTypeGuess: DataType;
  anomaliesInColumn: number;
}

export interface ProcessedCsvData {
  fileName: string;
  fileSize: number;
  fileHash: string;
  rowCount: number;
  columnCount: number;
  columnProfiles: ColumnProfile[];
  sparsityScore: number;
  processingTime: number; // in seconds
  anomaliesFound: number;
}

export interface AuditLogEntry {
  timestamp: Date;
  action:
    | 'UPLOAD_START'
    | 'UPLOAD_COMPLETE'
    | 'ANALYSIS_COMPLETE'
    | 'TYPE_DETECTED'
    | 'TYPE_CONFIRMED'
    | 'EXPORT_SCRIPT'
    | 'EXPORT_CSV';
  details: any;
}

export type AppState = 'IDLE' | 'PROCESSING' | 'DASHBOARD';

export interface ConfirmedType {
  type: DataType;
  confirmedBy: 'user' | 'ai';
  timestamp: Date;
}

export interface ConfirmedTypes {
  [columnName: string]: ConfirmedType;
}

export type AIResult = {
    results: {
        columnName: string;
        detectedType: DataType;
        confidence: number;
    }[]
};

export type ColumnAnalysisResult = AIResult['results'][0];

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
