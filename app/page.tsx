'use client';

import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import { ExpenseReport } from '@/lib/types';

export default function Home() {
  const router = useRouter();

  const handleReportLoaded = (report: ExpenseReport) => {
    try {
      // Store report in sessionStorage
      sessionStorage.setItem('currentReport', JSON.stringify(report));

      // Navigate to report page
      router.push('/report');
    } catch (error) {
      console.error('Error storing report:', error);
      alert('レポートデータの保存に失敗しました。');
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
