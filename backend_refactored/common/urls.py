"""
Common URL Configuration
Health check and settings endpoints
"""

from django.urls import path
from .health import health_check, server_info
from authentication import views as auth_views

app_name = 'common'

urlpatterns = [
    # Settings endpoints (matching original structure)
    path('settings/', auth_views.get_settings, name='mongodb_get_settings'),
    path('settings/update/', auth_views.update_settings, name='mongodb_update_settings'),
]

