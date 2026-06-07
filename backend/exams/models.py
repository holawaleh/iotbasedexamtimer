from django.conf import settings
from django.db import models
from django.utils import timezone


class Hall(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.SlugField(max_length=50, unique=True)
    device_id = models.CharField(max_length=80, unique=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name='halls',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.device_id})"


class ExaminationSession(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SCHEDULED = "SCHEDULED", "Scheduled"
        ACTIVE = "ACTIVE", "Active"
        PAUSED = "PAUSED", "Paused"
        FINISHED = "FINISHED", "Finished"
        CANCELLED = "CANCELLED", "Cancelled"

    course_code = models.CharField(max_length=30)
    course_title = models.CharField(max_length=180, blank=True)
    hall = models.ForeignKey(Hall, related_name="sessions", on_delete=models.PROTECT)
    start_time = models.DateTimeField()
    duration_seconds = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
    )
    activated_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="exam_sessions",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_time"]

    def __str__(self):
        return f"{self.course_code} - {self.hall.code}"

    @property
    def start_epoch(self):
        return int(self.start_time.timestamp())

    def build_display_payload(self, event_type="START"):
        return {
            "type": event_type,
            "session_id": self.id,
            "hall": self.hall.code,
            "device_id": self.hall.device_id,
            "course": self.course_code,
            "course_title": self.course_title,
            "start_epoch": self.start_epoch,
            "duration_seconds": self.duration_seconds,
            "status": self.status,
        }

    def activate(self):
        self.status = self.Status.ACTIVE
        self.activated_at = timezone.now()
        self.save(update_fields=["status", "activated_at", "updated_at"])


class DisplayLog(models.Model):
    class Event(models.TextChoices):
        ACTIVATED = "ACTIVATED", "Activated"
        PAUSED = "PAUSED", "Paused"
        FINISHED = "FINISHED", "Finished"
        BROADCAST = "BROADCAST", "Broadcast"
        MQTT_PUBLISH_FAILED = "MQTT_PUBLISH_FAILED", "MQTT publish failed"

    session = models.ForeignKey(
        ExaminationSession,
        related_name="display_logs",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    hall = models.ForeignKey(Hall, related_name="display_logs", on_delete=models.PROTECT)
    event = models.CharField(max_length=40, choices=Event.choices)
    topic = models.CharField(max_length=200, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.event} - {self.hall.code}"
