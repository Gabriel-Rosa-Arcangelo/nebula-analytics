from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Membership, Organization
from .models import Dashboard


class DashboardApiTests(APITestCase):
    def test_user_only_lists_dashboards_from_their_organizations(self):
        user = get_user_model().objects.create_user(username="viewer", password="test-pass")
        own_org = Organization.objects.create(name="Own Org", slug="own-org")
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        Membership.objects.create(org=own_org, user=user, role=Membership.VIEWER)
        own_dashboard = Dashboard.objects.create(org=own_org, title="Own Dashboard")
        Dashboard.objects.create(org=other_org, title="Other Dashboard")
        self.client.force_authenticate(user)

        response = self.client.get("/api/dashboards/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data], [own_dashboard.id])
