"""
Dashboard URL Configuration
"""

from django.urls import path
from . import views
from .financial_steps import FinancialStepsView, financial_steps_calculate_test

app_name = 'dashboard'

urlpatterns = [
    path('', views.get_dashboard, name='get_dashboard'),
    path('financial-steps/calculate/', FinancialStepsView.as_view(), name='financial_steps_calculate'),
    path('financial-steps/calculate-test/', financial_steps_calculate_test, name='financial_steps_calculate_test'),
]

