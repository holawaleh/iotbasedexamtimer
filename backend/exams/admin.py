from django.contrib import admin

from .models import DisplayLog, ExaminationSession, Hall


@admin.register(Hall)
class HallAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "device_id", "is_active")
    search_fields = ("name", "code", "device_id")
    list_filter = ("is_active",)


@admin.register(ExaminationSession)
class ExaminationSessionAdmin(admin.ModelAdmin):
    list_display = ("course_code", "hall", "start_time", "duration_seconds", "status")
    search_fields = ("course_code", "course_title", "hall__name", "hall__code")
    list_filter = ("status", "hall")


@admin.register(DisplayLog)
class DisplayLogAdmin(admin.ModelAdmin):
    list_display = ("event", "hall", "session", "topic", "created_at")
    search_fields = ("event", "hall__code", "topic", "message")
    list_filter = ("event", "hall")
