from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import DisplayLog, ExaminationSession, Hall


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email", "password", "password_confirm"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = get_user_model().objects.create_user(
            password=password,
            is_staff=True,
            **validated_data,
        )
        return user


class HallSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField(read_only=True)

    def get_created_by(self, obj):
        if obj.created_by:
            return obj.created_by.get_username()
        return None
    class Meta:
        model = Hall
        fields = [
            "id",
            "name",
            "code",
            "device_id",
            "created_by",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class ExaminationSessionSerializer(serializers.ModelSerializer):
    hall_detail = HallSerializer(source="hall", read_only=True)
    start_epoch = serializers.IntegerField(read_only=True)

    class Meta:
        model = ExaminationSession
        fields = [
            "id",
            "course_code",
            "course_title",
            "hall",
            "hall_detail",
            "start_time",
            "start_epoch",
            "duration_seconds",
            "status",
            "activated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["activated_at", "created_at", "updated_at"]

    def validate_duration_seconds(self, value):
        if value < 60:
            raise serializers.ValidationError("Duration must be at least 60 seconds.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)


class DisplayLogSerializer(serializers.ModelSerializer):
    hall_detail = HallSerializer(source="hall", read_only=True)

    class Meta:
        model = DisplayLog
        fields = [
            "id",
            "session",
            "hall",
            "hall_detail",
            "event",
            "topic",
            "payload",
            "message",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class DisplayCurrentSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(allow_null=True)
    hall = serializers.CharField()
    device_id = serializers.CharField()
    course = serializers.CharField(allow_blank=True)
    course_title = serializers.CharField(allow_blank=True)
    start_epoch = serializers.IntegerField(allow_null=True)
    duration_seconds = serializers.IntegerField(allow_null=True)
    status = serializers.CharField()
