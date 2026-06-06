import json
import ssl

from django.conf import settings


def mqtt_topic_for_hall(hall_code):
    prefix = settings.MQTT["TOPIC_PREFIX"]
    return f"{prefix}/halls/{hall_code}/commands"


def publish_display_command(hall_code, payload):
    topic = mqtt_topic_for_hall(hall_code)

    if not settings.MQTT["ENABLED"]:
        return {
            "published": False,
            "topic": topic,
            "reason": "MQTT is disabled in settings.",
        }

    host = settings.MQTT["HOST"]
    if not host:
        return {
            "published": False,
            "topic": topic,
            "reason": "MQTT_HOST is not configured.",
        }

    import paho.mqtt.client as mqtt

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    username = settings.MQTT["USERNAME"]
    password = settings.MQTT["PASSWORD"]

    if username:
        client.username_pw_set(username, password or None)

    if settings.MQTT["USE_TLS"]:
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

    client.connect(host, settings.MQTT["PORT"], keepalive=30)
    result = client.publish(topic, json.dumps(payload), qos=1, retain=True)
    result.wait_for_publish()
    client.disconnect()

    if result.rc != mqtt.MQTT_ERR_SUCCESS:
        return {
            "published": False,
            "topic": topic,
            "reason": f"MQTT publish failed with code {result.rc}.",
        }

    return {"published": True, "topic": topic, "reason": ""}
