'use client';

import { formatJapaneseCurrency } from '@/lib/calculations/aggregations';
import Card from '../ui/Card';
import { ExternalLink } from 'lucide-react';

interface PoliticianSummary {
  politician: string;
  party: string;
  hereditary?: string;
  organization: string;
  fiscalYear: number;
  totalIncome: number;
  totalExpense: number;
  thisYearIncome: number;
  thisYearExpense: number;
}

interface PoliticianSummaryTableProps {
  data: PoliticianSummary[];
  onViewDetails: (index: number) => void;
}

export default function PoliticianSummaryTable({
  data,
  onViewDetails,
}: PoliticianSummaryTableProps) {
  return (
    <Card>
      <div className="space-y-4 md:space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-2xl font-bold text-text-primary">
            チェック済みの政治家
          </h2>
          <span className="text-xs md:text-sm text-text-secondary bg-neutral-100 px-2 py-1 md:px-3 rounded-full">
            {data[0]?.fiscalYear}年度
          </span>
        </div>

        {/* Main Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                <th className="text-left py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[25%] md:w-[18%]">名前</th>
                <th className="text-left py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[12%] md:w-[14.3%]">政党</th>
                <th className="text-left py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[20%] md:w-[22%]">
                  収入
                </th>
                <th className="text-left py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[20%] md:w-[22%]">
                  支出
                </th>
                <th className="py-2 px-[3.6px] md:py-4 md:px-6 w-[23%] md:w-[23.7%]"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((politician, index) => (
                <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-2 px-1 md:py-4 md:px-6">
                    <div>
                      <p className="font-bold text-xs md:text-lg text-text-primary leading-tight">{politician.politician}</p>
                    </div>
                  </td>
                  <td className="py-2 px-1 md:py-4 md:px-6">
                    <span className="inline-block px-1.5 py-0.5 md:px-3 md:py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] md:text-sm font-medium">
                      {politician.party}
                    </span>
                  </td>
                  <td className="py-2 px-1 md:py-4 md:px-6 text-left">
                    <p className="font-bold text-xs md:text-lg text-primary-600">
                      {formatJapaneseCurrency(politician.totalIncome)}
                    </p>
                  </td>
                  <td className="py-2 px-1 md:py-4 md:px-6 text-left">
                    <p className="font-bold text-xs md:text-lg text-red-600">
                      {formatJapaneseCurrency(politician.totalExpense)}
                    </p>
                  </td>
                  <td className="py-2 px-[3.6px] md:py-4 md:px-6 text-right">
                    <button
                      onClick={() => onViewDetails(index)}
                      className="inline-flex items-center gap-0.5 md:gap-2 px-2 py-1 md:px-6 md:py-2.5 bg-primary-500 text-white rounded-[24px] hover:bg-primary-600 transition-colors font-medium shadow-sm hover:shadow-md whitespace-nowrap text-[10px] md:text-base cursor-pointer"
                    >
                      詳細
                      <ExternalLink className="w-2.5 h-2.5 md:w-4 md:h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
