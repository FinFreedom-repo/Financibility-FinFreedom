from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AccountViewSet, 
    TransactionViewSet, 
    CategoryViewSet,
    project_wealth
)
from .expense_analyzer import ExpenseAnalyzerView
from budget.views import BudgetViewSet

print("Registering viewsets...")
router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')
print("Registering BudgetViewSet...")
router.register(r'budgets', BudgetViewSet, basename='budget')
print("Available actions for BudgetViewSet:", BudgetViewSet.get_extra_actions())

urlpatterns = [
    path('', include(router.urls)),
    path('expense-analyzer/upload/', ExpenseAnalyzerView.as_view(), name='expense-analyzer-upload'),
    path('project-wealth/', project_wealth, name='project-wealth'),
]
