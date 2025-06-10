import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Query to get the schema of the budget_budget table
cursor.execute("PRAGMA table_info(budget_budget);")
columns = cursor.fetchall()

# Print the columns
print("Columns in budget_budget table:")
for column in columns:
    print(column)

# Close the connection
conn.close() 