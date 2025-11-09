#!/usr/bin/env python3
"""
Convert Hayashi Excel data to TypeScript static data format
"""
import pandas as pd
import json
from datetime import datetime

# Read the Excel file
excel_path = '/Users/misakifunada/Downloads/林芳正_アプリインプット (2).xlsx'
df_dict = pd.read_excel(excel_path, sheet_name=None)

# Parse metadata
meta_df = df_dict['META DATA']
metadata = {}
for idx, row in meta_df.iterrows():
    metadata[row['項目']] = row['内容']

# Parse line items
items_df = df_dict['LINE ITEMS']

# Convert transactions
transactions = []
income_idx = 0
expense_idx = 0

for idx, row in items_df.iterrows():
    trans_type = 'income' if row['タイプ'] == '収入' else 'expense'

    # Generate ID
    if trans_type == 'income':
        trans_id = f'income-{income_idx}'
        income_idx += 1
    else:
        trans_id = f'expense-{expense_idx}'
        expense_idx += 1

    # Parse date
    date_str = str(row['年月日'])
    try:
        if '00:00:00' in date_str:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        elif '/' in date_str and '-' in date_str:
            # Handle date range
            dates = date_str.split(' - ')
            date_obj = datetime.strptime(dates[0].strip(), '%Y/%m/%d')
        else:
            date_obj = datetime.strptime(date_str, '%Y/%m/%d')
        formatted_date = date_obj.strftime('%Y-%m-%d')
    except:
        formatted_date = '2023-01-01'  # Default date

    # Get URL
    url = '' if pd.isna(row['URL']) else str(row['URL'])

    # Get subcategory (飲食ジャンル)
    subcategory = '' if pd.isna(row['飲食ジャンル']) else str(row['飲食ジャンル'])

    # Build transaction
    transaction = {
        'id': trans_id,
        'type': trans_type,
        'category': str(row['カテゴリー']),
        'subcategory': subcategory,
        'description': str(row['支出先/寄附者']),
        'recipient': str(row['支出先/寄附者']),
        'amount': int(row['金額（円）']),
        'date': formatted_date,
        'location': '' if pd.isna(row['住所']) else str(row['住所']),
        'url': url,
    }

    transactions.append(transaction)

# Generate TypeScript file content
ts_content = f"""import {{ ExpenseReport }} from '../types';

/**
 * Static data for 林芳正 (2023 fiscal year)
 * Data extracted from 林芳正_アプリインプット (2).xlsx
 */
export const hayashiStaticReport: Omit<ExpenseReport, 'monthlyData' | 'metadata'> = {{
  politician: {{
    name: '{metadata['政治家']}',
    organization: '林芳正を支える会',
    fiscalYear: '{int(metadata['年度'])}',
    party: '{metadata['政党']}',
    hereditary: '{metadata['世襲']}',
    headshotUrl: '/images/hayashi.png',
  }},
  summary: {{
    incomeTotal: {int(metadata['収入合計'])},
    expenseTotal: {int(metadata['今年の支出'])},
    thisYearExpense: {int(metadata['今年の支出'])},
    balance: {int(metadata['余ったお金の繰越'])},
    carriedFromPrevYear: {int(metadata['昨年からの繰越'])},
    carriedToNextYear: {int(metadata['余ったお金の繰越'])},
  }},
  income: {{
    categories: [],
    total: {int(metadata['今年の収入'])},
  }},
  expenses: {{
    categories: [],
    total: {int(metadata['今年の支出'])},
  }},
  transactions: [
"""

# Add transactions
for trans in transactions:
    desc = trans['description'].replace("'", "\\'").replace('\n', ' ')
    recipient = trans['recipient'].replace("'", "\\'").replace('\n', ' ')
    location = trans['location'].replace("'", "\\'").replace('\n', ' ')

    ts_content += f"""    {{
      id: '{trans['id']}',
      type: '{trans['type']}',
      category: '{trans['category']}',
      subcategory: '{trans['subcategory']}',
      description: '{desc}',
      recipient: '{recipient}',
      amount: {trans['amount']},
      date: '{trans['date']}',
      location: '{location}',
      url: '{trans['url']}',
    }},
"""

ts_content += """  ],
};

// Summary data for the landing page table
export const hayashiSummaryData = {
  politician: {
    name: '林芳正',
    headshotUrl: '/images/hayashi.png',
    party: '自民',
    hereditary: '4代目',
  },
  summary: {
    expenseTotal: """ + str(int(metadata['今年の支出'])) + """,
  },
};
"""

# Write to file
output_path = '/Users/misakifunada/Desktop/political-funds-tracker/lib/data/hayashi-static-data.ts'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Successfully created {output_path}")
print(f"Total transactions: {len(transactions)}")
print(f"Income transactions: {income_idx}")
print(f"Expense transactions: {expense_idx}")
