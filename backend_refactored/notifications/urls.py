"""
Notifications URL Configuration
"""

from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.get_notifications, name='get_notifications'),
    path('unread-count/', views.get_unread_count, name='get_unread_count'),
    path('<str:notification_id>/mark-read/', views.mark_as_read, name='mark_as_read'),
    path('<str:notification_id>/mark-unread/', views.mark_as_unread, name='mark_as_unread'),
    path('mark-all-read/', views.mark_all_as_read, name='mark_all_as_read'),
    path('<str:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('create/', views.create_notification, name='create_notification'),
]

