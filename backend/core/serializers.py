from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import CompanyProfile, AppListing, Announcement, FinancialEntry, InvestorProfile

class CompanyProfileSerializer(serializers.ModelSerializer):
    class Meta: model = CompanyProfile; fields = "__all__"
class AppListingSerializer(serializers.ModelSerializer):
    class Meta: model = AppListing; fields = "__all__"
class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta: model = Announcement; fields = "__all__"
class FinancialEntrySerializer(serializers.ModelSerializer):
    investor_name = serializers.SerializerMethodField()
    class Meta:
        model = FinancialEntry
        fields = "__all__"
        read_only_fields = ("created_by", "created_at")
    def get_investor_name(self, obj):
        return str(obj.investor) if obj.investor else None
class InvestorSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    class Meta: model = InvestorProfile; fields = ("id", "investor_code", "phone", "is_active_investor", "name", "email", "username", "first_name", "last_name")

class InvestorAccountCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    investor_code = serializers.CharField(
        max_length=30,
        validators=[UniqueValidator(queryset=InvestorProfile.objects.all())],
    )
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_username(self, value):
        user_model = get_user_model()
        username_field = user_model.USERNAME_FIELD
        field = user_model._meta.get_field(username_field)
        try:
            value = field.clean(value, None)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        if user_model._default_manager.filter(**{username_field: value}).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        user_model = get_user_model()
        user = user_model(
            username=attrs.get("username", ""),
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            password_validation.validate_password(attrs["password"], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": exc.messages})
        return attrs

class InvestorAccountUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    investor_code = serializers.CharField(max_length=30)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    is_active_investor = serializers.BooleanField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, trim_whitespace=False)

    def validate_username(self, value):
        user_model = get_user_model()
        username_field = user_model.USERNAME_FIELD
        field = user_model._meta.get_field(username_field)
        try:
            value = field.clean(value, self.instance.user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        existing = user_model._default_manager.filter(**{username_field: value})
        if existing.exclude(pk=self.instance.user_id).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_investor_code(self, value):
        existing = InvestorProfile.objects.filter(investor_code=value).exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("This investor code is already in use.")
        return value

    def validate(self, attrs):
        password = attrs.get("password")
        if password:
            user = self.instance.user
            user.username = attrs.get("username", user.username)
            user.email = attrs.get("email", user.email)
            user.first_name = attrs.get("first_name", user.first_name)
            user.last_name = attrs.get("last_name", user.last_name)
            try:
                password_validation.validate_password(password, user=user)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": exc.messages})
        return attrs

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        user = instance.user
        for field in ("username", "email", "first_name", "last_name"):
            if field in validated_data:
                setattr(user, field, validated_data[field])
        if "is_active_investor" in validated_data:
            user.is_active = validated_data["is_active_investor"]
        if password:
            user.set_password(password)
        user.save()
        for field in ("investor_code", "phone", "is_active_investor"):
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save()
        return instance
