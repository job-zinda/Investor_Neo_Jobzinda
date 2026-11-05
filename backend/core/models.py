from django.conf import settings
from django.db import models
from django.utils.text import slugify

class InvestorProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="investor_profile")
    investor_code = models.CharField(max_length=30, unique=True)
    phone = models.CharField(max_length=30, blank=True)
    is_active_investor = models.BooleanField(default=True)
    def __str__(self): return f"{self.investor_code} - {self.user.get_full_name() or self.user.username}"

class CompanyProfile(models.Model):
    legal_name = models.CharField(max_length=200, default="Neo JobZinda Private Limited")
    tagline = models.CharField(max_length=200, blank=True, default="Where skills meet opportunities")
    overview = models.TextField(blank=True)
    mission = models.TextField(blank=True)
    vision = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=40, blank=True)
    address = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.legal_name

class AppListing(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    short_description = models.CharField(max_length=240)
    website_url = models.URLField(blank=True)
    play_store_url = models.URLField(blank=True)
    app_store_url = models.URLField(blank=True)
    logo = models.ImageField(upload_to="app-logos/", blank=True, null=True)
    is_published = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)
    def save(self, *args, **kwargs):
        if not self.slug: self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    def __str__(self): return self.name

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.title

class FinancialEntry(models.Model):
    class EntryType(models.TextChoices):
        INCOME = "INCOME", "Income"
        EXPENSE = "EXPENSE", "Expense"
        INVESTMENT = "INVESTMENT", "Investment received"
    entry_type = models.CharField(max_length=12, choices=EntryType.choices)
    date = models.DateField()
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    reference = models.CharField(max_length=100, blank=True)
    receipt = models.FileField(upload_to="financial-documents/", blank=True, null=True)
    investor = models.ForeignKey(InvestorProfile, on_delete=models.SET_NULL, blank=True, null=True, related_name="entries")
    visible_to_investors = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_financial_entries")
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ["-date", "-id"]
    def __str__(self): return f"{self.entry_type}: {self.amount} - {self.description}"

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["-created_at"]
