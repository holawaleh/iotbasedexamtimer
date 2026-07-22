#include "logger.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

#define LOGS_FILE "/logs.json"
#define MAX_LOG_ENTRIES 200

void loggerInit() {
  if (!LittleFS.exists(LOGS_FILE)) {
    File f = LittleFS.open(LOGS_FILE, "w");
    if (f) {
      f.print("[]");
      f.close();
    }
  }
}

static String timestampStr() {
  time_t now;
  time(&now);
  if (now < 100000) {
    unsigned long s = millis() / 1000;
    char buf[24];
    sprintf(buf, "uptime+%02lu:%02lu:%02lu", s / 3600, (s % 3600) / 60, s % 60);
    return String(buf);
  }
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char buf[24];
  strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buf);
}

void logEvent(const String &username, const String &action, const String &details) {
  JsonDocument doc;
  File f = LittleFS.open(LOGS_FILE, "r");
  if (f) {
    deserializeJson(doc, f);
    f.close();
  }
  if (!doc.is<JsonArray>()) doc.to<JsonArray>();

  JsonArray arr = doc.as<JsonArray>();

  while (arr.size() >= MAX_LOG_ENTRIES) {
    arr.remove(0);
  }

  JsonObject entry = arr.add<JsonObject>();
  entry["time"] = timestampStr();
  entry["user"] = username;
  entry["action"] = action;
  entry["details"] = details;

  File out = LittleFS.open(LOGS_FILE, "w");
  if (out) {
    serializeJson(doc, out);
    out.close();
  }
}

String logListJson() {
  File f = LittleFS.open(LOGS_FILE, "r");
  if (!f) return "[]";
  String content = f.readString();
  f.close();
  return content;
}

void loggerClear() {
  File f = LittleFS.open(LOGS_FILE, "w");
  if (f) {
    f.print("[]");
    f.close();
  }
}