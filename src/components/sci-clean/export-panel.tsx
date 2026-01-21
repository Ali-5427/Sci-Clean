'use client';

import { generatePythonScript } from '@/lib/python-generator';
import type { ProcessedCsvData, ConfirmedTypes, AuditLogEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Copy, FileCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  processedData: ProcessedCsvData;
  confirmedTypes: ConfirmedTypes;
  disabled: boolean;
  addAuditLog: (action: AuditLogEntry['action'], details: any) => void;
}

const ExportPanel = ({ processedData, confirmedTypes, disabled, addAuditLog }: ExportPanelProps) => {
  const { toast } = useToast();

  const handleDownloadScript = () => {
    const scriptContent = generatePythonScript(processedData, confirmedTypes);
    const blob = new Blob([scriptContent], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cleaning_pipeline.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditLog('EXPORT_SCRIPT', { method: 'download' });
    toast({ title: "Success", description: "Python script downloaded." });
  };

  const handleCopyToClipboard = () => {
    const scriptContent = generatePythonScript(processedData, confirmedTypes);
    navigator.clipboard.writeText(scriptContent).then(() => {
      addAuditLog('EXPORT_SCRIPT', { method: 'clipboard' });
      toast({ title: "Copied to Clipboard", description: "Python script has been copied." });
    }, () => {
      toast({ title: "Error", description: "Failed to copy to clipboard.", variant: "destructive" });
    });
  };

  const handleDownloadCsv = () => {
    // This is a placeholder for actual CSV generation which is complex client-side.
    const placeholderCsv = `column_1,column_2\ncleaned_value_1,cleaned_value_2`;
    const blob = new Blob([placeholderCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_${processedData.fileName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditLog('EXPORT_CSV', {});
    toast({ title: "CSV Download Started", description: "Note: This is a placeholder in the MVP." });
  };


  return (
    <Card className={disabled ? 'bg-muted/50' : ''}>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Export Reproducible Results</CardTitle>
        <CardDescription>
          {disabled ? 'Confirm all column types to enable export.' : 'Your cleaning pipeline is ready to be exported.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleDownloadScript} disabled={disabled} className="w-full gap-2">
          <Download className="w-4 h-4" /> Download .py Script
        </Button>
        <Button onClick={handleCopyToClipboard} disabled={disabled} variant="secondary" className="w-full gap-2">
          <Copy className="w-4 h-4" /> Copy Python to Clipboard
        </Button>
        <Button onClick={handleDownloadCsv} disabled={disabled} variant="outline" className="w-full gap-2">
          <FileCheck2 className="w-4 h-4" /> Download Cleaned .csv
        </Button>
        {!disabled && <p className="mt-2 text-xs text-center text-muted-foreground">Original File Hash: <span className="font-mono">{processedData.fileHash.substring(0,16)}...</span></p>}
      </CardContent>
    </Card>
  );
};

export default ExportPanel;
