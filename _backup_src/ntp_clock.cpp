#include "ntp_clock.h"
#include "wifi_settings.h"
#include <time.h>

// West Africa Time = UTC+1, no DST
static const long GMT_OFFSET_SEC = 1 * 3600;
static const int  DST_OFFSET_SEC = 0;

static bool synced = false;

void ntpClockInit() {
  if (!wifiHasInternet()) {
    Serial.println("NTP: no internet, skipping sync");
    return;
  }

  configTime(GMT_OFFSET_SEC, DST_OFFSET_SEC, "pool.ntp.org", "time.nist.gov");

  Serial.print("NTP: syncing");
  struct tm timeinfo;
  int attempts = 0;
  while (!getLocalTime(&timeinfo) && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (attempts < 20) {
    synced = true;
    Serial.println("NTP: synced successfully");
  } else {
    synced = false;
    Serial.println("NTP: sync failed");
  }
}

bool ntpClockIsSynced() {
  return synced;
}

void ntpClockGetTime(int &hour24, int &minute, int &second) {
  struct tm timeinfo;
  if (getLocalTime(&timeinfo, 0)) {
    hour24 = timeinfo.tm_hour;
    minute = timeinfo.tm_min;
    second = timeinfo.tm_sec;
  } else {
    hour24 = -1;
    minute = -1;
    second = -1;
  }
}