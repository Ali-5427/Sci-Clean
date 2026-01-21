'use client';

import type { AuditLogEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { Bot, CheckCircle, Clock, FileUp, ListChecks, FileText } from 'lucide-react';

interface AuditLogProps {
  log: AuditLogEntry[];
}

const LogEntry = ({ entry }: { entry: AuditLogEntry }) => {
    const getIcon = () => {
        switch(entry.action) {
            case 'UPLOAD_START':
            case 'UPLOAD_COMPLETE': return <FileUp className="w-4 h-4" />;
            case 'ANALYSIS_COMPLETE': return <Bot className="w-4 h-4" />;
            case 'TYPE_CONFIRMED': return <ListChecks className="w-4 h-4" />;
            case 'EXPORT_SCRIPT':
            case 'EXPORT_CSV': return <FileText className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    }

    const formatDetails = () => {
        switch(entry.action) {
            case 'UPLOAD_START': return `Upload started for ${entry.details.name}.`;
            case 'UPLOAD_COMPLETE': return `Uploaded: ${entry.details.name} (${(entry.details.size / 1024 / 1024).toFixed(2)} MB).`;
            case 'ANALYSIS_COMPLETE': return `${entry.details.rows} rows, ${entry.details.columns} columns. Sparsity: ${entry.details.sparsity.toFixed(1)}%.`;
            case 'TYPE_CONFIRMED': return `Confirmed '${entry.details.column}' as ${entry.details.type}.`;
            case 'EXPORT_SCRIPT': return `Python script exported.`;
            case 'EXPORT_CSV': return `Cleaned CSV exported.`;
            default: return JSON.stringify(entry.details);
        }
    }

  return (
    <div className="flex gap-3 text-sm">
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
            {getIcon()}
        </div>
        <div className="flex-1 w-px bg-border"></div>
      </div>
      <div>
        <p className="font-medium">{formatDetails()}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};


const AuditLog = ({ log }: AuditLogProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Reproducibility Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="flex flex-col-reverse gap-4 pr-4">
            {log.map((entry, index) => (
              <LogEntry key={index} entry={entry} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AuditLog;
