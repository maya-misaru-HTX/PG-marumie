'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const PdfPromptGenerator = dynamic(
  () => import('@/components/upload/PdfPromptGenerator').then((mod) => ({ default: mod.PdfPromptGenerator })),
  { ssr: false }
);

export default function OcrPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 md:px-8">
      <div className="max-w-[1032px] mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          トップページに戻る
        </Link>
        <PdfPromptGenerator />
      </div>
    </div>
  );
}
