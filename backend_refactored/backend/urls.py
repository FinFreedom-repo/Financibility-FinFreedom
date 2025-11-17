"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from django.conf import settings
from django.conf.urls.static import static
from common.health import health_check, server_info
from debts import views as debt_views
from wealth import views as wealth_views
from dashboard import views as dashboard_views
from dashboard.financial_steps import FinancialStepsView, financial_steps_calculate_test
# MongoDB-based authentication - no Django JWT needed

urlpatterns = [
    path('', RedirectView.as_view(url='/api/mongodb/', permanent=False)),
    path('admin/', admin.site.urls),
    # Health check endpoints (matching original structure)
    path('api/mongodb/', health_check, name='health_check'),
    path('api/mongodb/server-info/', server_info, name='server_info'),
    # API endpoints (matching original structure exactly)
    path('api/mongodb/auth/mongodb/', include('authentication.urls')),
    path('api/mongodb/accounts/', include('accounts.urls')),
    path('api/mongodb/debts/', include('debts.urls')),
    path('api/mongodb/debt-planner/', debt_views.debt_planner, name='mongodb_debt_planner'),
    path('api/mongodb/debt-planner-test/', debt_views.debt_planner_test, name='mongodb_debt_planner_test'),
    path('api/mongodb/budgets/', include('budgets.urls')),
    path('api/mongodb/transactions/', include('transactions.urls')),
    path('api/mongodb/project-wealth/', wealth_views.project_wealth, name='mongodb_project_wealth'),
    path('api/mongodb/project-wealth-enhanced/', wealth_views.project_wealth_enhanced, name='mongodb_project_wealth_enhanced'),
    path('api/mongodb/wealth-projection-settings/', wealth_views.get_wealth_projection_settings, name='mongodb_get_wealth_projection_settings'),
    path('api/mongodb/wealth-projection-settings/save/', wealth_views.save_wealth_projection_settings, name='mongodb_save_wealth_projection_settings'),
    path('api/mongodb/import-financials/', wealth_views.import_financials, name='mongodb_import_financials'),
    path('api/mongodb/notifications/', include('notifications.urls')),
    path('api/mongodb/dashboard/', dashboard_views.get_dashboard, name='dashboard'),
    path('api/mongodb/financial-steps/calculate/', FinancialStepsView.as_view(), name='financial_steps_calculate'),
    path('api/mongodb/financial-steps/calculate-test/', financial_steps_calculate_test, name='financial_steps_calculate_test'),
    path('api/mongodb/analytics/', include('analytics.urls')),
    # Settings endpoints (matching original structure)
    path('api/mongodb/settings/', include('common.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

