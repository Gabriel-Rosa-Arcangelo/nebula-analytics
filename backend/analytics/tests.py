from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import MetricPoint, Product, Region


class AnalyticsApiTests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(username="analyst", password="test-pass")
        self.client.force_authenticate(user)
        product = Product.objects.create(name="Synthetic Panel")
        region = Region.objects.create(code="BR-SP")
        MetricPoint.objects.create(
            date=date(2026, 1, 1),
            product=product,
            region=region,
            revenue="100.50",
            users=10,
            orders=2,
        )

    def test_kpis_aggregate_metric_points(self):
        response = self.client.get("/api/analytics/kpis/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["revenue_mtd"], 100.5)
        self.assertEqual(response.data["active_users"], 10)
        self.assertEqual(response.data["conv_rate"], 20.0)

    def test_demo_datasources_require_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/datasources/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
