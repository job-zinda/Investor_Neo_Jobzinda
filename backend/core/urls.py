from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, AppViewSet, AnnouncementViewSet, AdminEntryViewSet, InvestorViewSet, create_investor_account, current_user, investor_dashboard, change_staff_password
router = DefaultRouter()
router.register("company", CompanyViewSet, basename="company")
router.register("apps", AppViewSet, basename="apps")
router.register("announcements", AnnouncementViewSet, basename="announcements")
router.register("admin/financial-entries", AdminEntryViewSet, basename="financial-entries")
router.register("admin/investors", InvestorViewSet, basename="investors")
urlpatterns = [
    path("admin/investors/create-account/", create_investor_account, name="create_investor_account"),
    path("", include(router.urls)),
    path("auth/me/", current_user, name="current_user"),
    path("auth/change-password/", change_staff_password, name="change_staff_password"),
    path("investor/dashboard/", investor_dashboard),
]
