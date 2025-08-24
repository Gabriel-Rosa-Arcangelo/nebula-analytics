from django.conf import settings
from django.db import models

class Organization(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)

    def __str__(self): return self.name

class Membership(models.Model):
    ADMIN="admin"; ANALYST="analyst"; VIEWER="viewer"
    ROLES=[(ADMIN,"Admin"),(ANALYST,"Analyst"),(VIEWER,"Viewer")]

    org   = models.ForeignKey(Organization, on_delete=models.CASCADE)
    user  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role  = models.CharField(max_length=20, choices=ROLES, default=ANALYST)

    class Meta:
        unique_together = ("org","user")
