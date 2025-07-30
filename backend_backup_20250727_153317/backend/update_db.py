import sqlite3
import os

# Connect to the database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# First, let's check what columns exist
cursor.execute("PRAGMA table_info(budget_budget)")
columns = {row[1]: row for row in cursor.fetchall()}
print("Existing columns:", [col[1] for col in columns.values()])

# Add new columns if they don't exist
new_columns = ['entertainment', 'shopping', 'travel', 'education', 'other']
for col in new_columns:
    if col not in columns:
        print(f"Adding column: {col}")
        cursor.execute(f'''
            ALTER TABLE budget_budget ADD COLUMN {col} REAL DEFAULT 0;
        ''')

# Handle column renames
column_mappings = {
    'rent': 'housing',
    'credit_card_debt': 'debt_payments',
    'groceries': 'food'
}

for old_name, new_name in column_mappings.items():
    if old_name in columns and new_name not in columns:
        print(f"Renaming column: {old_name} to {new_name}")
        cursor.execute(f'''
            ALTER TABLE budget_budget RENAME COLUMN {old_name} TO {new_name};
        ''')

# Remove old column if it exists
if 'internet' in columns:
    print("Removing column: internet")
    cursor.execute('''
        ALTER TABLE budget_budget DROP COLUMN internet;
    ''')

# Commit the changes
conn.commit()
conn.close()

print("Database schema update completed!") 