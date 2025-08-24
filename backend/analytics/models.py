from django.db import models
from accounts.models import Organization

class SalesEvent(models.Model):
    org        = models.ForeignKey(Organization, on_delete=models.CASCADE)
    occurred_at= models.DateTimeField(db_index=True)
    amount     = models.FloatField()
    cost       = models.FloatField(default=0)
    product    = models.CharField(max_length=80)
    region     = models.CharField(max_length=50, blank=True)
    channel    = models.CharField(max_length=50, blank=True)  # web, retail, partner...

    created_at = models.DateTimeField(auto_now_add=True)

class Product(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Region(models.Model):
    code = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.code

class MetricPoint(models.Model):
    date = models.DateField()
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="metrics")
    region  = models.ForeignKey(Region,  on_delete=models.CASCADE, related_name="metrics")
    revenue = models.DecimalField(max_digits=12, decimal_places=2)
    users   = models.IntegerField()
    orders  = models.IntegerField()

    class Meta:
        indexes = [
            models.Index(fields=["date"]),
            models.Index(fields=["product", "region"]),
        ]

class DataSource(models.Model):
    name = models.CharField(max_length=120)
    file = models.FileField(upload_to="datasources/")
    created_at = models.DateTimeField(auto_now_add=True)

class Report(models.Model):
    title = models.CharField(max_length=200, default="Analytics Report")
    status = models.CharField(max_length=20, default="pending")  # pending|processing|done|failed
    file = models.FileField(upload_to="reports/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
