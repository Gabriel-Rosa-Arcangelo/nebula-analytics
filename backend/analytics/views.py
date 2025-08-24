from rest_framework import viewsets, permissions
from .models import SalesEvent
from .serializers import SalesEventSerializer
from .models import MetricPoint  
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, F, FloatField
from django.db.models.functions import Cast

from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics, permissions
from django.conf import settings
from django.core.files.base import ContentFile
import pandas as pd
from io import BytesIO

from .serializers import DataSourceSerializer, ReportSerializer
from .models import DataSource, Report

# backend/analytics/views.py
from datetime import date, timedelta
import random

from rest_framework import status
from rest_framework.permissions import AllowAny


class SalesEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SalesEvent.objects.all().order_by("-occurred_at")
    serializer_class = SalesEventSerializer
    permission_classes = [permissions.IsAuthenticated]


def _filters(request):
    q = {}
    d1 = request.GET.get("date_from")
    d2 = request.GET.get("date_to")
    if d1 and d2: q["date__range"] = [d1, d2]
    prod = request.GET.get("product")
    reg  = request.GET.get("region")
    if prod: q["product__name__iexact"] = prod
    if reg:  q["region__code__iexact"] = reg
    return q

class KPIsView(APIView):
    def get(self, request):
        qs = MetricPoint.objects.filter(**_filters(request))
        revenue = qs.aggregate(v=Sum("revenue"))["v"] or 0
        users   = qs.aggregate(v=Sum("users"))["v"] or 0
        orders  = qs.aggregate(v=Sum("orders"))["v"] or 0
        conv    = (orders/users*100) if users else 0
        return Response({
            "revenue_mtd": float(revenue),
            "active_users": int(users),
            "conv_rate": round(conv, 2),
            "tickets_open": 87,
        })

class TrendView(APIView):
    def get(self, request):
        data = (MetricPoint.objects.filter(**_filters(request))
                .values("date").annotate(value=Sum("revenue")).order_by("date"))
        return Response([{"label": r["date"].strftime("%b %d"), "value": float(r["value"])} for r in data])

class TopProductsView(APIView):
    def get(self, request):
        data = (MetricPoint.objects.filter(**_filters(request))
                .values(label=F("product__name"))
                .annotate(value=Sum("revenue"))
                .order_by("-value")[:5])
        return Response([{"label": r["label"], "value": float(r["value"])} for r in data])

class DistributionView(APIView):
    def get(self, request):
        data = (
            MetricPoint.objects.filter(**_filters(request))
            .values(label=F("region__code"))  # <-- troque name por code
            .annotate(value=Cast(Sum("revenue"), FloatField()))
            .order_by("-value")
        )
        return Response(
            [{"label": r["label"], "value": float(r["value"])} for r in data]
        )



# ---------- Data Sources (stubs só p/ não quebrar rotas) ----------

# Vamos manter um “storage” em memória só para teste.
# Logo a gente troca por Model + serializer de verdade.
_FAKE_DATASOURCES = [
    {"id": 1, "name": "Stripe", "type": "api", "status": "connected"},
    {"id": 2, "name": "Postgres Sales", "type": "db", "status": "connected"},
]

class DataSourceListCreate(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(_FAKE_DATASOURCES)

    def post(self, request):
        payload = request.data
        new_id = max([d["id"] for d in _FAKE_DATASOURCES] or [0]) + 1
        item = {
            "id": new_id,
            "name": payload.get("name", f"Datasource {new_id}"),
            "type": payload.get("type", "api"),
            "status": payload.get("status", "connected"),
        }
        _FAKE_DATASOURCES.append(item)
        return Response(item, status=status.HTTP_201_CREATED)

class DataSourceDetail(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        for d in _FAKE_DATASOURCES:
            if d["id"] == pk:
                return Response(d)
        return Response({"detail": "Not found."}, status=404)

# ---------- Reports (stubs) ----------

_FAKE_REPORTS = [
    {"id": 1, "title": "Weekly Revenue", "status": "done", "url": "/media/reports/weekly.pdf"},
]

class ReportListCreate(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(_FAKE_REPORTS)

    def post(self, request):
        new_id = max([r["id"] for r in _FAKE_REPORTS] or [0]) + 1
        item = {"id": new_id, "title": request.data.get("title", f"Report {new_id}"), "status": "queued", "url": None}
        _FAKE_REPORTS.append(item)
        return Response(item, status=201)

class ReportDetail(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        for r in _FAKE_REPORTS:
            if r["id"] == pk:
                return Response(r)
        return Response({"detail": "Not found."}, status=404)

# ---------- Settings (stub) ----------

_SETTINGS = {
    "theme": "dark",
    "accent": "#7C3AED",
    "refresh_seconds": 60,
}

class SettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(_SETTINGS)

    def post(self, request):
        _SETTINGS.update(request.data or {})
        return Response(_SETTINGS)
