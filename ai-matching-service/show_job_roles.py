import pandas as pd

df = pd.read_excel('data/Salary_predection_1.xlsx')

print('\nAvailable Job Roles in Dataset:')
print('='*50)

roles = sorted(df['Job Role'].unique())
for i, role in enumerate(roles, 1):
    print(f'{i:2d}. {role}')

print(f'\nTotal: {len(roles)} job roles')
print('='*50)
