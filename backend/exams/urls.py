from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DisplayLogViewSet,
    ExaminationSessionViewSet,
    HallViewSet,
    current_display_session,
)


router = DefaultRouter()
router.register("halls", HallViewSet)
router.register("sessions", ExaminationSessionViewSet)
router.register("logs", DisplayLogViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("display/current/", current_display_session, name="display-current"),
]
