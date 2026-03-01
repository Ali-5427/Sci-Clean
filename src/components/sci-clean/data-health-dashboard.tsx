'use client';

import type { ProcessedCsvData, ColumnProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CheckCircle, AlertTriangle, File, Hash, Rows, Columns, Clock, Wrench } from 'lucide-react';
import MissingnessHeatmap from './missingness-heatmap';

interface DataHealthDashboardProps {
  data: ProcessedCsvData;
}

const SparsityScoreCard = ({ score, anomalies, columnProfiles }: { score: number, anomalies: number, columnProfiles: ColumnProfile[] }) => {
  const scoreColor = score > 25 ? 'text-red-400' : score > 10 ? 'text-yellow-400' : 'text-green-400';
  const scoreBg = score > 25 ? 'bg-red-900/50' : score > 10 ? 'bg-yellow-900/50' : 'bg-green-900/50';
  const totalWarnings = anomalies + (columnProfiles.reduce((acc, p) => acc + p.warnings.length, 0));

  return (
    <Card className={scoreBg}>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Data Health Summary</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className={`text-6xl font-bold ${scoreColor}`}>{score.toFixed(1)}%</p>
        <p className="text-muted-foreground text-sm">of cells are missing data</p>
        {totalWarnings > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2 text-red-400 text-xs">
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
          <span className="flex items-center gap-2 text-muted-foreground"><File className="w-4 h-4" /> File</span>
          <span className="font-mono text-right truncate max-w-[120px]">{data.fileName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Rows className="w-4 h-4" /> Rows</span>
          <span className="font-mono">{data.rowCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-muted-foreground"><Columns className="w-4 h-4" /> Columns</span>
          <span className="font-mono">{data.columnCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground"><Hash className="w-4 h-4" /> Hash</span>
            <span className="font-mono truncate max-w-[120px]" title={data.fileHash}>{data.fileHash.substring(0, 12)}...</span>
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
        label: col.warnings[0], // Show first warning
        className: 'bg-red-900/50 text-red-100 border-red-500/50'
      };
    }
    if (col.anomaliesInColumn > 0) {
      return { 
        icon: <AlertTriangle className="text-yellow-400" />, 
        label: `${col.anomaliesInColumn} Anomaly Found`,
        className: 'bg-yellow-900/50 text-yellow-100 border-yellow-500/50'
      };
    }
    if (col.missingPercentage > 0) {
      return { 
        icon: <Wrench className="text-blue-400" />,
        label: 'Will Auto-Impute',
        className: 'bg-blue-900/50 text-blue-100 border-blue-500/50'
      };
    }
    return { 
      icon: <CheckCircle className="text-green-500" />, 
      label: "Good",
      className: 'bg-green-900/30 text-green-100 border-green-500/30'
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-headline">Column Health</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96 w-full">
          <div className="min-w-[450px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Column</TableHead>
                  <TableHead className="w-[60px]">Miss</TableHead>
                  <TableHead className="w-[60px]">%</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map(col => {
                  const status = getStatus(col);
                  return (
                      <TableRow key={col.name}>
                      <TableCell className="font-medium truncate max-w-[120px]" title={col.name}>{col.name}</TableCell>
                      <TableCell>{col.missingCount.toLocaleString()}</TableCell>
                      <TableCell>{col.missingPercentage.toFixed(1)}%</TableCell>
                      <TableCell>
                          <Badge variant="outline" className={`flex items-center gap-1.5 whitespace-nowrap text-[10px] py-0 h-6 ${status.className}`}>
                              {status.icon}
                              {status.label}
                          </Badge>
                      </TableCell>
                      </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};


const DataHealthDashboard = ({ data }: DataHealthDashboardProps) => {
  return (
    <div className="space-y-6">
      <SparsityScoreCard score={data.sparsityScore} anomalies={data.anomaliesFound} columnProfiles={data.columnProfiles} />
      <SummaryStats data={data} />
      <ColumnHealthTable columns={data.columnProfiles} />
      <MissingnessHeatmap columns={data.columnProfiles} />
    </div>
  );
};

export default DataHealthDashboard;
