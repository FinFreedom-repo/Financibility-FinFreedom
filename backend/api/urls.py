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
]
