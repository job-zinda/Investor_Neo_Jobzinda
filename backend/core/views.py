from decimal import Decimal
from datetime import date
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from django.db import transaction
from django.db.models.functions import TruncMonth
from rest_framework import serializers, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import CompanyProfile, AppListing, Announcement, AuditLog, FinancialEntry, InvestorProfile
from .serializers import CompanyProfileSerializer, AppListingSerializer, AnnouncementSerializer, FinancialEntrySerializer, InvestorAccountCreateSerializer, InvestorSerializer
from .permissions import IsStaff, PublicReadOnlyOrStaff

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = CompanyProfile.objects.all().order_by("-updated_at")
    serializer_class = CompanyProfileSerializer
    permission_classes = [PublicReadOnlyOrStaff]
class AppViewSet(viewsets.ModelViewSet):
    serializer_class = AppListingSerializer
    permission_classes = [PublicReadOnlyOrStaff]
    def get_queryset(self):
        queryset = AppListing.objects.order_by("display_order")
        if not (self.request.user and self.request.user.is_staff):
            queryset = queryset.filter(is_published=True)
        return queryset
class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [PublicReadOnlyOrStaff]
    def get_queryset(self):
        queryset = Announcement.objects.order_by("-published_at", "-created_at")
        if not (self.request.user and self.request.user.is_staff):
            queryset = queryset.filter(published=True)
        return queryset
class AdminEntryViewSet(viewsets.ModelViewSet):
    queryset = FinancialEntry.objects.select_related("investor", "created_by").all()
    serializer_class = FinancialEntrySerializer
    permission_classes = [IsStaff]
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
class InvestorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InvestorProfile.objects.select_related("user").all()
    serializer_class = InvestorSerializer
    permission_classes = [IsStaff]

@api_view(["POST"])
@permission_classes([IsStaff])
def create_investor_account(request):
    serializer = InvestorAccountCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    values = serializer.validated_data
    user_model = get_user_model()
    with transaction.atomic():
        user = user_model.objects.create_user(
            username=values["username"],
            email=values.get("email", ""),
            first_name=values.get("first_name", ""),
            last_name=values.get("last_name", ""),
            password=values["password"],
        )
        profile = InvestorProfile.objects.create(
            user=user,
            investor_code=values["investor_code"],
            phone=values.get("phone", ""),
        )
        AuditLog.objects.create(
            actor=request.user,
            action="investor.account_created",
            object_type="InvestorProfile",
            object_id=str(profile.pk),
            details={"investor_code": profile.investor_code, "username": user.get_username()},
        )
    return Response(InvestorSerializer(profile).data, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def investor_dashboard(request):
    profile = getattr(request.user, "investor_profile", None)
    if not request.user.is_staff and (not profile or not profile.is_active_investor):
        return Response({"detail": "Investor account required."}, status=403)
    entries = FinancialEntry.objects.all()
    if not request.user.is_staff:
        entries = entries.filter(visible_to_investors=True)
    def query_date(key):
        value = request.query_params.get(key, "").strip()
        if not value:
            return None
        try:
            return date.fromisoformat(value)
        except ValueError:
            raise serializers.ValidationError({key: "Enter a valid date in YYYY-MM-DD format."})
    from_date = query_date("from_date")
    to_date = query_date("to_date")
    if from_date and to_date and from_date > to_date:
        raise serializers.ValidationError({"to_date": "End date must be on or after the start date."})
    if from_date:
        entries = entries.filter(date__gte=from_date)
    if to_date:
        entries = entries.filter(date__lte=to_date)
    own = entries if request.user.is_staff else entries.filter(investor=profile)
    def total(qs, kind):
        return qs.filter(entry_type=kind).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
    income, expenses, investments = (total(entries, k) for k in ["INCOME", "EXPENSE", "INVESTMENT"])
    trend = entries.annotate(month=TruncMonth("date")).values("month").annotate(
        income=Sum("amount", filter=Q(entry_type="INCOME")),
        expenses=Sum("amount", filter=Q(entry_type="EXPENSE")),
        investment_received=Sum("amount", filter=Q(entry_type="INVESTMENT")),
    ).order_by("month")
    return Response({
        "currency": "INR",
        "date_range": {"from": from_date, "to": to_date},
        "company": {
            "income": income, "expenses": expenses,
            "net_operating_result": income-expenses, "investment_received": investments
        },
        "monthly_trend": [{
            "month": row["month"].strftime("%Y-%m-01"),
            "income": row["income"] or Decimal("0.00"),
            "expenses": row["expenses"] or Decimal("0.00"),
            "investment_received": row["investment_received"] or Decimal("0.00"),
        } for row in trend],
        "my_investment_entries": FinancialEntrySerializer(own.filter(entry_type="INVESTMENT"), many=True).data,
        "recent_public_entries": FinancialEntrySerializer(entries[:10], many=True).data,
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    return Response({
        "id": request.user.pk,
        "username": request.user.get_username(),
        "email": request.user.email,
        "is_staff": request.user.is_staff,
    })
