from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Organization, Membership
from analytics.models import SalesEvent
from faker import Faker
import random, datetime as dt

class Command(BaseCommand):
    help = "Create demo org, user and random sales events"

    def add_arguments(self, parser):
        parser.add_argument("--days", type=int, default=60)
        parser.add_argument("--events", type=int, default=2000)

    def handle(self, *args, **opts):
        User = get_user_model()
        user, _ = User.objects.get_or_create(username="demo", defaults={"email":"demo@example.com"})
        user.set_password("demo"); user.save()

        org, _ = Organization.objects.get_or_create(name="Nebula Corp", slug="nebula")
        Membership.objects.get_or_create(org=org, user=user)

        fake = Faker()
        SalesEvent.objects.filter(org=org).delete()
        products = ["Alpha","Beta","Gamma","Delta","Omega"]
        channels = ["web","retail","partner"]
        regions  = ["NA","EU","LATAM","APAC"]

        start = dt.datetime.utcnow() - dt.timedelta(days=opts["days"])
        for _ in range(opts["events"]):
            occurred = start + dt.timedelta(seconds=random.randint(0, opts["days"]*86400))
            amount = round(random.uniform(10, 1000), 2)
            cost   = round(amount * random.uniform(0.2, 0.7), 2)
            SalesEvent.objects.create(
                org=org, occurred_at=occurred, amount=amount, cost=cost,
                product=random.choice(products),
                channel=random.choice(channels),
                region=random.choice(regions),
            )
        self.stdout.write(self.style.SUCCESS("Demo seeded: user=demo / pass=demo"))
