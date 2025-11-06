'use client';

import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import { ExpenseReport } from '@/lib/types';
import { encodeReportToURL } from '@/lib/utils/urlState';

export default function Home() {
  const router = useRouter();

  const handleReportLoaded = (report: ExpenseReport) => {
    try {
      // Store report in sessionStorage to avoid URL length limits (HTTP 431 errors)
      // This allows large files to be processed without hitting URL size limits
      sessionStorage.setItem('currentReport', JSON.stringify(report));

      // Navigate to report page without data in URL
      // The report page will check sessionStorage first
      router.push('/report');
    } catch (error) {
      console.error('Error storing report:', error);
      // Fallback: try URL encoding for smaller reports
      try {
        const encoded = encodeReportToURL(report);
        router.push(`/report?data=${encoded}`);
      } catch (urlError) {
        alert('レポートデータが大きすぎます。ファイルのサイズを減らしてください。');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-6 px-4 md:py-12 md:px-8">
      <div className="max-w-[1032px] mx-auto space-y-6 md:space-y-12">
        <FileUpload onReportLoaded={handleReportLoaded} />
      </div>
    </div>
  );
}
