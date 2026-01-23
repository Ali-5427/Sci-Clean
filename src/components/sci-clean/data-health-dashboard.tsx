
'use client';

import type { ProcessedCsvData, ColumnProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle, File, Hash, Rows, Columns, Clock, Wrench } from 'lucide-react';
import MissingnessHeatmap from './missingness-heatmap';

interface DataHealthDashboardProps {
  data: ProcessedCsvData;
}

const SparsityScoreCard = ({ score, anomalies }: { score: number, anomalies: number }) => {
  const scoreColor = score > 25 ? 'text-red-400' : score > 10 ? 'text-yellow-400' : 'text-green-400';
  const scoreBg = score > 25 ? 'bg-red-900/50' : score > 10 ? 'bg-yellow-900/50' : 'bg-green-900/50';
  const totalWarnings = anomalies + (data.columnProfiles.reduce((acc, p) => acc + p.warnings.length, 0));

  return (
    <Card className={scoreBg}>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Data Health Summary</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className={`text-6xl font-bold ${scoreColor}`}>{score.toFixed(1)}%</p>
        <p className="text-muted-foreground">of cells are missing data</p>
        {totalWarnings > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2 text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <p>{totalWarnings} potential issue{totalWarnings > 1 ? 's' : ''} found</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};

const SummaryStats = ({ data }: { data: ProcessedCsvData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">File Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><File className="w-4 h-4" /> File Name</span>
          <span className="font-mono text-right truncate">{data.fileName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Rows className="w-4 h-4" /> Total Rows</span>
          <span className="font-mono">{data.rowCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Columns className="w-4 h-4" /> Total Columns</span>
          <span className="font-mono">{data.columnCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Clock className="w-4 h-4" /> Process Time</span>
          <span className="font-mono">{data.processingTime.toFixed(2)}s</span>
        </div>
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground"><Hash className="w-4 h-4" /> File Hash</span>
            <span className="font-mono truncate" title={data.fileHash}>{data.fileHash.substring(0, 16)}...</span>
        </div>
      </CardContent>
    </Card>
  );
};

const ColumnHealthTable = ({ columns }: { columns: ProcessedCsvData['columnProfiles'] }) => {
  const getStatus = (col: ColumnProfile) => {
    if (col.warnings.length > 0) {
      return { 
        icon: <AlertTriangle className="text-red-400" />, 
        label: col.warnings.join(', '),
        className: 'bg-red-900/50'
      };
    }
    if (col.anomaliesInColumn > 0) {
      return { 
        icon: <AlertTriangle className="text-yellow-400" />, 
        label: `${col.anomaliesInColumn} Outlier${col.anomaliesInColumn > 1 ? 's' : ''}`,
        className: 'bg-yellow-900/50'
      };
    }
    if (col.missingPercentage > 0) {
      return { 
        icon: <Wrench className="text-blue-400" />,
        label: 'Will Auto-Impute',
        className: 'bg-blue-900/50'
      };
    }
    return { 
      icon: <CheckCircle className="text-green-500" />, 
      label: "Good",
      className: ''
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Column Health</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead>Missing</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns.map(col => {
                const status = getStatus(col);
                return (
                    <TableRow key={col.name}>
                    <TableCell className="font-medium">{col.name}</TableCell>
                    <TableCell>{col.missingCount.toLocaleString()}</TableCell>
                    <TableCell>{col.missingPercentage.toFixed(2)}%</TableCell>
                    <TableCell>
                        <Badge variant="secondary" className={`flex items-center gap-1.5 ${status.className}`}>
                            {status.icon}
                            {status.label}
                        </Badge>
                    </TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};


const DataHealthDashboard = ({ data }: DataHealthDashboardProps) => {
  return (
    <div className="space-y-6">
      <SparsityScoreCard score={data.sparsityScore} anomalies={data.anomaliesFound} />
      <SummaryStats data={data} />
      <ColumnHealthTable columns={data.columnProfiles} />
      <MissingnessHeatmap columns={data.columnProfiles} />
    </div>
  );
};

export default DataHealthDashboard;
