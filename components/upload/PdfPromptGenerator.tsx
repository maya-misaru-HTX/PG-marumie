'use client';

import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { FileText, Download, AlertCircle, CheckCircle2, Loader2, Copy, Check } from 'lucide-react';
import { generateCSVTemplate } from '@/lib/parsers/csvParser';

// File size limits (20MB recommended for reasonable processing time)
// Google Cloud Vision API: 20MB hard limit
// Tesseract.js: No limit, but larger files take much longer to process
const MAX_FILE_SIZE_MB = 20;
const MAX_PAGES = 150;
const WARN_FILE_SIZE_MB = 10;
const WARN_PAGES = 50;

// Simplified prompt for CustomGPT (only includes OCR text)
const MAIN_PROMPT = `以下は政治資金収支報告書のPDFから抽出したOCRテキストです：

================================================================================
OCR抽出テキスト
================================================================================

`;

// No page template needed - just include raw OCR text
// No footer needed - CustomGPT has all instructions built in

interface PdfPromptGeneratorProps {
  autoStartFile?: File | null;
}

export function PdfPromptGenerator({ autoStartFile }: PdfPromptGeneratorProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [resultPrompt, setResultPrompt] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-hide error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-start processing when autoStartFile is provided
  useEffect(() => {
    if (!autoStartFile) {
      console.log('PdfPromptGenerator: No autoStartFile, skipping');
      return;
    }

    const startAutoProcess = async () => {
      console.log('PdfPromptGenerator: Auto-start triggered with file:', autoStartFile.name);
      console.log('PdfPromptGenerator: File type:', autoStartFile.type);
      console.log('PdfPromptGenerator: File size:', autoStartFile.size);

      // Reset all state for new file
      setError('');
      setWarning('');
      setResultPrompt('');
      setProgress('');
      setProcessingProgress(0);
      setCurrentPage(0);
      setTotalPages(0);

      // Set selected file first
      setSelectedFile(autoStartFile);

      // Validate file - check both MIME type and extension
      const isPDF = autoStartFile.type === 'application/pdf' || autoStartFile.name.toLowerCase().endsWith('.pdf');

      if (!isPDF) {
        console.error('PdfPromptGenerator: Not a PDF file');
        setError('PDFファイルのみ対応しています。');
        return;
      }

      const fileSizeMB = autoStartFile.size / (1024 * 1024);
      console.log('PdfPromptGenerator: File size MB:', fileSizeMB);

      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        console.error('PdfPromptGenerator: File too large');
        setError(`ファイルサイズが大きすぎます（${fileSizeMB.toFixed(1)}MB）。${MAX_FILE_SIZE_MB}MB以下のファイルを選択してください。`);
        return;
      }

      if (fileSizeMB > WARN_FILE_SIZE_MB) {
        setWarning(`ファイルサイズが${fileSizeMB.toFixed(1)}MBです。処理に時間がかかる場合があります。`);
      }

      // Start processing immediately
      console.log('PdfPromptGenerator: Starting OCR processing...');
      setIsProcessing(true);
      setProgress('文字認識を開始しています...');
      setProcessingProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', autoStartFile);

        console.log('PdfPromptGenerator: Calling /api/ocr...');
        const response = await fetch('/api/ocr', {
          method: 'POST',
          body: formData,
        });

        console.log('PdfPromptGenerator: Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('PdfPromptGenerator: API error:', errorData);
          throw new Error(errorData.error || '文字認識に失敗しました');
        }

        const data = await response.json();
        console.log('PdfPromptGenerator: API response:', data);

        if (data.success && data.text) {
          const finalPrompt = MAIN_PROMPT + data.text;
          setResultPrompt(finalPrompt);
          setProgress('完了しました！文字認識が成功しました。');
          setProcessingProgress(100);
          console.log('PdfPromptGenerator: OCR completed successfully');
        } else {
          throw new Error('OCRテキストの抽出に失敗しました');
        }
      } catch (error) {
        console.error('PdfPromptGenerator: OCR processing error:', error);
        setError(error instanceof Error ? error.message : '文字認識中にエラーが発生しました');
      } finally {
        setIsProcessing(false);
        setCurrentPage(0);
      }
    };

    startAutoProcess();
  }, [autoStartFile]);

  // OCR.space APIを使用してPDFを処理
  const handleProcess = async (file?: File) => {
    const targetFile = file || selectedFile;

    if (!targetFile) {
      setError('PDFファイルを選択してください。');
      return;
    }

    setIsProcessing(true);
    setProgress('文字認識を開始しています...');
    setProcessingProgress(0);
    setResultPrompt('');
    setError('');

    let progressInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      setProgress('PDFから文字を読み取っています...');
      setProcessingProgress(10);

      // Start simulated progress while OCR is processing
      progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          // Gradually increase to 85% while waiting for OCR
          // Speed slows down as it approaches the limit
          if (prev < 50) {
            return prev + 1; // Fast progress initially
          } else if (prev < 70) {
            return prev + 0.5; // Slower progress
          } else if (prev < 85) {
            return prev + 0.2; // Very slow progress
          }
          return prev;
        });
      }, 300); // Update every 300ms

      // Set timeout for OCR processing (5 minutes)
      const TIMEOUT_MS = 5 * 60 * 1000;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('OCR処理がタイムアウトしました。PDFが大きすぎる可能性があります。ページ数を減らして再度お試しください。'));
        }, TIMEOUT_MS);
      });

      // Call our API route
      const formData = new FormData();
      formData.append('file', targetFile);

      const fetchPromise = fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      // Race between API call and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      // Stop simulated progress and clear timeout
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setProcessingProgress(70);

      console.log('OCR API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OCR API error response:', errorData);
        throw new Error(errorData.error || '文字認識に失敗しました');
      }

      const data = await response.json();
      console.log('OCR API success response:', {
        success: data.success,
        textLength: data.text?.length,
        pageCount: data.pageCount
      });

      if (!data.success) {
        throw new Error(data.error || '文字認識に失敗しました');
      }

      setProgress('テキストを抽出しています...');
      setProcessingProgress(80);

      const extractedText = data.text || '';
      const pageCount = data.pageCount || 1;

      setTotalPages(pageCount);

      // プロンプトを生成
      setProgress('プロンプトを生成しています...');
      setProcessingProgress(90);

      // Simple prompt: just header + OCR text for CustomGPT
      const finalPrompt = MAIN_PROMPT + extractedText;
      console.log('Generated prompt length:', finalPrompt.length);
      setResultPrompt(finalPrompt);

      setProcessingProgress(100);
      setProgress('処理が完了しました！');
      console.log('Processing complete, resultPrompt set');
    } catch (error) {
      console.error('処理中にエラーが発生しました:', error);
      // Clear interval and timeout in case of error
      if (progressInterval) clearInterval(progressInterval);
      if (timeoutId) clearTimeout(timeoutId);
      setError(`エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setProgress('');
      setProcessingProgress(0);
    } finally {
      setIsProcessing(false);
      setCurrentPage(0);
    }
  };

  // CSVテンプレートをダウンロード
  const handleDownloadTemplate = () => {
    try {
      const template = generateCSVTemplate();
      const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '政治資金報告書テンプレート.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ダウンロード中にエラーが発生しました:', error);
      setError('CSVテンプレートのダウンロードに失敗しました。');
    }
  };

  // プロンプトをクリップボードにコピー
  const handleCopyPrompt = async () => {
    if (!resultPrompt) {
      setError('コピーする内容がありません。');
      return;
    }

    try {
      await navigator.clipboard.writeText(resultPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('コピー中にエラーが発生しました:', error);
      setError('クリップボードへのコピーに失敗しました。');
    }
  };

  const fileSizeMB = selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) : '0';

  return (
    <Card>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-1 md:mb-2">
            読み込み可能な形式に変更！
          </h2>
          <p className="text-text-secondary text-sm md:text-base mb-3 md:mb-4">
            PDFからテキストを抽出し、AIを使ってCSVファイルを作成する手順をご案内します
          </p>

          {/* Instructions */}
          {!resultPrompt && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-[16px] md:rounded-[22px] p-4 md:p-6">
              <h3 className="font-bold text-text-primary text-sm md:text-base mb-2 md:mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 md:w-5 md:h-5" />
                使い方
              </h3>
              <ol className="text-xs md:text-sm text-text-primary space-y-1.5 md:space-y-2 list-decimal list-inside">
                <li>PDFから文字を自動で読み取ります（数秒〜数分）</li>
                <li>処理完了後、OCRテキストをコピー</li>
                <li>CustomGPTにテキストを貼り付けてCSV変換</li>
                <li>生成されたCSVファイルを保存して、メインページにアップロード</li>
              </ol>
            </div>
          )}
        </div>

        {/* Errors */}
        {error && (
          <div className="p-3 md:p-4 bg-red-50 border-2 border-red-200 rounded-[16px] md:rounded-[22px] flex items-start gap-2 md:gap-3">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Warnings */}
        {warning && !error && !resultPrompt && (
          <div className="p-3 md:p-4 bg-yellow-50 border-2 border-yellow-200 rounded-[16px] md:rounded-[22px] flex items-start gap-2 md:gap-3">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs md:text-sm text-yellow-800">{warning}</p>
          </div>
        )}

        {/* Debug Info - Remove after testing */}
        <div className="p-3 bg-gray-100 rounded text-xs">
          <p>Debug: autoStartFile = {autoStartFile ? autoStartFile.name : 'null'}</p>
          <p>Debug: selectedFile = {selectedFile ? selectedFile.name : 'null'}</p>
          <p>Debug: isProcessing = {isProcessing ? 'true' : 'false'}</p>
          <p>Debug: progress = {progress || 'empty'}</p>
          <p>Debug: error = {error || 'none'}</p>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div className="p-3 md:p-4 bg-neutral-50 rounded-[12px] md:rounded-[16px] flex items-center gap-2 md:gap-3">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm font-medium text-text-primary truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-text-secondary">
                {fileSizeMB}MB
                {totalPages > 0 && ` • ${totalPages}ページ`}
              </p>
            </div>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="p-3 md:p-4 bg-primary-50 rounded-[16px] md:rounded-[22px]">
            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
              {isProcessing ? (
                <Loader2 className="w-4 h-4 md:w-5 md:h-5 text-primary-600 animate-spin flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-primary-600 flex-shrink-0" />
              )}
              <p className="text-xs md:text-sm text-primary-900">{progress}</p>
            </div>
            {isProcessing && (
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex justify-between text-xs text-primary-700">
                  <span>
                    {currentPage > 0 && `ページ ${currentPage}/${totalPages}`}
                  </span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <div className="w-full bg-primary-200 rounded-full h-1.5 md:h-2 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {resultPrompt && (
          <>
            <div>
              <label className="block mb-1.5 md:mb-2 font-medium text-text-primary text-sm md:text-base">
                PDFから抽出されたテキスト
              </label>
              <textarea
                value={resultPrompt}
                readOnly
                className="w-full h-64 md:h-96 p-3 md:p-4 border-2 border-neutral-200 rounded-[12px] md:rounded-[16px] font-mono text-xs md:text-sm resize-y focus:outline-none focus:border-primary-500 bg-neutral-50"
              />
              <p className="text-xs md:text-sm text-text-secondary mt-1.5 md:mt-2">
                このテキストをCustomGPTに貼り付けると、自動的にCSVファイルが生成されます
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <Button
                  onClick={handleCopyPrompt}
                  variant={copied ? 'primary' : 'primary'}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="text-sm md:text-base">
                    {copied ? 'コピーしました！' : 'テキストをコピー'}
                  </span>
                </Button>
                <Button
                  onClick={() => window.open('https://chatgpt.com/g/g-690bb7351a348191b27654ae6c668720-shou-zhi-bao-gao-marumiejun-gpt', '_blank')}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm md:text-base">ChatGPTを開く</span>
                </Button>
              </div>

              {/* Instructions */}
              <div className="p-3 md:p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-[12px] md:rounded-[16px] space-y-2 md:space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs md:text-sm font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-text-primary">テキストをコピー</p>
                    <p className="text-xs text-text-secondary mt-0.5 md:mt-1">上のボタンでテキストをクリップボードにコピーしてください</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs md:text-sm font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-text-primary">CustomGPTに貼り付け</p>
                    <p className="text-xs text-text-secondary mt-0.5 md:mt-1">政治資金報告書CSVコンバーターCustomGPTを開き、テキストを貼り付けてください</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs md:text-sm font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-text-primary">生成されたCSVをダウンロード</p>
                    <p className="text-xs text-text-secondary mt-0.5 md:mt-1">CustomGPTが自動的にCSVファイルを生成します。保存してください</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs md:text-sm font-bold mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-medium text-text-primary">このページに戻ってアップロード</p>
                    <p className="text-xs text-text-secondary mt-0.5 md:mt-1">生成されたCSVファイルを上部のファイルアップロードエリアにアップロードして可視化します</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </Card>
  );
}
