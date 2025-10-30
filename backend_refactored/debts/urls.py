"""
Debts URL Configuration
"""

from django.urls import path
from . import views

app_name = 'debts'

urlpatterns = [
    path('', views.get_debts, name='get_debts'),
    path('create/', views.create_debt, name='create_debt'),
    path('<str:debt_id>/update/', views.update_debt, name='update_debt'),
    path('<str:debt_id>/delete/', views.delete_debt, name='delete_debt'),
    path('planner/', views.debt_planner, name='debt_planner'),
    path('planner/test/', views.debt_planner_test, name='debt_planner_test'),
]

