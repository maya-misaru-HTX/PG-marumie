import * as pdfjsLib from 'pdfjs-dist';
import { ExpenseReport, Transaction, PoliticianInfo } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export async function parsePDF(file: File): Promise<ExpenseReport> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const pages: string[] = [];

  // Extract text from all pages
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
    fullText += pageText + '\n';
  }

  // Parse sections
  const politician = extractPoliticianInfo(pages[0]);
  const summary = extractSummary(fullText);
  const transactions = extractTransactions(fullText, pages);

  const report: ExpenseReport = {
    politician,
    summary,
    income: {
      categories: [],
      total: summary.incomeTotal,
    },
    expenses: {
      categories: [],
      total: summary.expenseTotal,
    },
    transactions,
    monthlyData: [],
    metadata: {
      uploadedAt: new Date().toISOString(),
      source: 'pdf',
      fiscalYear: politician.fiscalYear,
    },
  };

  return report;
}

function extractPoliticianInfo(firstPageText: string): PoliticianInfo {
  // Extract politician name
  const nameMatch = firstPageText.match(/代\s*表\s*者\s*の\s*氏\s*名\s*([^\s]+)/);
  const name = nameMatch ? nameMatch[1].trim() : '不明';

  // Extract organization name
  const orgMatch = firstPageText.match(/政\s*治\s*団\s*体\s*の\s*名\s*称\s*([^\s]+)/);
  const organization = orgMatch ? orgMatch[1].trim() : '不明';

  // Extract fiscal year
  const yearMatch = firstPageText.match(/令和?(\d+)年分/);
  const fiscalYear = yearMatch
    ? (2018 + parseInt(yearMatch[1])).toString()
    : new Date().getFullYear().toString();

  return {
    name,
    organization,
    fiscalYear,
  };
}

function extractSummary(text: string): {
  incomeTotal: number;
  expenseTotal: number;
  balance: number;
  carriedFromPrevYear: number;
  carriedToNextYear: number;
} {
  // Extract total income (収入総額)
  const incomeMatch = text.match(/本\s*年\s*の\s*収\s*入\s*額\s*[）\)]\s*[\.|、|,|、]\s*[\.|、|,|、]\s*[\.|、|,|、]\s*(\d[\d\s,]*)/);
  const incomeTotal = incomeMatch ? parseAmount(incomeMatch[1]) : 0;

  // Extract total expenses (支出総額)
  const expenseMatch = text.match(/支\s*出\s*総\s*額\s*[\.|、|,|、]\s*[\.|、|,|、]\s*[\.|、|,|、]\s*(\d[\d\s,]*)/);
  const expenseTotal = expenseMatch ? parseAmount(expenseMatch[1]) : 0;

  // Extract carried from previous year (前年からの繰越額)
  const carriedFromMatch = text.match(/前\s*年\s*から\s*の\s*繰\s*越\s*額\s*[）\)]\s*[\.|、|,|、]\s*[\.|、|,|、]\s*[\.|、|,|、]\s*(\d[\d\s,]*)/);
  const carriedFromPrevYear = carriedFromMatch ? parseAmount(carriedFromMatch[1]) : 0;

  // Extract carried to next year (翌年への繰越額)
  const carriedToMatch = text.match(/翌\s*年\s*への\s*繰\s*越\s*額\s*[\.|、|,|、]\s*[\.|、|,|、]\s*[\.|、|,|、]\s*(\d[\d\s,]*)/);
  const carriedToNextYear = carriedToMatch ? parseAmount(carriedToMatch[1]) : 0;

  return {
    incomeTotal,
    expenseTotal,
    balance: incomeTotal - expenseTotal,
    carriedFromPrevYear,
    carriedToNextYear,
  };
}

function extractTransactions(fullText: string, pages: string[]): Transaction[] {
  const transactions: Transaction[] = [];

  // Parse income transactions (寄附の内訳)
  const incomeTransactions = parseIncomeSection(fullText);
  transactions.push(...incomeTransactions);

  // Parse expense transactions (支出項目別金額の内訳)
  const expenseTransactions = parseExpenseSection(fullText);
  transactions.push(...expenseTransactions);

  return transactions;
}

function parseIncomeSection(text: string): Transaction[] {
  const transactions: Transaction[] = [];

  // Look for individual donations pattern
  const donationPattern = /([^\s]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d[\d\s,]+)\s+R(\d)\/(\d+)\/(\d+)\s+([^\s]+)/g;
  let match;

  while ((match = donationPattern.exec(text)) !== null) {
    const [, name, , , , amount, year, month, day, occupation] = match;

    const reiwaYear = parseInt(year);
    const westernYear = 2018 + reiwaYear;
    const dateStr = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    transactions.push({
      id: uuidv4(),
      date: dateStr,
      category: '個人からの寄附',
      description: name,
      recipient: name,
      amount: parseAmount(amount),
      type: 'income',
      notes: occupation,
    });
  }

  return transactions;
}

function parseExpenseSection(text: string): Transaction[] {
  const transactions: Transaction[] = [];

  // Look for expense patterns
  // Format varies, so we'll use multiple patterns

  // Pattern 1: Office expenses (事務所費)
  const officePattern = /事務所[^\d]*(\d[\d\s,]+)\s+R(\d)\/(\d+)\/(\d+)\s+([^\s]+)/g;
  let match;

  while ((match = officePattern.exec(text)) !== null) {
    const [, amount, year, month, day, recipient] = match;

    const reiwaYear = parseInt(year);
    const westernYear = 2018 + reiwaYear;
    const dateStr = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    transactions.push({
      id: uuidv4(),
      date: dateStr,
      category: '事務所費',
      description: '事務所費',
      recipient,
      amount: parseAmount(amount),
      type: 'expense',
    });
  }

  // Pattern 2: Supplies (備品・消耗品費)
  const suppliesPattern = /備品[^\d]*(\d[\d\s,]+)\s+R(\d)\/(\d+)\/(\d+)/g;

  while ((match = suppliesPattern.exec(text)) !== null) {
    const [, amount, year, month, day] = match;

    const reiwaYear = parseInt(year);
    const westernYear = 2018 + reiwaYear;
    const dateStr = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    transactions.push({
      id: uuidv4(),
      date: dateStr,
      category: '備品・消耗品費',
      description: '備品・消耗品費',
      amount: parseAmount(amount),
      type: 'expense',
    });
  }

  return transactions;
}

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  // Remove all whitespace and commas, then parse
  const cleaned = amountStr.replace(/[\s,]/g, '');
  return parseFloat(cleaned) || 0;
}
