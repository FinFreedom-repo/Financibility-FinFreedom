import requests
import json

# Test token endpoint
token_response = requests.post(
    'http://localhost:8000/api/auth/token/',
    json={
        'username': 'mccarvik',
        'password': 'kmac7272'
    }
)

print('Token Status Code:', token_response.status_code)
print('Token Response:', token_response.json())

# Get the access token
access_token = token_response.json()['access']

# Test budget endpoint with the token
budget_response = requests.get(
    'http://localhost:8000/api/budgets/',
    headers={
        'Authorization': f'Bearer {access_token}'
    }
)

print('\nBudget Status Code:', budget_response.status_code)
print('Budget Response:', budget_response.json()) 