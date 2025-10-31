import pandas as pd

# Load the Excel file
df = pd.read_excel(r'c:\Users\Sahithi\Desktop\Recruiter_Suite\ai-matching-service\data\Salary_predection_1.xlsx')

print('Shape:', df.shape)
print('\nColumns:', list(df.columns))
print('\nFirst 10 rows:')
print(df.head(10))
print('\nData types:')
print(df.dtypes)
print('\nBasic statistics:')
print(df.describe())
print('\nNull values:')
print(df.isnull().sum())
