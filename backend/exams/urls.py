from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    DisplayLogViewSet,
    ExaminationSessionViewSet,
    HallViewSet,
    authenticated_user,
    current_display_session,
    signup,
)


router = DefaultRouter()
router.register("halls", HallViewSet)
router.register("sessions", ExaminationSessionViewSet)
router.register("logs", DisplayLogViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("auth/signup/", signup, name="auth-signup"),
    path("auth/me/", authenticated_user, name="auth-me"),
    path("display/current/", current_display_session, name="display-current"),
]
