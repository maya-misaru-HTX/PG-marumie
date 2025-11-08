'use client';

import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { ExternalLink } from 'lucide-react';

interface PoliticianSummary {
  politician: string;
  party: string;
  organization: string;
  fiscalYear: number;
  totalIncome: number;
  totalExpense: number;
  thisYearIncome: number;
  thisYearExpense: number;
}

interface PoliticianSummaryTableProps {
  data: PoliticianSummary;
  onViewDetails: () => void;
}

export default function PoliticianSummaryTable({
  data,
  onViewDetails,
}: PoliticianSummaryTableProps) {
  return (
    <Card>
      <div className="space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">
            調査済みの政治家
          </h2>
          <span className="text-sm text-text-secondary bg-neutral-100 px-3 py-1 rounded-full">
            {data.fiscalYear}年度
          </span>
        </div>

        {/* Main Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                <th className="text-left py-4 px-6 font-bold text-text-primary w-[20%]">名前</th>
                <th className="text-left py-4 px-6 font-bold text-text-primary w-[15%]">政党</th>
                <th className="text-left py-4 px-6 font-bold text-text-primary w-[20%]">もらったお金</th>
                <th className="text-left py-4 px-6 font-bold text-text-primary w-[20%]">使ったお金</th>
                <th className="py-4 pl-6 pr-2 w-[25%]"></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-4 px-6">
                  <div>
                    <p className="font-bold text-lg text-text-primary">{data.politician}</p>
                    <p className="text-sm text-text-secondary mt-1">{data.organization}</p>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                    {data.party}
                  </span>
                </td>
                <td className="py-4 px-6 text-left">
                  <p className="font-bold text-lg text-primary-600">
                    {formatJapaneseCurrency(data.totalIncome)}
                  </p>
                </td>
                <td className="py-4 px-6 text-left">
                  <p className="font-bold text-lg text-red-600">
                    {formatJapaneseCurrency(data.totalExpense)}
                  </p>
                </td>
                <td className="py-4 pl-6 pr-2 text-center">
                  <button
                    onClick={onViewDetails}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary-500 text-white rounded-[24px] hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md whitespace-nowrap"
                  >
                    <span>もっと見る</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
