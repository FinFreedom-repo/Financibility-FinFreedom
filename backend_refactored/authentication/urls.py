"""
Authentication URL Configuration
"""

from django.urls import path
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('refresh/', views.refresh_token, name='refresh_token'),
    
    # Profile endpoints
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('user/update/', views.update_user_comprehensive, name='update_user_comprehensive'),
    path('user/delete/', views.delete_user, name='delete_user'),
    
    # Profile image endpoints
    path('user/upload-image/', views.upload_profile_image, name='upload_profile_image'),
    path('user/delete-image/', views.delete_profile_image, name='delete_profile_image'),
    
    # Settings endpoints
    path('settings/', views.get_settings, name='get_settings'),
    path('settings/update/', views.update_settings, name='update_settings'),
]

\

