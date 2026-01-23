
'use client';

import { useState, useEffect } from 'react';
import type { ProcessedCsvData, AuditLogEntry, ConfirmedTypes, DataType, ColumnAnalysisResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, Hash, Type as TypeIcon, Calendar, Tags, CheckCircle2, ToggleRight } from 'lucide-react';
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
    case 'BOOLEAN': return <ToggleRight className="w-4 h-4" />;
    default: return null;
  }
};


const TypeConfirmationCard = ({
  column,
  aiResult,
  onConfirm,
  isConfirmed,
}: {
  column: ProcessedCsvData['columnProfiles'][0];
  aiResult: ColumnAnalysisResult | undefined;
  onConfirm: (columnName: string, type: DataType) => void;
  isConfirmed: boolean;
}) => {
  const [selectedType, setSelectedType] = useState<DataType | null>(aiResult?.detectedType || null);

  useEffect(() => {
    if(aiResult) {
        setSelectedType(aiResult.detectedType);
    }
  }, [aiResult]);

  const handleConfirm = () => {
    if (selectedType) {
      onConfirm(column.name, selectedType);
    }
  };

  if (!aiResult) {
    return (
        <Card className="border-muted/50 bg-muted/20">
            <CardHeader><CardTitle className="text-lg font-headline">{column.name}</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Waiting for analysis...</p>
            </CardContent>
        </Card>
    );
  }

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
          {aiResult.confidence < 80 && !isConfirmed ? 'Type Ambiguous' : 'Heuristically Detected Type'}
           (<span className={confidenceColor}>{aiResult.confidence}% confidence</span>)
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
            {(['NUMERIC', 'TEXT', 'DATE', 'CATEGORICAL', 'BOOLEAN'] as DataType[]).map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
};

const TypeInferencePanel = ({ data, addAuditLog, confirmedTypes, setConfirmedTypes }: TypeInferencePanelProps) => {
  const [analysisResults, setAnalysisResults] = useState<ColumnAnalysisResult[] | null>(null);

  /**
   * Replaces API calls with local, heuristic-based type inference for speed and reliability.
   */
  function inferTypeLocally(values: string[]): { detectedType: DataType, confidence: number } {
    const validValues = values.filter(v => v !== null && v?.toString().trim() !== '');
    if (validValues.length === 0) {
      return { detectedType: 'TEXT', confidence: 20 };
    }

    const uniqueValues = new Set(validValues.map(v => v.toString().trim().toLowerCase()));
    const uniqueCount = uniqueValues.size;

    // Boolean check
    const isBinary = (uniqueValues.has('true') && uniqueValues.has('false') && uniqueCount <= 2) ||
                     (uniqueValues.has('yes') && uniqueValues.has('no') && uniqueCount <= 2) ||
                     (uniqueValues.has('1') && uniqueValues.has('0') && validValues.every(v => ['1', '0'].includes(v)));
    if (isBinary) {
      return { detectedType: 'BOOLEAN', confidence: 95 };
    }

    // Numeric check
    const areAllNumeric = validValues.every(v => {
        const cleaned = v.toString().replace(/,/g, '');
        return cleaned.trim() !== '' && !isNaN(Number(cleaned));
    });
    if (areAllNumeric) {
      return { detectedType: 'NUMERIC', confidence: 98 };
    }
    
    // Date check (stricter)
    const isDate = (v: string) => {
        // Rule 3: Exclude common ID patterns
        if (/^(sub|id|pat)/i.test(v.trim())) {
            return false;
        }
        // Rule 1 & 2: Parsable and contains a year-like number
        return !isNaN(Date.parse(v)) && /(19|20)\d{2}/.test(v);
    };

    const dateLikeCount = validValues.filter(isDate).length;
    if (dateLikeCount / validValues.length > 0.7) { // If > 70% of values look like dates
        return { detectedType: 'DATE', confidence: 90 };
    }

    // Categorical check
    if (uniqueCount <= 10 && uniqueCount / validValues.length < 0.6) {
      return { detectedType: 'CATEGORICAL', confidence: 80 };
    }
    
    return { detectedType: 'TEXT', confidence: 60 };
  }

  useEffect(() => {
    if (!data?.columnProfiles?.length) return;

    const results = data.columnProfiles.map(profile => {
        const { detectedType, confidence } = inferTypeLocally(profile.sampleValues);
        return {
            columnName: profile.name,
            detectedType,
            confidence
        };
    });
    setAnalysisResults(results);

  }, [data]);


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
                Review the heuristically-detected data types for each column. Your confirmations will be used to generate the cleaning script.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-y-hidden">
            <ScrollArea className="w-full h-full">
                <div className="p-6 pt-0 pr-8 space-y-4">
                    {!analysisResults && Array.from({ length: Math.min(totalColumns, 5) }).map((_, i) => (
                      <p key={i} className="text-sm text-center text-muted-foreground">Analyzing types...</p>
                    ))}
                    {analysisResults && data.columnProfiles.map(col => {
                        const result = analysisResults?.find(r => r.columnName === col.name);
                        return (
                            <TypeConfirmationCard
                                key={col.name}
                                column={col}
                                aiResult={result}
                                onConfirm={handleConfirmType}
                                isConfirmed={!!confirmedTypes[col.name]}
                            />
                        )
                    })}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
};

export default TypeInferencePanel;
