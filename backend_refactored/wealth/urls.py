"""
Wealth Projection URL Configuration
"""

from django.urls import path
from . import views

app_name = 'wealth'

urlpatterns = [
    path('project/', views.project_wealth, name='project_wealth'),
    path('settings/', views.get_wealth_projection_settings, name='get_settings'),
    path('settings/save/', views.save_wealth_projection_settings, name='save_settings'),
]

