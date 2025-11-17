"""
Authentication URL Configuration
"""

from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints (matching original structure)
    path('login/', views.login, name='mongodb_login'),
    path('register/', views.register, name='mongodb_register'),
    path('refresh/', views.refresh_token, name='mongodb_refresh_token'),
    
    # Profile endpoints
    path('profile/', views.get_profile, name='mongodb_get_profile'),
    path('profile/update/', views.update_profile, name='mongodb_update_profile'),
    path('user/update/', views.update_user_comprehensive, name='mongodb_update_user_comprehensive'),
    path('user/delete/', views.delete_user, name='mongodb_delete_user'),
    
    # Profile image endpoints
    path('user/upload-image/', views.upload_profile_image, name='mongodb_upload_profile_image'),
    path('user/delete-image/', views.delete_profile_image, name='mongodb_delete_profile_image'),
]

