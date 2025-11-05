'use client';

import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import Button from '../ui/Button';
import Card from '../ui/Card';

// PDF.js worker設定
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

// AIへのメインプロンプト
const MAIN_PROMPT = `# PDFから政治資金収支報告書CSVを生成してください

## 概要
以下のテキストは、スキャンされた政治資金収支報告書PDFからOCRで抽出したデータです。
このデータを分析して、下記のCSVテンプレート形式に変換してください。

## 指示

### 1. ページごとの内容を理解する
- 各ページの内容を確認し、以下のような情報がどのページに記載されているか把握してください：
  - 表紙・基本情報（政治家名、団体名、会計年度）
  - 収支総括表（収入合計、支出合計、繰越金など）
  - 収入の内訳明細
  - 支出の内訳明細
  - 個別の取引記録（日付、金額、支出先など）

### 2. ページをまたいだデータ統合
- **重要：** 複数ページにまたがる表やリストは、ページ番号に関係なく1つのデータとして統合してください
- 同じ項目が複数ページに続いている場合は、すべてのページから情報を収集してください
- ページの途中で切れている表は、次のページと結合して完全な行にしてください
- 重複データを避けてください（同じ取引が複数回出現しないように）

### 3. データ抽出のルール
- OCRで抽出されたテキストから、取引データ（日付、カテゴリー、項目、金額、タイプ、支出先/寄附者、住所、備考）を読み取ってください
- 可能な限り、政治家名、政治団体名、会計年度などのメタデータも抽出してください
- 金額は数値のみ（カンマなし）で出力してください
- 日付は YYYY/MM/DD 形式で出力してください
- タイプは「収入」または「支出」のいずれかを指定してください

### 4. 不完全なデータの処理
- OCRエラーで読み取れない文字がある場合は、文脈から推測するか空欄にしてください
- ページの端で切れている行は、前後のページと照合して復元してください
- 金額の単位に注意してください（「円」を削除し、数値のみにする）

### 5. 出力形式
- 以下のCSVテンプレート形式に従って、CSVファイルの内容を生成してください
- すべてのページから抽出した取引を、1つの統合されたCSVファイルにまとめてください

## CSVテンプレート形式

\`\`\`csv
# 政治資金収支報告書CSVテンプレート v1.0
# メタデータ（オプション）- 以下の行は # で始めてください
#POLITICIAN=政治家名
#ORGANIZATION=政治団体名
#FISCAL_YEAR=2023
#INCOME_TOTAL=10000000
#EXPENSE_TOTAL=8000000
#CARRIED_FROM_PREV=5000000
#CARRIED_TO_NEXT=7000000

# データ行（必須）
日付,カテゴリー,項目,金額,タイプ,支出先/寄附者,住所,備考
2023/04/01,個人からの寄附,桐ヶ谷正裕,100000,収入,,,会社役員
2023/05/27,事務所費,事務所賃料,891010,支出,宇野卓哉,神奈川県横浜市,
2023/06/15,備品・消耗品費,ガソリン代,68395,支出,豊島興油株式会社,東京都千代田区,
\`\`\`

## カテゴリーの参考情報

### 収入カテゴリー
- 個人からの寄附
- 法人その他の団体からの寄附
- 政治団体からの寄附
- 機関紙誌の発行による収入
- 借入金
- その他の収入

### 支出カテゴリー
- 経常経費
- 人件費
- 光熱水費
- 備品・消耗品費
- 事務所費
- 政治活動費
- 組織活動費
- 選挙関係費
- 機関紙誌の発行
- 調査研究費
- 寄附・交付金
- その他の経費

---

# OCRで抽出されたPDFテキスト

`;

// ページごとのテンプレート
const PAGE_TEMPLATE = `
================================================================================
ページ {{PAGE_NUMBER}}
================================================================================

{{PAGE_CONTENT}}

`;

// フッター（最後に追加する指示）
const FOOTER_PROMPT = `

---

# 出力形式と最終確認

## 出力するCSVの構造
1. **メタデータセクション**（#で始まる行）
   - #POLITICIAN=（政治家名）
   - #ORGANIZATION=（政治団体名）
   - #FISCAL_YEAR=（会計年度）
   - #INCOME_TOTAL=（収入合計）
   - #EXPENSE_TOTAL=（支出合計）
   - #CARRIED_FROM_PREV=（前年繰越額）
   - #CARRIED_TO_NEXT=（翌年繰越額）

2. **ヘッダー行**
   - 日付,カテゴリー,項目,金額,タイプ,支出先/寄附者,住所,備考

3. **データ行**
   - 全ページから抽出した取引を統合して出力
   - 日付順に並べる（古い順推奨）
   - 収入と支出を混在させて問題ありません（タイプ列で区別）

## 最終確認事項
- [ ] すべてのページを確認し、取引データを漏れなく抽出しましたか？
- [ ] ページをまたぐ表を正しく統合しましたか？
- [ ] 重複データを削除しましたか？
- [ ] 金額からカンマや「円」を削除しましたか？
- [ ] 日付を YYYY/MM/DD 形式にしましたか？
- [ ] メタデータ（合計金額など）をページから抽出しましたか？

## 出力してください
上記を確認した上で、完全なCSVファイルの内容を生成してください。
\`\`\`csv で囲んで出力すると、コピーしやすくなります。
`;

interface PageText {
  page: number;
  text: string;
}

export function PdfPromptGenerator() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [resultPrompt, setResultPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setResultPrompt(''); // 新しいファイル選択時は結果をクリア
    } else {
      alert('PDFファイルを選択してください。');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // PDFを画像化してOCR処理を実行
  const handleProcess = async () => {
    if (!selectedFile) {
      alert('PDFファイルを選択してください。');
      return;
    }

    setIsProcessing(true);
    setProgress('処理を開始しています...');
    setResultPrompt('');

    try {
      // PDFファイルを読み込み
      const fileBuffer = await selectedFile.arrayBuffer();
      setProgress('PDFを読み込んでいます...');

      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
      const totalPages = pdf.numPages;
      setProgress(`PDFを読み込みました（全${totalPages}ページ）`);

      // Tesseract.js workerを初期化
      setProgress('OCRエンジンを初期化しています...');
      const worker = await createWorker('jpn', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR進捗: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const pageTexts: PageText[] = [];

      // 全ページを処理
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setProgress(`ページ ${pageNum}/${totalPages} を処理中...`);

        // PDFページを取得
        const page = await pdf.getPage(pageNum);

        // ビューポートを設定（OCR精度向上のため scale を 2.0 に設定）
        const viewport = page.getViewport({ scale: 2.0 });

        // Canvasに描画
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas context could not be created');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        // CanvasからデータURLを取得
        const imageData = canvas.toDataURL('image/png');

        // OCR処理
        setProgress(`ページ ${pageNum}/${totalPages} のOCR処理中...`);
        const { data } = await worker.recognize(imageData);

        // 結果を保存
        pageTexts.push({
          page: pageNum,
          text: data.text.trim(),
        });

        console.log(`ページ ${pageNum} の処理完了`);
      }

      // Workerを終了
      await worker.terminate();

      // プロンプトを生成
      setProgress('プロンプトを生成しています...');
      const pagesContent = pageTexts
        .map((pt) =>
          PAGE_TEMPLATE
            .replace('{{PAGE_NUMBER}}', pt.page.toString())
            .replace('{{PAGE_CONTENT}}', pt.text)
        )
        .join('\n');

      const finalPrompt = MAIN_PROMPT + pagesContent + FOOTER_PROMPT;
      setResultPrompt(finalPrompt);

      setProgress('処理が完了しました！');
    } catch (error) {
      console.error('処理中にエラーが発生しました:', error);
      setProgress('エラーが発生しました。コンソールを確認してください。');
      alert(`エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Markdownファイルとしてダウンロード
  const handleDownload = () => {
    if (!resultPrompt) {
      alert('ダウンロードする内容がありません。');
      return;
    }

    try {
      // Blobを作成
      const blob = new Blob([resultPrompt], {
        type: 'text/markdown;charset=utf-8',
      });

      // ダウンロード用のURLを生成
      const url = URL.createObjectURL(blob);

      // 一時的なaタグを作成してクリック
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prompt.md';
      document.body.appendChild(link);
      link.click();

      // クリーンアップ
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ダウンロード中にエラーが発生しました:', error);
      alert('ダウンロードに失敗しました。');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">政治資金報告書 PDF→CSV 変換ツール</h2>
          <p className="text-gray-600 mb-2">
            PDFファイルからテキストを抽出し、AIがCSVファイルを生成するためのプロンプトを作成します。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-2">使い方：</p>
            <ol className="text-blue-800 space-y-1 list-decimal list-inside">
              <li>政治資金収支報告書のPDFをアップロード</li>
              <li>OCR処理を実行して、Markdownファイルをダウンロード</li>
              <li>ダウンロードしたMarkdownをChatGPT/Claude/Geminiに投げる</li>
              <li>AIが生成したCSVファイルを保存して、メインページにアップロード</li>
            </ol>
          </div>
        </div>

        {/* ファイル入力 */}
        <div>
          <label className="block mb-2 font-medium">PDFファイルを選択</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {selectedFile && (
            <p className="mt-2 text-sm text-gray-600">
              選択されたファイル: {selectedFile.name}
            </p>
          )}
        </div>

        {/* 処理ボタン */}
        <div className="flex gap-4">
          <Button
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="flex-1"
          >
            {isProcessing ? '処理中...' : 'OCR処理を実行'}
          </Button>
        </div>

        {/* 進捗表示 */}
        {progress && (
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">{progress}</p>
            {isProcessing && (
              <div className="mt-2">
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-full animate-pulse" style={{ width: '100%' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 結果表示 */}
        {resultPrompt && (
          <>
            <div>
              <label className="block mb-2 font-medium">生成されたプロンプト（プレビュー）</label>
              <textarea
                value={resultPrompt}
                readOnly
                className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                このプロンプトには、OCRで抽出したテキストとCSV変換の指示が含まれています。
              </p>
            </div>

            {/* ダウンロードボタン */}
            <div className="space-y-2">
              <Button
                onClick={handleDownload}
                className="w-full"
                variant="primary"
              >
                📥 AIに投げる用のプロンプトをダウンロード（.md）
              </Button>
              <p className="text-sm text-gray-600 text-center">
                このファイルをChatGPT、Claude、またはGeminiにアップロードすると、CSV形式のデータが生成されます
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
