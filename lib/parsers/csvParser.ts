import Papa from 'papaparse';
import { ExpenseReport, Transaction, PoliticianInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CSVRow {
  '日付': string;
  'カテゴリー': string;
  '項目': string;
  '金額': string;
  'タイプ': string;
  '支出先/寄附者'?: string;
  '住所'?: string;
  '備考'?: string;
}

interface CSVMetadata {
  POLITICIAN?: string;
  ORGANIZATION?: string;
  FISCAL_YEAR?: string;
  INCOME_TOTAL?: string;
  EXPENSE_TOTAL?: string;
  CARRIED_FROM_PREV?: string;
  CARRIED_TO_NEXT?: string;
}

export function parseCSV(csvText: string): Promise<ExpenseReport> {
  return new Promise((resolve, reject) => {
    // Extract metadata from comments
    const metadata: CSVMetadata = {};
    const lines = csvText.split('\n');
    const dataLines: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, value] = trimmed.substring(1).split('=');
        metadata[key.trim() as keyof CSVMetadata] = value.trim();
      } else if (!trimmed.startsWith('#')) {
        dataLines.push(line);
      }
    });

    const csvData = dataLines.join('\n');

    Papa.parse<CSVRow>(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = results.data.map((row, index) => ({
            id: uuidv4(),
            date: parseJapaneseDate(row['日付']),
            category: row['カテゴリー'] || '',
            description: row['項目'] || '',
            recipient: row['支出先/寄附者'],
            location: row['住所'],
            amount: parseAmount(row['金額']),
            type: row['タイプ'] === '収入' ? 'income' : 'expense',
            notes: row['備考'],
          }));

          const politician: PoliticianInfo = {
            name: metadata.POLITICIAN || '不明',
            organization: metadata.ORGANIZATION || '不明',
            fiscalYear: metadata.FISCAL_YEAR || new Date().getFullYear().toString(),
          };

          // Calculate totals from transactions if not provided
          const incomeTotal = metadata.INCOME_TOTAL
            ? parseFloat(metadata.INCOME_TOTAL)
            : transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

          const expenseTotal = metadata.EXPENSE_TOTAL
            ? parseFloat(metadata.EXPENSE_TOTAL)
            : transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

          const carriedFromPrevYear = metadata.CARRIED_FROM_PREV
            ? parseFloat(metadata.CARRIED_FROM_PREV)
            : 0;

          const carriedToNextYear = metadata.CARRIED_TO_NEXT
            ? parseFloat(metadata.CARRIED_TO_NEXT)
            : 0;

          const report: Partial<ExpenseReport> = {
            politician,
            summary: {
              incomeTotal,
              expenseTotal,
              balance: incomeTotal - expenseTotal,
              carriedFromPrevYear,
              carriedToNextYear,
            },
            transactions,
            metadata: {
              uploadedAt: new Date().toISOString(),
              source: 'csv',
              fiscalYear: politician.fiscalYear,
            },
          };

          resolve(report as ExpenseReport);
        } catch (error) {
          reject(new Error(`CSV parsing error: ${error}`));
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV file error: ${error.message}`));
      },
    });
  });
}

function parseJapaneseDate(dateStr: string): string {
  // Handle various date formats
  // Format: 2023/04/01 or 令和5年4月1日
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // If already in YYYY/MM/DD or YYYY-MM-DD format
  if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-');
  }

  // Parse 令和 format
  const reiwaMatch = dateStr.match(/令和?(\d+)年(\d+)月(\d+)日/);
  if (reiwaMatch) {
    const reiwaYear = parseInt(reiwaMatch[1]);
    const westernYear = 2018 + reiwaYear; // 令和1年 = 2019
    const month = reiwaMatch[2].padStart(2, '0');
    const day = reiwaMatch[3].padStart(2, '0');
    return `${westernYear}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  // Remove commas and parse
  return parseFloat(amountStr.replace(/,/g, '')) || 0;
}

// Generate a template CSV string
export function generateCSVTemplate(): string {
  return `# 政治資金収支報告書CSVテンプレート v1.0
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
`;
}
