import LZString from 'lz-string';
import { ExpenseReport } from '../types';

export function encodeReportToURL(report: ExpenseReport): string {
  try {
    const json = JSON.stringify(report);
    const compressed = LZString.compressToEncodedURIComponent(json);
    return compressed;
  } catch (error) {
    console.error('Error encoding report:', error);
    throw new Error('Failed to encode report data');
  }
}

export function decodeReportFromURL(encoded: string): ExpenseReport | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(encoded);
    if (!decompressed) {
      return null;
    }
    const report = JSON.parse(decompressed) as ExpenseReport;
    return report;
  } catch (error) {
    console.error('Error decoding report:', error);
    return null;
  }
}

export function generateShareURL(report: ExpenseReport, baseURL: string = ''): string {
  const encoded = encodeReportToURL(report);
  const url = `${baseURL}/report?data=${encoded}`;
  return url;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        textArea.remove();
        resolve();
      } catch (err) {
        textArea.remove();
        reject(err);
      }
    });
  }
}
