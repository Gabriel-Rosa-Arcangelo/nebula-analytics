from rest_framework import serializers
from .models import Dashboard, Widget, WidgetCache

class WidgetCacheSerializer(serializers.ModelSerializer):
    class Meta:
        model  = WidgetCache
        fields = ["payload","updated_at"]

class WidgetSerializer(serializers.ModelSerializer):
    cache = WidgetCacheSerializer(read_only=True)
    class Meta:
        model  = Widget
        fields = ["id","type","title","config","position","refresh_seconds","cache"]

class DashboardSerializer(serializers.ModelSerializer):
    widgets = WidgetSerializer(many=True, read_only=True)
    class Meta:
        model  = Dashboard
        fields = ["id","title","theme","widgets"]
