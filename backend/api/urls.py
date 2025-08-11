from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, 
    TransactionViewSet, 
    CategoryViewSet,
    project_wealth,
    GrokExcelView,
    profile_me,
    calculate_financial_steps,
    calculate_net_savings,
    register_user,
    DebtViewSet,
    get_settings,
    change_password,
    update_username,
    delete_account,
    upload_profile_image,
    delete_profile_image,
    # MongoDB profile views
    get_profile_mongo,
    update_profile_mongo,
    upload_profile_image_mongo,
    delete_profile_image_mongo
)
from .mongodb_views import mongodb_test_view, user_mongodb_data, mongodb_stats
from .expense_analyzer import ExpenseAnalyzerView, ExpenseChatView
from budget.views import BudgetViewSet
from .debt_planner import DebtPlannerView
from .dashboard import DashboardView
from .accounts_debts import (
    bulk_save_accounts_debts, get_accounts_debts_summary
)

print("Registering viewsets...")
router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'debts', DebtViewSet, basename='debt')
print("Registering BudgetViewSet...")
router.register(r'budgets', BudgetViewSet, basename='budget')
print("Available actions for BudgetViewSet:", BudgetViewSet.get_extra_actions())

urlpatterns = [
    # Profile management endpoints (must come before router to avoid conflicts)
    path('profile/me/', profile_me, name='profile_me'),
    path('profile/change-password/', change_password, name='change_password'),
    path('profile/update-username/', update_username, name='update_username'),
    path('profile/delete-account/', delete_account, name='delete_account'),
    path('profile/upload-image/', upload_profile_image, name='upload_profile_image'),
    path('profile/delete-image/', delete_profile_image, name='delete_profile_image'),
    
    # MongoDB-based Profile endpoints
    path('profile-mongo/', get_profile_mongo, name='get_profile_mongo'),
    path('profile-mongo/update/', update_profile_mongo, name='update_profile_mongo'),
    path('profile-mongo/upload-image/', upload_profile_image_mongo, name='upload_profile_image_mongo'),
    path('profile-mongo/delete-image/', delete_profile_image_mongo, name='delete_profile_image_mongo'),
    
    # Router URLs (must come after specific endpoints)
    path('', include(router.urls)),
    
    path('grok/analyze-excel/', GrokExcelView.as_view(), name='grok-analyze-excel'),
    path('expense-analyzer/upload/', ExpenseAnalyzerView.as_view(), name='expense-analyzer-upload'),
    path('expense-analyzer/chat/', ExpenseChatView.as_view(), name='expense-analyzer-chat'),
    path('project-wealth/', project_wealth, name='project-wealth'),
    path('debt-planner/', DebtPlannerView.as_view(), name='debt-planner'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('net-savings/', calculate_net_savings, name='calculate-net-savings'),
    path('auth/register/', register_user, name='register'),
    path('financial-steps/calculate/', calculate_financial_steps, name='calculate-financial-steps'),
    
    # Accounts and Debts endpoints (keeping only bulk operations and summary)
    path('accounts-debts/bulk-save/', bulk_save_accounts_debts, name='bulk_save_accounts_debts'),
    path('accounts-debts/summary/', get_accounts_debts_summary, name='get_accounts_debts_summary'),
    path('settings/', get_settings, name='get_settings'),
    
    # MongoDB integration test endpoints
    path('mongodb/test/', mongodb_test_view, name='mongodb_test'),
    path('mongodb/user/<int:user_id>/', user_mongodb_data, name='user_mongodb_data'),
    path('mongodb/stats/', mongodb_stats, name='mongodb_stats'),
]
