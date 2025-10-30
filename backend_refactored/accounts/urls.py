"""
Accounts URL Configuration
"""

from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('', views.get_accounts, name='get_accounts'),
    path('create/', views.create_account, name='create_account'),
    path('<str:account_id>/update/', views.update_account, name='update_account'),
    path('<str:account_id>/delete/', views.delete_account, name='delete_account'),
    path('with-debts/', views.get_accounts_and_debts, name='get_accounts_and_debts'),
]

