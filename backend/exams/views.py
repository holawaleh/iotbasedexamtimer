from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import DisplayLog, ExaminationSession, Hall
from .mqtt import publish_display_command
from .serializers import (
    DisplayCurrentSerializer,
    DisplayLogSerializer,
    ExaminationSessionSerializer,
    HallSerializer,
    SignupSerializer,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "service": "iotbasedexamtimer-api"})


class HallViewSet(viewsets.ModelViewSet):
    queryset = Hall.objects.all()
    serializer_class = HallSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"])
    def emergency(self, request, pk=None):
        hall = self.get_object()
        message = str(request.data.get("message", "")).strip()
        if not message:
            return Response({"detail": "Emergency message is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 180:
            return Response({"detail": "Emergency message must be 180 characters or fewer."}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "type": "EMERGENCY",
            "hall": hall.code,
            "device_id": hall.device_id,
            "message": message,
            "server_epoch": int(timezone.now().timestamp()),
        }
        publish_result = publish_display_command(hall.code, payload)
        DisplayLog.objects.create(
            session=None,
            hall=hall,
            event=DisplayLog.Event.BROADCAST if publish_result["published"] else DisplayLog.Event.MQTT_PUBLISH_FAILED,
            topic=publish_result["topic"],
            payload=payload,
            message=publish_result["reason"] or message,
        )

        return Response({"message": message, "mqtt": publish_result})
    
    def create(self, request, *args, **kwargs):
        code = request.data.get('code')
        device_id = request.data.get('device_id')

        existing = Hall.objects.filter(Q(code=code) | Q(device_id=device_id)).first()
        if existing:
            # If existing hall already has an owner, prevent new user from claiming it
            if existing.created_by and existing.created_by != request.user:
                return Response({'detail': 'Device or hall already registered by another user.'}, status=400)
            return Response({'detail': 'Device or hall already exists.'}, status=400)

        # assign owner
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # set owner explicitly
        hall = Hall.objects.get(pk=serializer.data['id'])
        if request.user.is_authenticated:
            hall.created_by = request.user
            hall.save(update_fields=['created_by'])

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)


class ExaminationSessionViewSet(viewsets.ModelViewSet):
    queryset = ExaminationSession.objects.select_related("hall", "created_by")
    serializer_class = ExaminationSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        hall = self.request.query_params.get("hall")
        session_status = self.request.query_params.get("status")

        if hall:
            queryset = queryset.filter(Q(hall__code=hall) | Q(hall__device_id=hall))
        if session_status:
            queryset = queryset.filter(status=session_status.upper())

        return queryset

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        session = self.get_object()
        session.activate()
        payload = session.build_display_payload(event_type="START")
        publish_result = publish_display_command(session.hall.code, payload)

        event = (
            DisplayLog.Event.ACTIVATED
            if publish_result["published"]
            else DisplayLog.Event.MQTT_PUBLISH_FAILED
        )
        DisplayLog.objects.create(
            session=session,
            hall=session.hall,
            event=event,
            topic=publish_result["topic"],
            payload=payload,
            message=publish_result["reason"],
        )

        data = ExaminationSessionSerializer(session, context={"request": request}).data
        data["mqtt"] = publish_result
        return Response(data)

    @action(detail=True, methods=["post"])
    def finish(self, request, pk=None):
        session = self.get_object()
        session.status = ExaminationSession.Status.FINISHED
        session.save(update_fields=["status", "updated_at"])
        payload = session.build_display_payload(event_type="FINISH")
        publish_result = publish_display_command(session.hall.code, payload)
        DisplayLog.objects.create(
            session=session,
            hall=session.hall,
            event=DisplayLog.Event.FINISHED,
            topic=publish_result["topic"],
            payload=payload,
            message=publish_result["reason"],
        )
        return Response(ExaminationSessionSerializer(session, context={"request": request}).data)

    @action(detail=False, methods=["get"])
    def active_count(self, request):
        count = self.get_queryset().filter(status=ExaminationSession.Status.ACTIVE).count()
        return Response({"active": count})


class DisplayLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DisplayLog.objects.select_related("hall", "session")
    serializer_class = DisplayLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        hall = self.request.query_params.get("hall")
        if hall:
            queryset = queryset.filter(Q(hall__code=hall) | Q(hall__device_id=hall))
        return queryset


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def authenticated_user(request):
    user = request.user
    return Response(
        {
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
            "is_staff": user.is_staff,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def current_display_session(request):
    hall_param = request.query_params.get("hall") or request.query_params.get("device_id")
    if not hall_param:
        return Response(
            {"detail": "Provide hall code or device_id query parameter."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    hall = Hall.objects.filter(Q(code=hall_param) | Q(device_id=hall_param), is_active=True).first()
    if not hall:
        return Response({"detail": "Display hall not found."}, status=status.HTTP_404_NOT_FOUND)

    session = (
        ExaminationSession.objects.filter(
            hall=hall,
            status__in=[
                ExaminationSession.Status.ACTIVE,
                ExaminationSession.Status.SCHEDULED,
            ],
        )
        .order_by("-activated_at", "start_time")
        .first()
    )

    if not session:
        payload = {
            "session_id": None,
            "hall": hall.code,
            "device_id": hall.device_id,
            "course": "",
            "course_title": "",
            "start_epoch": None,
            "duration_seconds": None,
            "status": "IDLE",
        }
        return Response(DisplayCurrentSerializer(payload).data)

    if session.status == ExaminationSession.Status.SCHEDULED and session.start_time <= timezone.now():
        session.activate()

    payload = session.build_display_payload(event_type="SYNC")
    payload["server_epoch"] = int(timezone.now().timestamp())
    serializer = DisplayCurrentSerializer(
        {
            "session_id": payload["session_id"],
            "hall": payload["hall"],
            "device_id": payload["device_id"],
            "course": payload["course"],
            "course_title": payload["course_title"],
            "start_epoch": payload["start_epoch"],
            "duration_seconds": payload["duration_seconds"],
            "status": payload["status"],
        }
    )
    data = serializer.data
    data["server_epoch"] = payload["server_epoch"]
    return Response(data)


