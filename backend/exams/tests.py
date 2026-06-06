from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from .models import DisplayLog, ExaminationSession, Hall


class DisplaySessionApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="admin",
            password="pass12345",
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.hall = Hall.objects.create(
            name="Hall A",
            code="hall-a",
            device_id="esp32-hall-a",
        )

    @override_settings(
        MQTT={
            "ENABLED": False,
            "HOST": "",
            "PORT": 8883,
            "USERNAME": "",
            "PASSWORD": "",
            "USE_TLS": True,
            "TOPIC_PREFIX": "exam-timer",
        }
    )
    def test_activate_session_records_log_even_when_mqtt_disabled(self):
        session = ExaminationSession.objects.create(
            course_code="COM 412",
            hall=self.hall,
            start_time=timezone.now() + timedelta(minutes=5),
            duration_seconds=7200,
            created_by=self.user,
        )

        response = self.client.post(reverse("examinationsession-activate", args=[session.id]))

        self.assertEqual(response.status_code, 200)
        session.refresh_from_db()
        self.assertEqual(session.status, ExaminationSession.Status.ACTIVE)
        self.assertEqual(DisplayLog.objects.count(), 1)
        self.assertFalse(response.data["mqtt"]["published"])

    def test_current_display_session_is_public(self):
        ExaminationSession.objects.create(
            course_code="COM 412",
            hall=self.hall,
            start_time=timezone.now() + timedelta(minutes=5),
            duration_seconds=7200,
            status=ExaminationSession.Status.ACTIVE,
        )

        public_client = APIClient()
        response = public_client.get(reverse("display-current"), {"hall": "hall-a"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["course"], "COM 412")
        self.assertEqual(response.data["status"], "ACTIVE")

    def test_signup_creates_staff_user(self):
        public_client = APIClient()

        response = public_client.post(
            reverse("auth-signup"),
            {
                "username": "newadmin",
                "email": "newadmin@example.com",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = get_user_model().objects.get(username="newadmin")
        self.assertTrue(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_auth_me_returns_current_user(self):
        response = self.client.get(reverse("auth-me"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "admin")
