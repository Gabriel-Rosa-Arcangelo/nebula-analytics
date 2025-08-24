from rest_framework import serializers
from .models import SalesEvent
from datetime import date
from django.db.models import Sum, F, FloatField
from django.db.models.functions import Cast
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import MetricPoint
from .models import DataSource, Report


class SalesEventSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SalesEvent
        fields = ["id","occurred_at","amount","cost","product","region","channel","created_at"]

# backend/analytics/serializers.py
from rest_framework import serializers

class KPIResponse(serializers.Serializer):
    revenue_mtd = serializers.FloatField()
    active_users = serializers.IntegerField()
    conv_rate = serializers.FloatField()
    tickets_open = serializers.IntegerField()

class SeriesPoint(serializers.Serializer):
    label = serializers.CharField()
    value = serializers.FloatField()

def _filters(request):
    q = {}
    d1 = request.GET.get("date_from")
    d2 = request.GET.get("date_to")
    prod = request.GET.get("product")
    reg  = request.GET.get("region")
    if d1 and d2: q["date__range"] = [d1, d2]
    if prod: q["product__name__iexact"] = prod
    if reg:  q["region__code__iexact"] = reg
    return q

class KPIsView(APIView):
    def get(self, request):
        q = _filters(request)
        qs = MetricPoint.objects.filter(**q)
        revenue = qs.aggregate(v=Sum("revenue"))["v"] or 0
        users   = qs.aggregate(v=Sum("users"))["v"] or 0
        orders  = qs.aggregate(v=Sum("orders"))["v"] or 0
        conv    = (orders / users * 100) if users else 0
        return Response({
            "revenue_mtd": float(revenue),
            "active_users": int(users),
            "conv_rate": round(conv, 2),
            "tickets_open": 87,  # mock por enquanto
        })

class TrendView(APIView):
    def get(self, request):
        q = _filters(request)
        data = (MetricPoint.objects.filter(**q)
                .values("date")
                .annotate(value=Sum("revenue"))
                .order_by("date"))
        out = [{"label": p["date"].strftime("%b %d"), "value": float(p["value"])} for p in data]
        return Response(out)

class TopProductsView(APIView):
    def get(self, request):
        q = _filters(request)
        data = (MetricPoint.objects.filter(**q)
                .values(label=F("product__name"))
                .annotate(value=Sum("revenue"))
                .order_by("-value")[:5])
        out = [{"label": p["label"], "value": float(p["value"])} for p in data]
        return Response(out)

class DistributionView(APIView):
    def get(self, request):
        q = _filters(request)
        data = (MetricPoint.objects.filter(**q)
                .values(label=F("region__name"))
                .annotate(value=Cast(Sum("revenue"), FloatField()))
                .order_by("-value"))
        out = [{"label": p["label"], "value": float(p["value"])} for p in data]
        return Response(out)

class DataSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataSource
        fields = ["id", "name", "file", "created_at"]

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "title", "status", "file", "created_at"]
