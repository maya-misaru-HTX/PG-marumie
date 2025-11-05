'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import { ExpenseReport } from '@/lib/types';
import { encodeReportToURL } from '@/lib/utils/urlState';

export default function Home() {
  const router = useRouter();

  const handleReportLoaded = (report: ExpenseReport) => {
    // Encode report to URL and navigate
    const encoded = encodeReportToURL(report);
    router.push(`/report?data=${encoded}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 md:px-8">
      <div className="max-w-[1032px] mx-auto">
        <FileUpload onReportLoaded={handleReportLoaded} />
      </div>
    </div>
  );
}
