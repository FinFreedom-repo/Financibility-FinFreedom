"""
Transactions URL Configuration
"""

from django.urls import path
from . import views

app_name = 'transactions'

urlpatterns = [
    path('', views.get_transactions, name='get_transactions'),
    path('create/', views.create_transaction, name='create_transaction'),
    path('<str:transaction_id>/update/', views.update_transaction, name='update_transaction'),
    path('<str:transaction_id>/delete/', views.delete_transaction, name='delete_transaction'),
]

