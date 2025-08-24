from django.urls import path
from . import views

from rest_framework.routers import DefaultRouter
from .views import DashboardViewSet, WidgetViewSet

app_name = "dashboards"  

router = DefaultRouter()
router.register("dashboards", DashboardViewSet, basename="dashboards")
router.register("widgets",    WidgetViewSet,    basename="widgets")

#urlpatterns = router.urls

urlpatterns = [
    path("", views.index, name="index"),
]


