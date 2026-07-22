#include "cloud_sync.h"
#include "wifi_settings.h"
#include "timer_engine.h"
#include "logger.h"
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

static unsigned long lastPushMs = 0;
static unsigned long lastPollMs = 0;
static const unsigned long PUSH_INTERVAL_MS = 3000;
static const unsigned long POLL_INTERVAL_MS = 3000;

static const char* stateToStr(TimerState s) {
  switch (s) {
    case T_RUNNING:  return "RUNNING";
    case T_PAUSED:   return "PAUSED";
    case T_FINISHED: return "FINISHED";
    default:         return "IDLE";
  }
}

void cloudSyncInit() {
  Serial.println("Cloud sync ready (active only when STA has internet)");
}

static void pushStatus() {
  WiFiClientSecure client;
  client.setInsecure();  // simplest approach - skips cert validation

  HTTPClient http;
  String url = String(CLOUD_API_BASE) + "/api/status";
  if (!http.begin(client, url)) return;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-secret", DEVICE_SECRET);

  JsonDocument doc;
  doc["state"] = stateToStr(timerState);
  doc["remainingMs"] = remainingMs;
  doc["durationMs"] = durationMs;
  doc["courseCode"] = topLine1;
  doc["message"] = bottomText;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();
  if (code != 200) {
    Serial.print("Cloud push failed, code=");
    Serial.println(code);
  }
}

static void pollCommand() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(CLOUD_API_BASE) + "/api/command";
  if (!http.begin(client, url)) return;
  http.addHeader("x-device-secret", DEVICE_SECRET);

  int code = http.GET();
  if (code != 200) {
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) return;

  if (doc["command"].isNull()) return;
  String cmd = doc["command"].as<String>();
  JsonObject params = doc["params"];

  if (cmd == "start") {
    timerStart();
    logEvent("cloud", "START", "");
  } else if (cmd == "pause") {
    timerPauseResume();
    logEvent("cloud", "PAUSE_RESUME", "");
  } else if (cmd == "reset") {
    timerReset();
    logEvent("cloud", "RESET", "");
  } else if (cmd == "set") {
    if (!params["line1"].isNull()) {
      topLine1 = params["line1"].as<String>();
      renderTop();
    }
    if (!params["duration"].isNull()) {
      timerSetDuration(params["duration"].as<long>());
    }
    logEvent("cloud", "SET", "");
  } else if (cmd == "message") {
    String msg = params["message"].isNull() ? "" : params["message"].as<String>();
    long timeoutSec = params["timeout"].isNull() ? 60 : params["timeout"].as<long>();
    timerSetMessage(msg, timeoutSec * 1000UL);
    logEvent("cloud", "MESSAGE", msg);
  }
}

void cloudSyncTick() {
  if (!wifiHasInternet()) return;

  unsigned long now = millis();
  if (now - lastPushMs >= PUSH_INTERVAL_MS) {
    lastPushMs = now;
    pushStatus();
  }
  if (now - lastPollMs >= POLL_INTERVAL_MS) {
    lastPollMs = now;
    pollCommand();
  }
}