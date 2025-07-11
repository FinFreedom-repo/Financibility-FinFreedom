from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, 
    TransactionViewSet, 
    CategoryViewSet,
    project_wealth,
    GrokExcelView,
    UserProfileViewSet,
    calculate_financial_steps,
    calculate_net_savings,
    register_user,
    AccountAuditViewSet,
    TransactionAuditViewSet,
    DebtAuditViewSet,
    DebtViewSet
)
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
router.register(r'debts', DebtViewSet, basename='debt')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'account-audits', AccountAuditViewSet, basename='account-audit')
router.register(r'transaction-audits', TransactionAuditViewSet, basename='transaction-audit')
router.register(r'debt-audits', DebtAuditViewSet, basename='debt-audit')
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
    path('net-savings/', calculate_net_savings, name='calculate-net-savings'),
    path('auth/register/', register_user, name='register'),
    path('financial-steps/calculate/', calculate_financial_steps, name='calculate-financial-steps'),
    
    # Accounts and Debts endpoints (summary and bulk operations only)
    path('accounts-debts/bulk-save/', bulk_save_accounts_debts, name='bulk_save_accounts_debts'),
    path('accounts-debts/summary/', get_accounts_debts_summary, name='get_accounts_debts_summary'),
]
