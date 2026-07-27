#include "cloud_sync.h"
#include "wifi_settings.h"
#include "timer_engine.h"
#include "logger.h"
#include "exam_queue.h"
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

static unsigned long lastPushMs    = 0;
static unsigned long lastPollMs    = 0;
static unsigned long lastLogPushMs = 0;
static const unsigned long PUSH_INTERVAL_MS     = 3000;
static const unsigned long POLL_INTERVAL_MS     = 3000;
static const unsigned long LOG_PUSH_INTERVAL_MS = 60000;

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
  client.setInsecure();

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
  doc["queue"] = serialized(queueToJson());

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();
  if (code != 200) {
    Serial.print("Cloud push failed, code=");
    Serial.println(code);
  }
}

static void pushLogs() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String(CLOUD_API_BASE) + "/api/logs";
  if (!http.begin(client, url)) return;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-secret", DEVICE_SECRET);

  JsonDocument doc;
  doc["logs"] = serialized(logListJson());

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  http.end();
  if (code != 200) {
    Serial.print("Cloud log push failed, code=");
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

  } else if (cmd == "message_pause") {
    timerPauseMessage();
    logEvent("cloud", "MESSAGE_PAUSE", "");

  } else if (cmd == "message_resume") {
    timerResumeMessage();
    logEvent("cloud", "MESSAGE_RESUME", "");

  } else if (cmd == "message_cancel") {
    timerCancelMessage();
    logEvent("cloud", "MESSAGE_CANCEL", "");

  } else if (cmd == "schedule") {
    int y  = params["year"]   | 0;
    int mo = params["month"]  | 0;
    int d  = params["day"]    | 0;
    int h  = params["hour"]   | 0;
    int mi = params["minute"] | 0;
    if (y > 0 && mo > 0 && d > 0) {
      timerArmSchedule(y, mo, d, h, mi);
      logEvent("cloud", "SCHEDULE_ARM", "");
    }

  } else if (cmd == "schedule_cancel") {
    timerCancelSchedule();
    logEvent("cloud", "SCHEDULE_CANCEL", "");

  } else if (cmd == "queue_add") {
    String code = params["courseCode"].isNull() ? "" : params["courseCode"].as<String>();
    long dur = params["duration"].isNull() ? 0 : params["duration"].as<long>();
    if (code.length() > 0 && dur > 0) {
      queueAdd(code, dur);
      logEvent("cloud", "QUEUE_ADD", code);
    }

  } else if (cmd == "queue_remove") {
    int idx = params["index"].isNull() ? -1 : params["index"].as<int>();
    if (idx >= 0) {
      queueRemove(idx);
      logEvent("cloud", "QUEUE_REMOVE", String(idx));
    }
  }
}

// Runs entirely on its own task - blocking HTTPS calls never stall
// loop()/timerTick() on core 1.
static void cloudSyncTask(void *param) {
  while (true) {
    if (wifiHasInternet()) {
      unsigned long now = millis();
      if (now - lastPushMs >= PUSH_INTERVAL_MS) {
        lastPushMs = now;
        pushStatus();
      }
      if (now - lastPollMs >= POLL_INTERVAL_MS) {
        lastPollMs = now;
        pollCommand();
      }
      if (now - lastLogPushMs >= LOG_PUSH_INTERVAL_MS) {
        lastLogPushMs = now;
        pushLogs();
      }
    }
    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

void cloudSyncStartTask() {
  xTaskCreatePinnedToCore(
    cloudSyncTask,
    "CloudSync",
    8192,
    NULL,
    1,
    NULL,
    1
  );
}
