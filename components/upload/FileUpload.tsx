'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, AlertCircle, Download } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { parseCSV, generateCSVTemplate } from '@/lib/parsers/csvParser';
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

      if (fileType.endsWith('.pdf')) {
        setUploadProgress('PDFを解析しています...');
        // Dynamically import PDF parser only on client side when needed
        const { parsePDF } = await import('@/lib/parsers/pdfParser');
        report = await parsePDF(file);
      } else if (fileType.endsWith('.csv')) {
        setUploadProgress('CSVを解析しています...');
        const text = await file.text();
        report = await parseCSV(text);
      } else {
        throw new Error('サポートされていないファイル形式です。PDFまたはCSVファイルをアップロードしてください。');
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

  const downloadTemplate = () => {
    const template = generateCSVTemplate();
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '政治資金報告書テンプレート.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            政治資金収支報告書 可視化ツール
          </h1>
          <p className="text-text-secondary text-base md:text-lg">
            PDFまたはCSVファイルをアップロードして、政治資金の流れを可視化します
          </p>
        </div>

        <div
          className={`
            border-2 border-dashed rounded-[22px] p-12 text-center transition-all
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
            accept=".pdf,.csv"
            onChange={handleFileInput}
            className="hidden"
            disabled={isProcessing}
          />

          {isProcessing ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto" />
              <p className="text-lg font-medium text-text-primary">{uploadProgress}</p>
            </div>
          ) : (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-primary-500" />
              <p className="text-xl font-medium text-text-primary mb-2">
                ファイルをドラッグ＆ドロップ
              </p>
              <p className="text-text-secondary mb-6">または</p>
              <Button variant="primary" size="lg">
                ファイルを選択
              </Button>
              <p className="text-sm text-text-secondary mt-4">
                PDF・CSV形式に対応（最大10MB）
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-[22px] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">エラー</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-neutral-200">
          <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            CSVテンプレートをダウンロード
          </h2>
          <p className="text-text-secondary mb-4">
            PDFファイルが読み込めない場合は、CSVファイルに変換してアップロードできます。
            下記のテンプレートをダウンロードし、ChatGPTなどのAIツールでPDFからCSVに変換してください。
          </p>
          <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            CSVテンプレートをダウンロード
          </Button>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100 rounded-[22px]">
          <h3 className="font-bold text-text-primary mb-2">💡 ヒント</h3>
          <ul className="text-sm text-text-secondary space-y-2">
            <li>• 総務省の標準フォーマットのPDFに対応しています</li>
            <li>• PDFの読み込みに失敗した場合は、CSVファイルをお試しください</li>
            <li>• データはブラウザ内で処理され、サーバーには送信されません</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
