# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# IMPORTA AS VIEWS PARA OS ALIASES
from analytics.views import (
    DataSourceListCreate, DataSourceDetail,
    ReportListCreate, ReportDetail,
    SettingsView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/analytics/", include("analytics.urls")),  # já existia
]

# === ALIASES PARA NÃO QUEBRAR O FRONT ===
urlpatterns += [
    path("api/datasources/", DataSourceListCreate.as_view(), name="datasource-list"),
    path("api/datasources/<int:pk>/", DataSourceDetail.as_view(), name="datasource-detail"),
    path("api/reports/", ReportListCreate.as_view(), name="report-list"),
    path("api/reports/<int:pk>/", ReportDetail.as_view(), name="report-detail"),
    path("api/settings/", SettingsView.as_view(), name="settings"),
]

# mídia/estáticos em dev
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
