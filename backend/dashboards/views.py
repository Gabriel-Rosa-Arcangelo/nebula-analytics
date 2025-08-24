from rest_framework import viewsets, permissions
from .models import Dashboard, Widget
from .serializers import DashboardSerializer, WidgetSerializer
from accounts.models import Membership
from django.http import JsonResponse

def index(request):
    return JsonResponse({"ok": True, "message": "dashboards API alive"})

class InOrgPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return Membership.objects.filter(org=obj.org, user=request.user).exists()

class DashboardViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = DashboardSerializer
    permission_classes = [permissions.IsAuthenticated, InOrgPermission]
    def get_queryset(self):
        return Dashboard.objects.filter(org__membership__user=self.request.user).distinct()

class WidgetViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WidgetSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Widget.objects.filter(dashboard__org__membership__user=self.request.user)


