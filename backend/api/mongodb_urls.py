"""
MongoDB-based URL Configuration
Replaces Django ORM URLs with MongoDB-based endpoints
"""

from django.urls import path
from django.http import JsonResponse
from .mongodb_auth_views import (
    mongodb_login, mongodb_register, mongodb_refresh_token,
    mongodb_get_profile, mongodb_update_profile, mongodb_update_user_comprehensive, mongodb_delete_user,
    mongodb_upload_profile_image, mongodb_delete_profile_image, mongodb_get_settings, mongodb_update_settings
)
from .mongodb_api_views import (
    mongodb_get_accounts, mongodb_create_account, mongodb_update_account, mongodb_delete_account,
    mongodb_get_debts, mongodb_create_debt, mongodb_update_debt, mongodb_delete_debt,
    mongodb_get_budgets, mongodb_create_budget, mongodb_update_budget, mongodb_delete_budget, mongodb_get_month_budget,
    mongodb_get_month_budget_test, mongodb_save_month_budget, mongodb_batch_update_budgets,
    mongodb_get_transactions, mongodb_create_transaction, mongodb_update_transaction, mongodb_delete_transaction,
    mongodb_project_wealth, mongodb_get_wealth_projection_settings, mongodb_save_wealth_projection_settings,
    mongodb_project_wealth_enhanced, mongodb_import_financials,
    BudgetViews, DebtViews
)
from .mongodb_debt_planner import mongodb_debt_planner, mongodb_debt_planner_test
from .financial_steps import FinancialStepsView, financial_steps_calculate_test
from .dashboard import DashboardView
from .test_auth import test_login
from .notifications import (
    get_notifications, get_unread_count, mark_as_read, mark_as_unread, mark_all_as_read,
    delete_notification, create_notification, create_budget_alert,
    create_debt_reminder, create_savings_milestone, initialize_notifications
)

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({"status": "healthy", "message": "MongoDB API is running"})

def server_info(request):
    """Server information including startup timestamp"""
    import os
    from datetime import datetime
    startup_time = os.getenv('SERVER_STARTUP_TIME', datetime.now().isoformat())
    return JsonResponse({
        "status": "running",
        "startup_time": startup_time,
        "current_time": datetime.now().isoformat()
    })

urlpatterns = [
    # Health check endpoint
    path('', health_check, name='health_check'),
    path('server-info/', server_info, name='server_info'),
    
    # Authentication endpoints
    path('auth/mongodb/login/', mongodb_login, name='mongodb_login'),
    path('auth/mongodb/register/', mongodb_register, name='mongodb_register'),
    path('auth/mongodb/refresh/', mongodb_refresh_token, name='mongodb_refresh_token'),
    path('auth/mongodb/profile/', mongodb_get_profile, name='mongodb_get_profile'),
    path('auth/mongodb/profile/update/', mongodb_update_profile, name='mongodb_update_profile'),
    path('auth/mongodb/user/update/', mongodb_update_user_comprehensive, name='mongodb_update_user_comprehensive'),
    path('auth/mongodb/user/delete/', mongodb_delete_user, name='mongodb_delete_user'),
    path('auth/mongodb/user/upload-image/', mongodb_upload_profile_image, name='mongodb_upload_profile_image'),
    path('auth/mongodb/user/delete-image/', mongodb_delete_profile_image, name='mongodb_delete_profile_image'),
    


    
    # Settings endpoints
    path('settings/', mongodb_get_settings, name='mongodb_get_settings'),
    path('settings/update/', mongodb_update_settings, name='mongodb_update_settings'),
    
    # Account endpoints
    path('accounts/', mongodb_get_accounts, name='mongodb_get_accounts'),
    path('accounts/create/', mongodb_create_account, name='mongodb_create_account'),
    path('accounts/<str:account_id>/update/', mongodb_update_account, name='mongodb_update_account'),
    path('accounts/<str:account_id>/delete/', mongodb_delete_account, name='mongodb_delete_account'),
    
    # Debt endpoints
    path('debts/', mongodb_get_debts, name='mongodb_get_debts'),
    path('debts/test/', DebtViews.get_debts_test, name='mongodb_get_debts_test'),
    path('debts/create/', mongodb_create_debt, name='mongodb_create_debt'),
    path('debts/create-test/', DebtViews.create_debt_test, name='mongodb_create_debt_test'),
    path('debts/<str:debt_id>/update/', mongodb_update_debt, name='mongodb_update_debt'),
    path('debts/<str:debt_id>/delete/', mongodb_delete_debt, name='mongodb_delete_debt'),
    
    # Budget endpoints
    path('budgets/', mongodb_get_budgets, name='mongodb_get_budgets'),
    path('budgets/test/', BudgetViews.get_budgets_test, name='mongodb_get_budgets_test'),
    path('budgets/create/', mongodb_create_budget, name='mongodb_create_budget'),
    path('budgets/<str:budget_id>/update/', mongodb_update_budget, name='mongodb_update_budget'),
    path('budgets/<str:budget_id>/delete/', mongodb_delete_budget, name='mongodb_delete_budget'),
    path('budgets/get-month/', mongodb_get_month_budget, name='mongodb_get_month_budget'),
    path('budgets/get-month-test/', mongodb_get_month_budget_test, name='mongodb_get_month_budget_test'),
    path('budgets/save-month/', mongodb_save_month_budget, name='mongodb_save_month_budget'),
    path('budgets/save-month-test/', BudgetViews.save_month_budget_test, name='mongodb_save_month_budget_test'),
    path('budgets/batch-update/', mongodb_batch_update_budgets, name='mongodb_batch_update_budgets'),
    
    # Transaction endpoints
    path('transactions/', mongodb_get_transactions, name='mongodb_get_transactions'),
    path('transactions/create/', mongodb_create_transaction, name='mongodb_create_transaction'),
    path('transactions/<str:transaction_id>/update/', mongodb_update_transaction, name='mongodb_update_transaction'),
    path('transactions/<str:transaction_id>/delete/', mongodb_delete_transaction, name='mongodb_delete_transaction'),
    
    # Debt planner endpoint
    path('debt-planner/', mongodb_debt_planner, name='mongodb_debt_planner'),
    path('debt-planner-test/', mongodb_debt_planner_test, name='mongodb_debt_planner_test'),
    
    # Financial steps endpoints
    path('financial-steps/calculate/', FinancialStepsView.as_view(), name='financial_steps_calculate'),
    path('financial-steps/calculate-test/', financial_steps_calculate_test, name='financial_steps_calculate_test'),
    
    # Dashboard endpoint
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Wealth projection endpoints
    path('project-wealth/', mongodb_project_wealth, name='mongodb_project_wealth'),
    path('project-wealth-enhanced/', mongodb_project_wealth_enhanced, name='mongodb_project_wealth_enhanced'),
    path('wealth-projection-settings/', mongodb_get_wealth_projection_settings, name='mongodb_get_wealth_projection_settings'),
    path('wealth-projection-settings/save/', mongodb_save_wealth_projection_settings, name='mongodb_save_wealth_projection_settings'),
    path('import-financials/', mongodb_import_financials, name='mongodb_import_financials'),
    
    # Test authentication endpoint
    path('test-login/', test_login, name='test_login'),
    
    # Notification endpoints
    path('notifications/', get_notifications, name='get_notifications'),
    path('notifications/unread-count/', get_unread_count, name='get_unread_count'),
    path('notifications/<str:notification_id>/mark-read/', mark_as_read, name='mark_as_read'),
    path('notifications/<str:notification_id>/mark-unread/', mark_as_unread, name='mark_as_unread'),
    path('notifications/mark-all-read/', mark_all_as_read, name='mark_all_as_read'),
    path('notifications/<str:notification_id>/delete/', delete_notification, name='delete_notification'),
    path('notifications/create/', create_notification, name='create_notification'),
    path('notifications/budget-alert/', create_budget_alert, name='create_budget_alert'),
    path('notifications/debt-reminder/', create_debt_reminder, name='create_debt_reminder'),
    path('notifications/savings-milestone/', create_savings_milestone, name='create_savings_milestone'),
    path('notifications/initialize/', initialize_notifications, name='initialize_notifications'),
] 