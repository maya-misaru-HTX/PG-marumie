'use client';

import { useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { parseXLSX } from '@/lib/parsers/xlsxParser';
import { ExpenseReport } from '@/lib/types';
import { enrichReportWithCalculations } from '@/lib/calculations/aggregations';

interface FileUploadProps {
  onReportLoaded: (report: ExpenseReport) => void;
}

export default function FileUpload({ onReportLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setIsProcessing(true);
    setUploadProgress('ファイルを読み込んでいます...');

    try {
      const fileType = file.name.toLowerCase();
      let report: ExpenseReport;

      if (fileType.endsWith('.xlsx') || fileType.endsWith('.xls')) {
        setUploadProgress('Excelファイルを解析しています...');
        report = await parseXLSX(file);
      } else {
        throw new Error('サポートされていないファイル形式です。Excelファイル（.xlsx または .xls）をアップロードしてください。');
      }

      setUploadProgress('データを集計しています...');
      const enrichedReport = enrichReportWithCalculations(report);

      setUploadProgress('完了しました！');
      setTimeout(() => {
        onReportLoaded(enrichedReport);
      }, 500);
    } catch (err) {
      console.error('File processing error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'ファイルの処理中にエラーが発生しました。ファイル形式を確認してください。'
      );
      setIsProcessing(false);
      setUploadProgress('');
    }
  };


  return (
    <Card>
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-2 md:mb-4">
          贅沢まる見え君🔍
        </h1>
        <p className="text-text-secondary text-sm md:text-base lg:text-lg">
          政治家の収支報告書データを可視化します
        </p>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-[16px] md:rounded-[22px] p-4 md:p-6 text-center transition-all
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 bg-neutral-50'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-500'}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
            <p className="text-sm md:text-base font-medium text-text-primary">{uploadProgress}</p>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-primary-500" />
            <p className="text-sm md:text-base font-medium text-text-primary mb-1">
              ファイルをドラッグ＆ドロップ
            </p>
            <p className="text-text-secondary text-xs md:text-sm mb-2 md:mb-3">または</p>
            <Button variant="primary" size="md">
              ファイルを選択
            </Button>
            <p className="text-xs text-text-secondary mt-2">
              Excel形式に対応（最大20MB）
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-[16px]">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </Card>
  );
}
