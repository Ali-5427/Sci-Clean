
'use client';

import React, { useState, useMemo } from 'react';
import type { AppState, ProcessedCsvData, AuditLogEntry, ConfirmedTypes } from '@/lib/types';
import Header from '@/components/layout/header';
import FileUpload from '@/components/sci-clean/file-upload';
import DataHealthDashboard from '@/components/sci-clean/data-health-dashboard';
import TypeInferencePanel from '@/components/sci-clean/type-inference-panel';
import AuditLog from '@/components/sci-clean/audit-log';
import ExportPanel from '@/components/sci-clean/export-panel';
import ChatbotPanel from '@/components/sci-clean/chatbot-panel';
import { useCsvProcessor } from '@/hooks/use-csv-processor';
import { Bot, FileCheck2, ListChecks, UploadCloud } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [processedData, setProcessedData] = useState<ProcessedCsvData | null>(null);
  const [cleanedData, setCleanedData] = useState<any[] | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [confirmedTypes, setConfirmedTypes] = useState<ConfirmedTypes>({});

  const { progress, isProcessing, processFile } = useCsvProcessor();

  const handleFileProcess = (file: File) => {
    setAppState('PROCESSING');
    addAuditLog('UPLOAD_START', { name: file.name, size: file.size });

    processFile(file, (data, cleaned) => {
      setProcessedData(data);
      setCleanedData(cleaned);
      setAppState('DASHBOARD');
      addAuditLog('UPLOAD_COMPLETE', {
        name: data.fileName,
        size: data.fileSize,
        hash: data.fileHash,
      });
      addAuditLog('ANALYSIS_COMPLETE', {
        rows: data.rowCount,
        columns: data.columnCount,
        sparsity: data.sparsityScore,
        anomalies: data.anomaliesFound,
      });
    });
  };

  const addAuditLog = (action: AuditLogEntry['action'], details: AuditLogEntry['details']) => {
    setAuditLog((prev) => [
      { timestamp: new Date(), action, details },
      ...prev,
    ]);
  };

  const allTypesConfirmed = useMemo(() => {
    if (!processedData) return false;
    return processedData.columnProfiles.length === Object.keys(confirmedTypes).length;
  }, [processedData, confirmedTypes]);

  const renderContent = () => {
    switch (appState) {
      case 'IDLE':
        return <FileUpload onFileProcess={handleFileProcess} />;
      case 'PROCESSING':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="flex items-center gap-4 p-8 border-2 border-dashed rounded-lg border-primary/50 bg-card">
              <Bot className="w-12 h-12 text-primary animate-pulse" />
              <div>
                <h2 className="text-2xl font-bold font-headline">Processing Data...</h2>
                <p className="text-muted-foreground">Your CSV is being analyzed. Please wait.</p>
                <div className="w-full mt-4 bg-gray-700 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{progress.toFixed(0)}% complete</p>
              </div>
            </div>
          </div>
        );
      case 'DASHBOARD':
        if (!processedData) return null;
        return (
          <div className="grid h-full grid-cols-1 gap-6 p-4 md:grid-cols-12 lg:p-6">
            <div className="md:col-span-12 lg:col-span-3">
              <DataHealthDashboard data={processedData} />
            </div>
            <div className="flex flex-col md:col-span-7 lg:col-span-6">
              <TypeInferencePanel
                data={processedData}
                addAuditLog={addAuditLog}
                confirmedTypes={confirmedTypes}
                setConfirmedTypes={setConfirmedTypes}
              />
            </div>
            <div className="md:col-span-5 lg:col-span-3">
              <div className="flex flex-col gap-6">
                <AuditLog log={auditLog} />
                <ExportPanel
                  processedData={processedData}
                  confirmedTypes={confirmedTypes}
                  disabled={!allTypesConfirmed}
                  addAuditLog={addAuditLog}
                  cleanedData={cleanedData}
                />
                <ChatbotPanel processedData={processedData} />
              </div>
            </div>
          </div>
        );
    }
  };

  const getStepStatus = (step: number) => {
    if (step === 1 && (appState === 'IDLE' || appState === 'PROCESSING')) return 'active';
    if (step === 1 && appState === 'DASHBOARD') return 'completed';

    if (step === 2 && appState === 'DASHBOARD' && !allTypesConfirmed) return 'active';
    if (step === 2 && allTypesConfirmed) return 'completed';

    if (step === 3 && allTypesConfirmed) return 'active';
    
    return 'pending';
  };

  const steps = [
    { name: 'Upload Data', icon: UploadCloud, status: getStepStatus(1) },
    { name: 'Confirm Types', icon: ListChecks, status: getStepStatus(2) },
    { name: 'Export', icon: FileCheck2, status: getStepStatus(3) },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex flex-col flex-1">
        <div className="p-4 border-b border-border bg-card/50">
          <Card className="max-w-4xl mx-auto bg-transparent border-none shadow-none">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={step.name}>
                    <div className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full
                        ${step.status === 'active' ? 'bg-primary text-primary-foreground' : ''}
                        ${step.status === 'completed' ? 'bg-green-500 text-white' : ''}
                        ${step.status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
                      `}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                        <p className={`font-medium text-sm
                          ${step.status === 'active' ? 'text-primary' : ''}
                          ${step.status === 'completed' ? 'text-green-400' : ''}
                        `}>{step.name}</p>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4
                        ${steps[index+1].status !== 'pending' ? 'bg-primary' : 'bg-border'}
                      `}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">{renderContent()}</div>
      </main>
    </div>
  );
}
