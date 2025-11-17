"""
Debts URL Configuration
"""

from django.urls import path
from . import views

app_name = 'debts'

urlpatterns = [
    path('', views.get_debts, name='mongodb_get_debts'),
    path('create/', views.create_debt, name='mongodb_create_debt'),
    path('<str:debt_id>/update/', views.update_debt, name='mongodb_update_debt'),
    path('<str:debt_id>/delete/', views.delete_debt, name='mongodb_delete_debt'),
    path('planner/', views.debt_planner, name='mongodb_debt_planner'),
    path('planner/test/', views.debt_planner_test, name='mongodb_debt_planner_test'),
]

