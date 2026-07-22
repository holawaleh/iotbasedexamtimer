#include <Arduino.h>
#include "config.h"
#include "display_driver.h"
#include "timer_engine.h"
#include "wifi_settings.h"
#include "web_server.h"
#include "user_store.h"
#include "auth.h"
#include "logger.h"
#include "ntp_clock.h"
#include "buzzer.h"
#include "exam_queue.h"
#include "cloud_sync.h"

void setup() {
  Serial.begin(115200);
  userStoreInit();
  authInit();
  loggerInit();
  buzzerInit();
  queueInit();

  wifiSetup();
  ntpClockInit();

  displayInitPins();
  memset(framebuffer, 0, sizeof(framebuffer));
  renderAll();
  displayStartTask();

  webServerSetup();
cloudSyncInit();
  Serial.println("=== EXAM TIMER ===");
}

void loop() {
  cloudSyncTick();
  timerTick();

  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("d")) {
      timerSetDuration(cmd.substring(1).toInt());
    } else if (cmd == "s") {
      timerStart();
    } else if (cmd == "p") {
      timerPauseResume();
    } else if (cmd == "z") {
      timerReset();
    } else if (cmd.startsWith("1")) {
      topLine1 = cmd.substring(1);
      renderTop();
    } else if (cmd.startsWith("3")) {
      bottomText = cmd.substring(1);
      renderBottom();
    }
  }
  delay(10);
}