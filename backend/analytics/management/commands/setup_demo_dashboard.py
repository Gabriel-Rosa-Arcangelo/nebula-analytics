from django.core.management.base import BaseCommand
from accounts.models import Organization
from dashboards.models import Dashboard, Widget

class Command(BaseCommand):
    help = "Create a demo dashboard with widgets"

    def handle(self, *args, **opts):
        org = Organization.objects.get(slug="nebula")
        dash, _ = Dashboard.objects.get_or_create(org=org, title="Executive Overview",
                                                  defaults={"theme":{"mode":"dark","accent":"#2563EB"}})
        widgets = [
            {"type":"kpi","title":"Total Revenue","config":{"metric":"sum_amount"}},
            {"type":"kpi","title":"Avg Ticket","config":{"metric":"avg_amount"}},
            {"type":"kpi","title":"Orders","config":{"metric":"count"}},
            {"type":"timeseries","title":"Revenue (Daily)","config":{"date_from":None}},
            {"type":"bar","title":"Top Products","config":{"group_by":"product"}},
            {"type":"pie","title":"By Channel","config":{"group_by":"channel"}},
            {"type":"table","title":"Recent Orders","config":{}},
        ]
        for cfg in widgets:
            Widget.objects.get_or_create(dashboard=dash, type=cfg["type"], title=cfg["title"], defaults={"config":cfg["config"]})
        self.stdout.write(self.style.SUCCESS("Dashboard demo created."))
