import { ExpenseReport } from '../types';

/**
 * PDF Parser Stub
 *
 * This function intentionally throws an error to trigger the OCR workflow.
 * Since we're using OCR.space API for scanned PDFs, we no longer use client-side
 * PDF.js parsing. This stub ensures that when a user uploads a PDF, the system
 * will automatically redirect them to the OCR-based parsing flow.
 */
export async function parsePDF(file: File): Promise<ExpenseReport> {
  throw new Error(
    'PDFからデータを抽出できませんでした。PDFの形式が対応していない可能性があります。'
  );
}
