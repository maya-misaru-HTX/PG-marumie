# CustomGPT セットアップガイド

## CustomGPT の作成手順

### 1. ChatGPT にアクセス
1. ChatGPT Plus アカウントでログイン
2. 左サイドバーの「Explore GPTs」をクリック
3. 「Create a GPT」ボタンをクリック

### 2. 基本情報を設定

**Name (名前):**
```
政治資金報告書CSVコンバーター
```

**Description (説明):**
```
PDFからOCRで抽出されたテキストを、政治資金収支報告書のCSV形式に変換します。散らばったテキストから構造化データを再構築し、すぐにアップロード可能なCSVファイルを生成します。
```

### 3. Instructions (指示) を設定

`customgpt-instructions.md` ファイルの内容を全てコピーして、Instructions フィールドに貼り付けてください。

### 4. Knowledge (知識ベース) にファイルをアップロード

以下のファイルをアップロードしてください：

1. **csv-template-example.csv**
   - CSVフォーマットの具体例
   - CustomGPTはこのファイルを参照して正しい形式を理解します

### 5. Conversation starters (会話の開始例) を設定

以下の例を追加してください：

```
OCRテキストを貼り付けてください
```

```
政治資金報告書のPDFから抽出したテキストを変換したいです
```

### 6. Capabilities (機能) を設定

- **Web Browsing**: オフ
- **DALL·E Image Generation**: オフ
- **Code Interpreter**: オン（CSVファイル生成に使用）

### 7. Actions (外部API連携)

不要 - 設定しない

---

## 使用方法

### アプリ側の変更

#### 1. PdfPromptGenerator コンポーネントを簡素化

プロンプトをコピーする代わりに、**OCRテキストのみをコピー**できるようにします：

```typescript
// プロンプト全体ではなく、OCRテキストのみをコピー
const handleCopyOCRText = async () => {
  if (!extractedText) return;

  try {
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  } catch (error) {
    console.error('コピーエラー:', error);
  }
};
```

#### 2. ユーザーフロー

1. **PDFをアップロード** → OCR処理
2. **「OCRテキストをコピー」ボタン**をクリック
3. **CustomGPTを開く**（新しいタブ）
4. **テキストを貼り付け**
5. CustomGPTが自動的にCSVを生成
6. **CSVをダウンロード**
7. **元のアプリに戻ってCSVをアップロード**

### CustomGPT の利点

✅ **プロンプト管理が不要** - CustomGPTに内蔵
✅ **CSVテンプレートのダウンロード不要** - Knowledge に含まれる
✅ **ユーザー体験がシンプル** - テキストを貼り付けるだけ
✅ **一貫した品質** - 同じルールで常に変換
✅ **更新が簡単** - CustomGPTの設定を変更するだけ

---

## テスト方法

1. サンプルのOCRテキストを用意
2. CustomGPTに貼り付け
3. 生成されたCSVをダウンロード
4. アプリにアップロードして正しく表示されるか確認

---

## トラブルシューティング

### Q: CustomGPTがCSVを生成しない
A: Instructions が正しく貼り付けられているか確認してください

### Q: メタデータが空になる
A: Knowledge に csv-template-example.csv がアップロードされているか確認

### Q: 数値が間違っている
A: Instructions の「計算関係」セクションを確認し、INCOME_TOTAL と収入総額の違いが明記されているか確認

---

## ファイル一覧

1. **customgpt-instructions.md** - CustomGPT の Instructions にコピー
2. **csv-template-example.csv** - Knowledge にアップロード
3. **CustomGPT-Setup-Guide.md** - このファイル（セットアップ手順）

---

## 今後の改善案

- 複数PDFの一括処理対応
- エラーハンドリングの強化
- 日付フォーマットの自動認識改善
- カテゴリーの自動推測機能
