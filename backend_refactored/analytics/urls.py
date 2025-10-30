"""
Analytics URL Configuration
"""

from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('expenses/', views.analyze_expenses, name='analyze_expenses'),
]

