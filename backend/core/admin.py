from django.contrib import admin
from .models import InvestorProfile, CompanyProfile, AppListing, Announcement, FinancialEntry, AuditLog
admin.site.register(InvestorProfile)
admin.site.register(CompanyProfile)
admin.site.register(AppListing)
admin.site.register(Announcement)
admin.site.register(FinancialEntry)
admin.site.register(AuditLog)
