'use client';

import { generatePythonScript } from '@/lib/python-generator';
import type { ProcessedCsvData, ConfirmedTypes, AuditLogEntry, DataType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Copy, FileCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportPanelProps {
  processedData: ProcessedCsvData;
  confirmedTypes: ConfirmedTypes;
  disabled: boolean;
  addAuditLog: (action: AuditLogEntry['action'], details: any) => void;
  rawCsvContent: string | null;
}

const ExportPanel = ({ processedData, confirmedTypes, disabled, addAuditLog, rawCsvContent }: ExportPanelProps) => {
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
    if (!rawCsvContent) {
      toast({ title: "Error", description: "CSV content not available to generate cleaned file.", variant: "destructive" });
      return;
    }

    const applyTypeConversion = (value: string, type: DataType | undefined): string => {
      const trimmedValue = value.trim();
      if (['', 'null', 'na', 'n/a'].includes(trimmedValue.toLowerCase())) {
        return '';
      }
      if (!type) {
        return trimmedValue;
      }

      switch (type) {
        case 'NUMERIC':
          const num = parseFloat(trimmedValue.replace(/,/g, ''));
          return isNaN(num) ? '' : String(num);
        case 'DATE':
          const date = new Date(trimmedValue);
          return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
        case 'TEXT':
        case 'CATEGORICAL':
          return trimmedValue.includes(',') ? `"${trimmedValue}"` : trimmedValue;
        default:
          return trimmedValue;
      }
    };

    try {
      const lines = rawCsvContent.trim().split(/\r?\n/);
      const header = lines[0].split(',').map(h => h.trim());
      const columnTypeMap: (DataType | undefined)[] = header.map(h => confirmedTypes[h]?.type);

      const cleanedRows = lines.slice(1).map(line => {
        if (!line.trim()) return null;
        const values = line.split(',');
        return header.map((_, index) => {
          const value = values[index] || '';
          const type = columnTypeMap[index];
          return applyTypeConversion(value, type);
        }).join(',');
      }).filter(row => row !== null);

      const cleanedCsv = [header.join(','), ...cleanedRows].join('\n');
      const blob = new Blob([cleanedCsv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_${processedData.fileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addAuditLog('EXPORT_CSV', {});
      toast({ title: "CSV Downloaded", description: "The cleaned CSV file has been generated and downloaded." });
    } catch (error) {
      console.error("Failed to generate cleaned CSV:", error);
      toast({ title: "CSV Generation Error", description: "Could not generate the cleaned CSV file.", variant: "destructive" });
    }
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
        <Button onClick={handleDownloadCsv} disabled={disabled || !rawCsvContent} variant="outline" className="w-full gap-2">
          <FileCheck2 className="w-4 h-4" /> Download Cleaned .csv
        </Button>
        {!disabled && <p className="mt-2 text-xs text-center text-muted-foreground">Original File Hash: <span className="font-mono">{processedData.fileHash.substring(0,16)}...</span></p>}
      </CardContent>
    </Card>
  );
};

export default ExportPanel;
