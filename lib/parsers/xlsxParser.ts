import * as XLSX from 'xlsx';
import { ExpenseReport, Transaction, PoliticianInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface XLSXMetadata {
  politician?: string;
  organization?: string;
  fiscalYear?: string;
  party?: string;
  hereditary?: string;
  electionCount?: number;
  address?: string;
  accountant?: string;
  representative?: string;
  incomeTotal?: number;
  expenseTotal?: number;
  thisYearExpense?: number;
  carriedFromPrev?: number;
  carriedToNext?: number;
}

export function parseXLSX(file: File): Promise<ExpenseReport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('ファイルの読み込みに失敗しました');
        }

        const workbook = XLSX.read(data, { type: 'array' });

        // Check if this is the new format (META DATA + LINE ITEMS)
        const hasNewFormat = workbook.SheetNames.includes('META DATA') && workbook.SheetNames.includes('LINE ITEMS');

        let metadata: XLSXMetadata;
        let transactions: Transaction[];

        if (hasNewFormat) {
          metadata = extractMetadataNew(workbook);
          transactions = extractTransactionsNew(workbook);
        } else {
          metadata = extractMetadata(workbook);
          transactions = extractTransactions(workbook);
        }

        const politician: PoliticianInfo = {
          name: metadata.politician || '不明',
          organization: metadata.organization || '不明',
          fiscalYear: metadata.fiscalYear || new Date().getFullYear().toString(),
          party: metadata.party,
          hereditary: metadata.hereditary,
          electionCount: metadata.electionCount,
          address: metadata.address,
          accountant: metadata.accountant,
          representative: metadata.representative,
        };

        // Use metadata totals if provided, otherwise calculate from transactions
        const incomeTotal = metadata.incomeTotal ?? transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        // For expense total: if thisYearExpense is provided, calculate total as thisYearExpense + carriedToNext
        // Otherwise use expenseTotal from metadata, or calculate from transactions
        let expenseTotal: number;
        if (metadata.thisYearExpense !== undefined && metadata.carriedToNext !== undefined) {
          expenseTotal = metadata.thisYearExpense + metadata.carriedToNext;
        } else if (metadata.expenseTotal !== undefined) {
          expenseTotal = metadata.expenseTotal;
        } else {
          expenseTotal = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        }

        const report: Partial<ExpenseReport> = {
          politician,
          summary: {
            incomeTotal,
            expenseTotal,
            thisYearExpense: metadata.thisYearExpense,
            balance: incomeTotal - expenseTotal,
            carriedFromPrevYear: metadata.carriedFromPrev ?? 0,
            carriedToNextYear: metadata.carriedToNext ?? 0,
          },
          transactions,
          metadata: {
            uploadedAt: new Date().toISOString(),
            source: 'xlsx',
            fiscalYear: politician.fiscalYear,
          },
        };

        resolve(report as ExpenseReport);
      } catch (error) {
        console.error('XLSX parsing error:', error);
        reject(new Error(`XLSX解析エラー: ${error instanceof Error ? error.message : '不明なエラー'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };

    reader.readAsArrayBuffer(file);
  });
}

function extractMetadata(workbook: XLSX.WorkBook): XLSXMetadata {
  const metadata: XLSXMetadata = {};

  // Try to find cover/summary sheets
  const coverSheetNames = workbook.SheetNames.filter(name =>
    name.includes('表紙') || name.includes('その1')
  );

  const summarySheetNames = workbook.SheetNames.filter(name =>
    name.includes('総括') || name.includes('その2')
  );

  // Extract metadata from cover sheet
  if (coverSheetNames.length > 0) {
    const sheet = workbook.Sheets[coverSheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    data.forEach((row: any[]) => {
      if (!row || row.length < 2) return;

      const key = String(row[0] || '').trim();
      const value = String(row[1] || '').trim();

      if (key.includes('公職の候補者の氏名')) {
        metadata.politician = value;
      } else if (key.includes('政治団体の名称') || key.includes('団体名')) {
        metadata.organization = value;
      } else if (key.includes('代表者') && value) {
        metadata.representative = value;
      } else if (key.includes('会計責任者') && value) {
        metadata.accountant = value;
      } else if (key.includes('事務所の所在地') || key.includes('住所')) {
        metadata.address = value;
      } else if (key.includes('対象年分') || key.includes('年分')) {
        // Extract year from formats like "令和5年分" or "R5"
        const yearMatch = value.match(/令和?(\d+)|R(\d+)/);
        if (yearMatch) {
          const reiwaYear = parseInt(yearMatch[1] || yearMatch[2]);
          metadata.fiscalYear = (2018 + reiwaYear).toString();
        }
      }
    });
  }

  // Extract summary data
  if (summarySheetNames.length > 0) {
    const sheet = workbook.Sheets[summarySheetNames[0]];
    const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    data.forEach((row: any[]) => {
      if (!row || row.length < 2) return;

      const key = String(row[0] || '').trim();
      const value = row[1];

      if (key.includes('前年からの繰越')) {
        metadata.carriedFromPrev = parseAmount(value);
      } else if (key.includes('本年の収入額') || (key.includes('収入総額') && !key.includes('前年'))) {
        metadata.incomeTotal = parseAmount(value);
      } else if (key.includes('支出総額')) {
        metadata.expenseTotal = parseAmount(value);
      } else if (key.includes('翌年への繰越')) {
        metadata.carriedToNext = parseAmount(value);
      }
    });
  }

  return metadata;
}

function extractTransactions(workbook: XLSX.WorkBook): Transaction[] {
  const transactions: Transaction[] = [];

  // Look for transaction detail sheets
  const transactionSheets = workbook.SheetNames.filter(name => {
    const lower = name.toLowerCase();
    // Include sheets with detailed transaction data
    return (
      name.includes('★') ||
      name.includes('その6') ||
      name.includes('その7') ||
      name.includes('その14') ||
      name.includes('その15') ||
      lower.includes('寄附') ||
      lower.includes('支出') && (lower.includes('政治活動') || lower.includes('経常'))
    );
  });

  transactionSheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

    if (data.length === 0) return;

    // Find header row
    const headerRow = data[0] as any[];
    const headers = headerRow.map((h: any) => String(h || '').trim());

    // Map common column names
    const dateCol = findColumnIndex(headers, ['年月日', '日付', '月日']);
    const amountCol = findColumnIndex(headers, ['金額', '額']);
    const categoryCol = findColumnIndex(headers, ['項目別区分', 'カテゴリー', '区分']);
    const subcategoryCol = findColumnIndex(headers, ['飲食ジャンル', 'サブカテゴリー', 'ジャンル']);
    const descCol = findColumnIndex(headers, ['支出の目的', '項目', '目的', '内容']);
    const recipientCol = findColumnIndex(headers, ['支出を受けた者', '氏名', '団体名', '寄附者', '支出先']);
    const addressCol = findColumnIndex(headers, ['住所', '所在地']);
    const urlCol = findColumnIndex(headers, ['URL', 'url', 'ウェブサイト']);
    const notesCol = findColumnIndex(headers, ['備考', 'メモ']);

    // Determine if this is income or expense based on sheet name
    const isIncome = sheetName.includes('収入') || sheetName.includes('寄附');
    const type = isIncome ? 'income' : 'expense';

    // Parse data rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      if (!row || row.length === 0) continue;

      const amount = amountCol >= 0 ? parseAmount(row[amountCol]) : 0;
      if (amount === 0) continue; // Skip rows with no amount

      const transaction: Transaction = {
        id: uuidv4(),
        date: dateCol >= 0 ? parseDate(row[dateCol]) : new Date().toISOString().split('T')[0],
        category: categoryCol >= 0 ? normalizeCategory(String(row[categoryCol] || ''), type) : 'その他',
        subcategory: subcategoryCol >= 0 ? String(row[subcategoryCol] || '').trim() : undefined,
        description: descCol >= 0 ? String(row[descCol] || '') : '',
        recipient: recipientCol >= 0 ? String(row[recipientCol] || '') : undefined,
        location: addressCol >= 0 ? String(row[addressCol] || '') : undefined,
        url: urlCol >= 0 ? String(row[urlCol] || '').trim() : undefined,
        amount,
        type,
        notes: notesCol >= 0 ? String(row[notesCol] || '') : undefined,
      };

      transactions.push(transaction);
    }
  });

  return transactions;
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index >= 0) return index;
  }
  return -1;
}

function parseAmount(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Remove commas and other non-numeric characters except decimal point
    const cleaned = value.replace(/[,円]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function parseDate(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];

  // Handle Excel date numbers
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }

  // Handle string dates
  if (typeof value === 'string') {
    // Format: R5/2/16 or 令和5年2月16日
    const reiwaMatch = value.match(/R(\d+)\/(\d+)\/(\d+)|令和?(\d+)年(\d+)月(\d+)日/);
    if (reiwaMatch) {
      const reiwaYear = parseInt(reiwaMatch[1] || reiwaMatch[4]);
      const month = parseInt(reiwaMatch[2] || reiwaMatch[5]);
      const day = parseInt(reiwaMatch[3] || reiwaMatch[6]);
      const westernYear = 2018 + reiwaYear;
      return `${westernYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Format: YYYY/MM/DD or YYYY-MM-DD
    if (/^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/.test(value)) {
      return value.replace(/\//g, '-');
    }
  }

  return new Date().toISOString().split('T')[0];
}

function normalizeCategory(category: string, type: 'income' | 'expense'): string {
  if (!category) return type === 'income' ? 'その他の収入' : 'その他の経費';

  // Extract main category from detailed category strings
  // Example: "1.組織活動費 (会議費)" -> "組織活動費"
  const cleaned = category.replace(/^\d+\.?\s*/, '').replace(/\s*\(.*\)/, '').trim();

  // Map common categories
  const categoryMap: Record<string, string> = {
    '組織活動費': '組織活動費',
    '選挙関係費': '選挙関係費',
    '機関紙誌': '機関紙誌の発行',
    '調査研究費': '調査研究費',
    '寄附': '寄附・交付金',
    '交付金': '寄附・交付金',
    '人件費': '人件費',
    '光熱水費': '光熱水費',
    '備品': '備品・消耗品費',
    '消耗品': '備品・消耗品費',
    '事務所費': '事務所費',
    '個人からの寄附': '個人からの寄附',
    '法人': '法人その他の団体からの寄附',
    '政治団体': '政治団体からの寄附',
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }

  return cleaned || (type === 'income' ? 'その他の収入' : 'その他の経費');
}

// New format parsers for META DATA + LINE ITEMS sheets
function extractMetadataNew(workbook: XLSX.WorkBook): XLSXMetadata {
  const metadata: XLSXMetadata = {};

  if (!workbook.Sheets['META DATA']) {
    return metadata;
  }

  const sheet = workbook.Sheets['META DATA'];
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

  // Parse key-value pairs from META DATA sheet
  data.forEach((row: any[]) => {
    if (!row || row.length < 2) return;

    const key = String(row[0] || '').trim();
    const value = row[1];

    // Handle both English and Japanese keys
    const normalizedKey = key.toUpperCase();

    if (normalizedKey === 'YEAR' || normalizedKey === '年度') {
      metadata.fiscalYear = String(Math.floor(parseAmount(value)));
    } else if (normalizedKey === 'ORGANIZATION' || normalizedKey === '政治団体') {
      metadata.organization = String(value || '').trim();
    } else if (normalizedKey === 'POLITICIAN' || normalizedKey === '政治家') {
      metadata.politician = String(value || '').trim();
    } else if (normalizedKey === 'PARTY' || normalizedKey === '政党') {
      metadata.party = String(value || '').trim();
    } else if (normalizedKey === 'HEREDITARY' || normalizedKey === '世襲') {
      metadata.hereditary = String(value || '').trim();
    } else if (normalizedKey === 'ELECTION_COUNT' || normalizedKey === '当選回数') {
      metadata.electionCount = Math.floor(parseAmount(value));
    } else if (normalizedKey === 'INCOME_TOTAL' || normalizedKey === '収入合計') {
      metadata.incomeTotal = parseAmount(value);
    } else if (normalizedKey === 'CARRIED_FROM_PREV' || normalizedKey === '昨年からの繰越') {
      metadata.carriedFromPrev = parseAmount(value);
    } else if (normalizedKey === 'EXPENSE_TOTAL' || normalizedKey === '支出合計') {
      metadata.expenseTotal = parseAmount(value);
    } else if (normalizedKey === 'THIS_YEAR_EXPENSE' || normalizedKey === '今年の支出') {
      metadata.thisYearExpense = parseAmount(value);
    } else if (normalizedKey === 'CARRIED_TO_NEXT' || normalizedKey === '余ったお金の繰越') {
      metadata.carriedToNext = parseAmount(value);
    }
  });

  return metadata;
}

function extractTransactionsNew(workbook: XLSX.WorkBook): Transaction[] {
  const transactions: Transaction[] = [];

  if (!workbook.Sheets['LINE ITEMS']) {
    return transactions;
  }

  const sheet = workbook.Sheets['LINE ITEMS'];
  const data = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

  if (data.length === 0) return transactions;

  // Find header row and column indices
  const headerRow = data[0] as any[];
  const headers = headerRow.map((h: any) => String(h || '').trim());

  const typeCol = headers.findIndex(h => h === 'タイプ');
  const categoryCol = headers.findIndex(h => h === 'カテゴリー');
  const subcategoryCol = findColumnIndex(headers, ['飲食ジャンル', 'サブカテゴリー', 'ジャンル']);
  const recipientCol = findColumnIndex(headers, ['支出先/寄附者', '寄付者・受給者', '寄附者', '支出先']);
  const amountCol = headers.findIndex(h => h.includes('金額'));
  const dateCol = headers.findIndex(h => h === '年月日');
  const addressCol = headers.findIndex(h => h === '住所');
  const urlCol = findColumnIndex(headers, ['URL', 'url', 'ウェブサイト']);

  // Parse data rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i] as any[];
    if (!row || row.length === 0) continue;

    const typeStr = typeCol >= 0 ? String(row[typeCol] || '').trim() : '';
    const amount = amountCol >= 0 ? parseAmount(row[amountCol]) : 0;

    // Skip rows with no amount or invalid type
    if (amount === 0 || !typeStr) continue;

    const type = typeStr === '収入' ? 'income' : 'expense';
    const category = categoryCol >= 0 ? String(row[categoryCol] || '').trim() : '';
    const description = recipientCol >= 0 ? String(row[recipientCol] || '').trim() : '';
    const dateValue = dateCol >= 0 ? row[dateCol] : null;

    const transaction: Transaction = {
      id: uuidv4(),
      date: parseDateNew(dateValue),
      category: category || (type === 'income' ? 'その他の収入' : 'その他の経費'),
      subcategory: subcategoryCol >= 0 ? String(row[subcategoryCol] || '').trim() : undefined,
      description,
      recipient: description || undefined,
      location: addressCol >= 0 ? String(row[addressCol] || '').trim() : undefined,
      url: urlCol >= 0 ? String(row[urlCol] || '').trim() : undefined,
      amount,
      type,
    };

    transactions.push(transaction);
  }

  return transactions;
}

function parseDateNew(value: any): string {
  if (!value) return new Date().toISOString().split('T')[0];

  // Handle Excel date objects
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Handle Excel date numbers
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
  }

  // Handle string dates
  if (typeof value === 'string') {
    // Try ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
  }

  return new Date().toISOString().split('T')[0];
}
