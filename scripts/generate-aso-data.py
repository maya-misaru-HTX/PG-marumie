#!/usr/bin/env python3
"""
Generate TypeScript data file from Excel
"""
import pandas as pd
import json

# Read the Excel file
excel_path = '/Users/misakifunada/Downloads/麻生太郎_アプリインプット.xlsx'
df_meta = pd.read_excel(excel_path, sheet_name='META DATA')
df_line_items = pd.read_excel(excel_path, sheet_name='LINE ITEMS')

# Extract metadata
meta_dict = dict(zip(df_meta['項目'], df_meta['内容']))

# Generate TypeScript file
output = """import { ExpenseReport } from '../types';

/**
 * Static data for 麻生太郎 (2023 fiscal year)
 * Data extracted from 麻生太郎_アプリインプット.xlsx
 */
export const asoStaticReport: Omit<ExpenseReport, 'monthlyData' | 'metadata'> = {
  politician: {
    name: '%s',
    organization: '%s',
    fiscalYear: '%s',
    party: '%s',
    hereditary: '%s',
  },
  summary: {
    incomeTotal: %d,
    expenseTotal: %d,
    thisYearExpense: %d,
    balance: %d,
    carriedFromPrevYear: %d,
    carriedToNextYear: %d,
  },
  income: {
    categories: [],
    total: %d,
  },
  expenses: {
    categories: [],
    total: %d,
  },
  transactions: [
""" % (
    meta_dict['政治家'],
    meta_dict['政治団体'],
    str(meta_dict['年度']),
    meta_dict['政党'],
    meta_dict['世襲'],
    meta_dict['収入合計'],
    meta_dict['今年の支出'],
    meta_dict['今年の支出'],
    meta_dict['余ったお金の繰越'],
    meta_dict['昨年からの繰越'],
    meta_dict['余ったお金の繰越'],
    meta_dict['今年の収入'],
    meta_dict['今年の支出'],
)

# Process each transaction
for idx, row in df_line_items.iterrows():
    trans_type = 'income' if row['タイプ'] == '収入' else 'expense'
    date = pd.to_datetime(row['年月日']).strftime('%Y-%m-%d') if pd.notna(row['年月日']) else '2023-01-01'

    # Clean up values
    category = str(row['カテゴリー']) if pd.notna(row['カテゴリー']) else ''
    description = str(row['支出先/寄附者']) if pd.notna(row['支出先/寄附者']) else ''
    location = str(row['住所']) if pd.notna(row['住所']) else ''
    amount = int(row['金額（円）']) if pd.notna(row['金額（円）']) else 0
    url = str(row['URL']) if pd.notna(row['URL']) else ''

    # Escape single quotes in strings
    description = description.replace("'", "\\'")
    location = location.replace("'", "\\'")
    category = category.replace("'", "\\'")

    output += """    {
      id: '%s-%d',
      date: '%s',
      category: '%s',
      description: '%s',
      recipient: '%s',
      location: '%s',%s
      amount: %d,
      type: '%s',
    },
""" % (
        trans_type,
        idx,
        date,
        category,
        description,
        description,
        location,
        f"\n      url: '{url}'," if url and url != 'nan' else '',
        amount,
        trans_type
    )

output += """  ],
};

// Summary data for landing page table
export const asoSummaryData = {
  name: '%s',
  party: '%s',
  organization: '%s',
  fiscalYear: '%s',
  hereditary: '%s',
  totalIncome: %d,
  totalExpenses: %d,
  luxuryRestaurants: 0, // Will be calculated
  donations: 0, // Will be calculated
};
""" % (
    meta_dict['政治家'],
    meta_dict['政党'],
    meta_dict['政治団体'],
    str(meta_dict['年度']),
    meta_dict['世襲'],
    meta_dict['収入合計'],
    meta_dict['今年の支出'],
)

print(output)
