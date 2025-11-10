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
  overallScore?: number;
  mbtiType?: string;
  mbtiTypeCode?: string;
}

interface PoliticianSummaryTableProps {
  data: PoliticianSummary[];
  onViewDetails: (index: number) => void;
}

// Color scheme based on type characteristics (matching politician page)
const getTypeColor = (typeCode: string) => {
  const [r, x, l, e] = typeCode.split('-');
  // Rich + Leader types: Gold/Yellow
  if (r === 'R' && l === 'L') return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.4)', text: 'rgb(180, 83, 9)' };
  // Rich types: Blue
  if (r === 'R') return { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', text: 'rgb(30, 64, 175)' };
  // Leader types: Green
  if (l === 'L') return { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 0.4)', text: 'rgb(22, 101, 52)' };
  // Poor + Follower: Purple
  return { bg: 'rgba(168, 85, 247, 0.2)', border: 'rgba(168, 85, 247, 0.4)', text: 'rgb(107, 33, 168)' };
};

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
          <div className="text-xs md:text-sm text-text-primary bg-neutral-100 px-2 py-1 md:px-3 rounded-full inline-block">
            {data[0]?.fiscalYear}年度
          </div>
        </div>

        {/* Main Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200">
                <th className="text-center py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[28%]">名前</th>
                <th className="text-center py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[16%]">政党</th>
                <th className="text-center py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[18%]">スコア</th>
                <th className="text-center py-2 px-1 md:py-4 md:px-6 font-bold text-text-primary text-xs md:text-base w-[38%]">キャラ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((politician, index) => (
                <tr
                  key={index}
                  onClick={() => onViewDetails(index)}
                  className="border-b border-neutral-100 hover:bg-primary-50 active:bg-primary-100 cursor-pointer transition-all group"
                >
                  <td className="py-3 px-1 md:py-5 md:px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-bold text-xs md:text-lg text-text-primary leading-tight">{politician.politician}</p>
                      <ExternalLink className="w-3 h-3 md:w-4 md:h-4 text-primary-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                  <td className="py-3 px-1 md:py-5 md:px-6 text-center">
                    <span className="inline-block px-1.5 py-0.5 md:px-3 md:py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] md:text-sm font-medium">
                      {politician.party}
                    </span>
                  </td>
                  <td className="py-3 px-1 md:py-5 md:px-6 text-center">
                    <p className="font-bold text-xs md:text-lg text-teal-600">
                      {politician.overallScore || '-'}
                    </p>
                  </td>
                  <td className="py-3 px-1 md:py-5 md:px-6 text-center">
                    {politician.mbtiType && politician.mbtiTypeCode ? (
                      (() => {
                        const colors = getTypeColor(politician.mbtiTypeCode);
                        return (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-1 md:px-3 md:py-1.5 rounded-full backdrop-blur-md shadow-sm border-2 text-[10px] md:text-sm font-semibold"
                            style={{
                              backgroundColor: colors.bg,
                              borderColor: colors.border,
                              color: colors.text
                            }}
                          >
                            {politician.mbtiType}
                          </div>
                        );
                      })()
                    ) : (
                      <p className="font-medium text-xs md:text-base text-text-primary">-</p>
                    )}
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
