#include "wifi_settings.h"
#include "secrets.h"
#include <WiFi.h>
#include <ESPmDNS.h>

static bool staConnected = false;

void wifiSetup() {
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  IPAddress apIP = WiFi.softAPIP();
  Serial.print("AP started. SSID: ");
  Serial.println(AP_SSID);
  Serial.print("AP IP address: ");
  Serial.println(apIP);

  Serial.print("Connecting to STA WiFi: ");
  Serial.println(STA_SSID);
  WiFi.begin(STA_SSID, STA_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    staConnected = true;
    Serial.println();
    Serial.print("STA connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    staConnected = false;
    Serial.println();
    Serial.println("STA connection failed - continuing on AP only");
  }

  if (MDNS.begin("examtimer")) {
    Serial.println("mDNS responder started: http://examtimer.local");
  } else {
    Serial.println("mDNS setup failed");
  }
}

bool wifiHasInternet() {
  return staConnected && WiFi.status() == WL_CONNECTED;
}