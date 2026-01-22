'use client';

import { useState, useEffect } from 'react';
import type { ProcessedCsvData, AuditLogEntry, ConfirmedTypes, DataType, AIResult } from '@/lib/types';
import { inferAndConfirmColumnTypes } from '@/ai/flows/infer-and-confirm-column-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, ChevronDown, Bot, AlertTriangle, Hash, Type as TypeIcon, Calendar, Tags, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface TypeInferencePanelProps {
  data: ProcessedCsvData;
  addAuditLog: (action: AuditLogEntry['action'], details: any) => void;
  confirmedTypes: ConfirmedTypes;
  setConfirmedTypes: React.Dispatch<React.SetStateAction<ConfirmedTypes>>;
}

const TypeIconComponent = ({ type }: { type: DataType }) => {
  switch (type) {
    case 'NUMERIC': return <Hash className="w-4 h-4" />;
    case 'TEXT': return <TypeIcon className="w-4 h-4" />;
    case 'DATE': return <Calendar className="w-4 h-4" />;
    case 'CATEGORICAL': return <Tags className="w-4 h-4" />;
    default: return null;
  }
};

const TypeConfirmationCard = ({
  column,
  fileSize,
  sparsityScore,
  onConfirm,
  isConfirmed,
}: {
  column: ProcessedCsvData['columnProfiles'][0];
  fileSize: number;
  sparsityScore: number;
  onConfirm: (columnName: string, type: DataType) => void;
  isConfirmed: boolean;
}) => {
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DataType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runInference = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await inferAndConfirmColumnTypes({
          columnName: column.name,
          sampleValues: column.sampleValues,
          fileSize,
          sparsityScore,
        });
        setAiResult(result);
        setSelectedType(result.detectedType);
      } catch (err) {
        console.error("AI inference failed for column:", column.name, err);
        setError("AI inference failed for this column.");
      } finally {
        setIsLoading(false);
      }
    };
    runInference();
  }, [column, fileSize, sparsityScore]);

  const handleConfirm = () => {
    if (selectedType) {
      onConfirm(column.name, selectedType);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="w-2/3 h-6" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-full h-4" />
        </CardContent>
        <CardFooter className="gap-2">
          <Skeleton className="w-24 h-10" />
          <Skeleton className="w-32 h-10" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg font-headline">
            {column.name}
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-4 h-4"/> Error</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
          <p className="mt-2 text-xs text-muted-foreground">Check the browser console for more details.</p>
        </CardContent>
      </Card>
    );
  }

  if (!aiResult) return null;

  const confidenceColor = aiResult.confidence > 80 ? 'text-green-400' : aiResult.confidence > 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <Card className={isConfirmed ? 'bg-green-900/30 border-green-500/50' : aiResult.confidence < 80 ? 'bg-yellow-900/30 border-yellow-500/50' : 'bg-card'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg font-headline">
          {column.name}
          {isConfirmed && <Badge variant="secondary" className="gap-1 bg-green-500/80 text-white"><CheckCircle2 className="w-4 h-4"/> Confirmed</Badge>}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {aiResult.confidence < 80 && !isConfirmed && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
          {aiResult.confidence < 80 && !isConfirmed ? 'Type Ambiguous' : 'AI Detected Type'}
          (<Bot className="inline w-4 h-4"/> <span className={confidenceColor}>{aiResult.confidence}% sure</span>)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
          <TypeIconComponent type={aiResult.detectedType} />
          <span className="font-bold">{aiResult.detectedType}</span>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-medium text-muted-foreground">Sample Values:</h4>
          <p className="p-2 text-xs rounded-md font-code bg-black/30">
            {column.sampleValues.slice(0, 5).join(', ')}
          </p>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={handleConfirm} disabled={isConfirmed} className="gap-2">
          <Check className="w-4 h-4"/> Accept {selectedType}
        </Button>
        <Select
          value={selectedType || undefined}
          onValueChange={(value: DataType) => setSelectedType(value)}
          disabled={isConfirmed}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Change to..." />
          </SelectTrigger>
          <SelectContent>
            {(['NUMERIC', 'TEXT', 'DATE', 'CATEGORICAL'] as DataType[]).map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
};

const TypeInferencePanel = ({ data, addAuditLog, confirmedTypes, setConfirmedTypes }: TypeInferencePanelProps) => {
  const handleConfirmType = (columnName: string, type: DataType) => {
    setConfirmedTypes(prev => ({
      ...prev,
      [columnName]: { type, confirmedBy: 'user', timestamp: new Date() },
    }));
    addAuditLog('TYPE_CONFIRMED', { column: columnName, type });
  };
  
  const totalColumns = data.columnProfiles.length;
  const confirmedCount = Object.keys(confirmedTypes).length;

  return (
    <Card className="flex flex-col h-full">
        <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl font-headline">
                <span>Confirm Column Types</span>
                <Badge variant="outline">{confirmedCount} / {totalColumns} Confirmed</Badge>
            </CardTitle>
            <CardDescription>
                Review the AI-detected data types for each column. Your confirmations will be used to generate the cleaning script.
            </CardDescription>
        </CardHeader>
        <CardContent className="relative flex-1 p-0">
            <ScrollArea className="absolute inset-0">
                <div className="p-6 pt-0 pr-8 space-y-4">
                    {data.columnProfiles.map(col => (
                        <TypeConfirmationCard
                        key={col.name}
                        column={col}
                        fileSize={data.fileSize}
                        sparsityScore={data.sparsityScore}
                        onConfirm={handleConfirmType}
                        isConfirmed={!!confirmedTypes[col.name]}
                        />
                    ))}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
};

export default TypeInferencePanel;
