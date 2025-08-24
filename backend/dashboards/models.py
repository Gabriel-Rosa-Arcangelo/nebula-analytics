from django.db import models
from accounts.models import Organization

class Dashboard(models.Model):
    org   = models.ForeignKey(Organization, on_delete=models.CASCADE)
    title = models.CharField(max_length=120, default="Analytics")
    theme = models.JSONField(default=dict)  # cores etc.
    def __str__(self): return f"{self.org.name} • {self.title}"

class Widget(models.Model):
    KPI="kpi"; TIMESERIES="timeseries"; BAR="bar"; PIE="pie"; TABLE="table"
    TYPES=[(KPI,"KPI"),(TIMESERIES,"TimeSeries"),(BAR,"Bar"),(PIE,"Pie"),(TABLE,"Table")]

    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name="widgets")
    type      = models.CharField(max_length=20, choices=TYPES)
    title     = models.CharField(max_length=120, blank=True)
    # Config armazenada como JSON: métrica, group_by, filtros, etc.
    config    = models.JSONField(default=dict)
    position  = models.JSONField(default=dict)  # {x,y,w,h} caso queira gridster
    refresh_seconds = models.IntegerField(default=300)

class WidgetCache(models.Model):
    widget   = models.OneToOneField(Widget, on_delete=models.CASCADE, related_name="cache")
    payload  = models.JSONField(default=dict)   # dados prontos pro gráfico
    updated_at = models.DateTimeField(auto_now=True)
