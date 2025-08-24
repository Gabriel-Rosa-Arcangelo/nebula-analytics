from celery import shared_task
from django.utils import timezone
from .models import Widget, WidgetCache
from analytics.models import SalesEvent
from django.db.models import Sum, Avg, Count
import pandas as pd

@shared_task
def refresh_widget(widget_id: int):
    w = Widget.objects.select_related("dashboard").get(id=widget_id)
    cfg = w.config or {}
    q = SalesEvent.objects.filter(org=w.dashboard.org)

    # filtros básicos
    if date_from := cfg.get("date_from"):
        q = q.filter(occurred_at__gte=date_from)
    if date_to := cfg.get("date_to"):
        q = q.filter(occurred_at__lt=date_to)
    if channels := cfg.get("channels"):
        q = q.filter(channel__in=channels)

    typ = w.type
    payload = {}
    if typ == "kpi":
        metric = cfg.get("metric","sum_amount") # sum_amount|avg_amount|count
        if metric == "sum_amount":
            payload = {"value": float(q.aggregate(Sum("amount"))["amount__sum"] or 0)}
        elif metric == "avg_amount":
            payload = {"value": float(q.aggregate(Avg("amount"))["amount__avg"] or 0)}
        elif metric == "count":
            payload = {"value": int(q.count())}

    elif typ == "timeseries":
        # agrega por dia
        df = pd.DataFrame(list(q.values("occurred_at","amount")))
        if len(df):
            df["day"] = df["occurred_at"].dt.tz_convert("UTC").dt.date if hasattr(df["occurred_at"].iloc[0],'tzinfo') else df["occurred_at"].dt.date
            ts = df.groupby("day")["amount"].sum().reset_index()
            payload = {"labels":[str(x) for x in ts["day"].tolist()],
                       "series":[ts["amount"].round(2).tolist()]}
        else:
            payload = {"labels":[],"series":[]}

    elif typ == "bar":
        field = cfg.get("group_by","product")
        agg   = list(q.values(field).annotate(total=Sum("amount")).order_by("-total")[:10])
        payload = {"labels":[a[field] for a in agg], "series":[float(a["total"]) for a in agg]}

    elif typ == "pie":
        field = cfg.get("group_by","channel")
        agg   = list(q.values(field).annotate(total=Sum("amount")).order_by("-total"))
        payload = {"labels":[a[field] for a in agg], "series":[float(a["total"]) for a in agg]}

    elif typ == "table":
        rows = list(q.order_by("-occurred_at").values("occurred_at","product","channel","region","amount")[:50])
        payload = {"rows": rows}

    cache, _ = WidgetCache.objects.get_or_create(widget=w)
    cache.payload = payload
    cache.save()
    return {"widget": w.id, "updated": timezone.now().isoformat()}
