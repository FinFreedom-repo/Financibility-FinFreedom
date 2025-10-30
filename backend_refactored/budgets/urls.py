"""
Budgets URL Configuration
"""

from django.urls import path
from . import views

app_name = 'budgets'

urlpatterns = [
    path('', views.get_budgets, name='get_budgets'),
    path('create/', views.create_budget, name='create_budget'),
    path('<str:budget_id>/update/', views.update_budget, name='update_budget'),
    path('<str:budget_id>/delete/', views.delete_budget, name='delete_budget'),
    path('month/', views.get_month_budget, name='get_month_budget'),
    path('month/save/', views.save_month_budget, name='save_month_budget'),
]

