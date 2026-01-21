'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileCsv } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileProcess: (file: File) => void;
}

const FileUpload = ({ onFileProcess }: FileUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setIsDragging(false);
    if (fileRejections.length > 0) {
      fileRejections.forEach(({ errors }) => {
        errors.forEach((error: any) => {
          toast({
            title: 'File Upload Error',
            description: error.message,
            variant: 'destructive',
          });
        });
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileProcess(acceptedFiles[0]);
    }
  }, [onFileProcess, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div className="flex items-center justify-center h-full p-4 md:p-12">
      <div
        {...getRootProps()}
        className={`w-full max-w-2xl p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
          ${isDragActive || isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4">
          <UploadCloud className={`w-16 h-16 transition-transform duration-300 ${isDragActive || isDragging ? 'scale-110 text-primary' : 'text-muted-foreground'}`} />
          <h2 className="text-2xl font-bold font-headline">Drag & Drop your CSV file here</h2>
          <p className="text-muted-foreground">or click to select a file</p>
          <div className="mt-4 text-sm text-center text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
                <FileCsv className="w-5 h-5" />
                <span>.csv files only</span>
            </div>
            <p>Maximum file size: 500MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
