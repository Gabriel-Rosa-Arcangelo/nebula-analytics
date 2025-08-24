# backend/analytics/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SalesEventViewSet,
    KPIsView, TrendView, TopProductsView, DistributionView,
    DataSourceListCreate, DataSourceDetail,
    ReportListCreate, ReportDetail,
    SettingsView,
)

router = DefaultRouter()
router.register("sales-events", SalesEventViewSet, basename="sales-events")

urlpatterns = [
    # router
    path("", include(router.urls)),

    # analytics core
    path("kpis/", KPIsView.as_view(), name="kpis"),
    path("trend/", TrendView.as_view(), name="trend"),
    path("top-products/", TopProductsView.as_view(), name="top-products"),
    path("distribution/", DistributionView.as_view(), name="distribution"),

    # data sources
    path("datasources/", DataSourceListCreate.as_view(), name="datasources"),
    path("datasources/<int:pk>/", DataSourceDetail.as_view(), name="datasource-detail"),

    # reports
    path("reports/", ReportListCreate.as_view(), name="reports"),
    path("reports/<int:pk>/", ReportDetail.as_view(), name="report-detail"),

    # settings
    path("settings/", SettingsView.as_view(), name="settings"),
]



