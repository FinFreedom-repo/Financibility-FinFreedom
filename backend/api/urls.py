from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, 
    TransactionViewSet, 
    CategoryViewSet,
    project_wealth,
    GrokExcelView,
    UserProfileViewSet
)
from .expense_analyzer import ExpenseAnalyzerView, ExpenseChatView
from budget.views import BudgetViewSet
from .debt_planner import DebtPlannerView
from .dashboard import DashboardView
from .accounts_debts import (
    account_list, account_detail, debt_list, debt_detail,
    bulk_save_accounts_debts, get_accounts_debts_summary
)

print("Registering viewsets...")
router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'profile', UserProfileViewSet, basename='profile')
print("Registering BudgetViewSet...")
router.register(r'budgets', BudgetViewSet, basename='budget')
print("Available actions for BudgetViewSet:", BudgetViewSet.get_extra_actions())

urlpatterns = [
    path('', include(router.urls)),
    path('grok/analyze-excel/', GrokExcelView.as_view(), name='grok-analyze-excel'),
    path('expense-analyzer/upload/', ExpenseAnalyzerView.as_view(), name='expense-analyzer-upload'),
    path('expense-analyzer/chat/', ExpenseChatView.as_view(), name='expense-analyzer-chat'),
    path('project-wealth/', project_wealth, name='project-wealth'),
    path('debt-planner/', DebtPlannerView.as_view(), name='debt-planner'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Accounts and Debts endpoints
    path('accounts/', account_list, name='account_list'),
    path('accounts/<int:pk>/', account_detail, name='account_detail'),
    path('debts/', debt_list, name='debt_list'),
    path('debts/<int:pk>/', debt_detail, name='debt_detail'),
    path('accounts-debts/bulk-save/', bulk_save_accounts_debts, name='bulk_save_accounts_debts'),
    path('accounts-debts/summary/', get_accounts_debts_summary, name='get_accounts_debts_summary'),
]
