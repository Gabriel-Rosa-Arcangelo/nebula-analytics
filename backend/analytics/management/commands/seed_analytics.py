from django.core.management.base import BaseCommand
from faker import Faker
import random
from datetime import datetime, timedelta

from analytics.models import MetricPoint, Product, Region

class Command(BaseCommand):
    help = "Seed demo analytics data (products x regions x days)"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=60)
        parser.add_argument("--clean", action="store_true", help="truncate tables before seeding")

    def handle(self, *args, **opts):
        fake = Faker()
        days = opts["days"]

        products_names = ["Nebula Pro", "Nebula Lite", "Orion X", "Quasar", "Pulsar"]
        regions_codes  = ["NA", "EU", "LATAM", "APAC", "MEA"]

        if opts["clean"]:
            MetricPoint.objects.all().delete()
            Product.objects.all().delete()
            Region.objects.all().delete()

        # assegura referenciais
        products = {p.name: p for p in Product.objects.bulk_create(
            [Product(name=n) for n in products_names if not Product.objects.filter(name=n).exists()],
            ignore_conflicts=True
        )}
        # re-carrega todos para garantir o dict completo
        products.update({p.name: p for p in Product.objects.filter(name__in=products_names)})

        regions = {r.code: r for r in Region.objects.bulk_create(
            [Region(code=c) for c in regions_codes if not Region.objects.filter(code=c).exists()],
            ignore_conflicts=True
        )}
        regions.update({r.code: r for r in Region.objects.filter(code__in=regions_codes)})

        # limpa métricas antigas (opcional)
        MetricPoint.objects.filter(
            product__in=Product.objects.filter(name__in=products_names),
            region__in=Region.objects.filter(code__in=regions_codes)
        ).delete()

        base_date = datetime.utcnow().date()
        rows = []
        for d in range(days):
            day = base_date - timedelta(days=d)
            for p in products_names:
                for r in regions_codes:
                    revenue = round(random.uniform(1000, 15000), 2)
                    users   = random.randint(50, 800)
                    orders  = random.randint(10, users)
                    rows.append(MetricPoint(
                        date=day,
                        product=products[p],   # << FK
                        region=regions[r],     # << FK
                        revenue=revenue,
                        users=users,
                        orders=orders,
                    ))
        MetricPoint.objects.bulk_create(rows, batch_size=2000)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(rows)} MetricPoint rows"))
