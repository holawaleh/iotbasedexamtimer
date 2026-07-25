#include "timer_engine.h"
#include "font.h"
#include "display_driver.h"
#include "wifi_settings.h"
#include "ntp_clock.h"
#include "buzzer.h"

TimerState timerState = T_IDLE;
unsigned long durationMs   = 60UL * 60UL * 1000UL;
unsigned long remainingMs  = 60UL * 60UL * 1000UL;
static unsigned long lastTickMs = 0;
static bool flashOn = true;
static unsigned long lastFlashMs = 0;
static unsigned long finishedAtMs = 0;
static bool finishedBuzzerOn = false;

bool warningActive = false;
bool messagePaused = false;
static unsigned long messageExpiresAt = 0;
static unsigned long messagePausedRemaining = 0;

bool scheduleEnabled = false;
time_t scheduledEpoch = 0;

String topLine1   = "EXAM";
String topLine2   = "TIMER";
String bottomText = "";

void renderTop() {
  clearBand(0);
  if (timerState == T_IDLE) {
    const char* msg = wifiHasInternet() ? "CONNECTED" : "NO NET";
    drawTextAuto(msg, 0);
  } else {
    drawTextAuto(topLine1.c_str(), 0);
  }
  buildShiftData();
}

void renderTimer() {
  clearBand(16);

  bool shouldBlink = (timerState == T_FINISHED);

  if (timerState == T_IDLE) {
    int h24, m, s;
    ntpClockGetTime(h24, m, s);
    char buf[12];

    if (h24 >= 0) {
      int h12 = h24 % 12;
      if (h12 == 0) h12 = 12;
      snprintf(buf, sizeof(buf), "%d:%02d", h12, m);
    } else {
      // Not synced yet / no network: show a live "alive" indicator
      // instead of a static placeholder, so the panel visibly shows
      // the system is running and waiting, not frozen or broken.
      static unsigned long lastAnim = 0;
      static int dotCount = 0;
      if (millis() - lastAnim >= 500) {
        lastAnim = millis();
        dotCount = (dotCount + 1) % 4;
      }
      char dots[4] = "";
      for (int i = 0; i < dotCount; i++) dots[i] = '.';
      dots[dotCount] = '\0';
      snprintf(buf, sizeof(buf), "SYNC%s", dots);
    }

    drawTextAuto(buf, 16);

  } else if (shouldBlink && !flashOn) {
    // blank frame during FINISHED blink-off phase only

} else {
    unsigned long totalMin = (remainingMs + 59999) / 60000;  // round up to next minute
    char buf[8];
    snprintf(buf, sizeof(buf), "%lu", totalMin);
    int xPos = centerBig(buf);
    drawTextBig(buf, 17, xPos);
  }
  buildShiftData();
}

void renderBottom() {
  clearBand(32);

  if (timerState == T_IDLE) {
    int h24, m, s;
    ntpClockGetTime(h24, m, s);
    char buf[16];
    if (h24 >= 0) {
      struct tm timeinfo;
      time_t now;
      time(&now);
      localtime_r(&now, &timeinfo);
      snprintf(buf, sizeof(buf), "%02d:%02d:%04d",
               timeinfo.tm_mday, timeinfo.tm_mon + 1, 1900 + timeinfo.tm_year);
    } else {
      snprintf(buf, sizeof(buf), "--:--:----");
    }
    drawTextAuto(buf, 32);
  } else {
    const char *msg;
    if (bottomText.length() > 0) {
      msg = bottomText.c_str();
    } else {
      switch (timerState) {
        case T_RUNNING:  msg = warningActive ? "ALMOST UP" : "ACTIVE"; break;
        case T_PAUSED:   msg = "PAUSED";  break;
        case T_FINISHED: msg = "TIME UP"; break;
        default:         msg = "";        break;
      }
    }
    drawTextAuto(msg, 32);
  }

  buildShiftData();
}

void renderAll() {
  renderTop();
  renderTimer();
  renderBottom();
}

void timerSetDuration(long minutes) {
  if (minutes > 0 && minutes <= 999) {
    durationMs  = (unsigned long)minutes * 60UL * 1000UL;
    remainingMs = durationMs;
    timerState  = T_IDLE;
    warningActive = false;
    renderAll();
  }
}

void timerStart() {
  if (timerState == T_IDLE || timerState == T_PAUSED) {
    timerState = T_RUNNING;
    lastTickMs = millis();
    renderAll();
  }
}

void timerPauseResume() {
  if (timerState == T_RUNNING) {
    timerState = T_PAUSED;
    renderBottom();
  } else if (timerState == T_PAUSED) {
    timerState = T_RUNNING;
    lastTickMs = millis();
    renderBottom();
  }
}

void timerReset() {
  timerState  = T_IDLE;
  remainingMs = durationMs;
  warningActive = false;
  flashOn = true;
  if (finishedBuzzerOn) { buzzerOff(); finishedBuzzerOn = false; }
  renderAll();
}

void timerSetMessage(const String &msg, unsigned long timeoutMs) {
  bottomText = msg;
  messagePaused = false;
  messageExpiresAt = millis() + timeoutMs;
  renderBottom();
}

void timerPauseMessage() {
  if (bottomText.length() > 0 && !messagePaused) {
    messagePausedRemaining = messageExpiresAt - millis();
    messagePaused = true;
  }
}

void timerResumeMessage() {
  if (messagePaused) {
    messageExpiresAt = millis() + messagePausedRemaining;
    messagePaused = false;
  }
}

void timerCancelMessage() {
  bottomText = "";
  messagePaused = false;
  messageExpiresAt = 0;
  renderBottom();
}

void timerArmSchedule(int year, int month, int day, int hour, int minute) {
  struct tm t = {};
  t.tm_year = year - 1900;
  t.tm_mon  = month - 1;
  t.tm_mday = day;
  t.tm_hour = hour;
  t.tm_min  = minute;
  t.tm_sec  = 0;
  t.tm_isdst = 0;
  scheduledEpoch = mktime(&t);
  scheduleEnabled = true;
}

void timerCancelSchedule() {
  scheduleEnabled = false;
}

void timerTick() {
  unsigned long now = millis();

  if (timerState == T_RUNNING) {
    unsigned long elapsed = now - lastTickMs;
    if (elapsed >= 1000) {
      unsigned long secs = elapsed / 1000;
      lastTickMs += secs * 1000;
      unsigned long dec = secs * 1000UL;
      if (remainingMs > dec) {
        remainingMs -= dec;
      } else {
        remainingMs = 0;
      }

      bool nowWarning = remainingMs > 0 &&
                         remainingMs <= (unsigned long)(durationMs * 0.3);
      if (nowWarning && !warningActive) {
        buzzerBeep2x();
        renderBottom();  // reflect "ALMOST UP" status immediately
      }
      if (!nowWarning && warningActive) {
        renderBottom();  // clear "ALMOST UP" status if applicable
      }
      warningActive = nowWarning;

      if (remainingMs == 0) {
        timerState = T_FINISHED;
        finishedAtMs = now;
        warningActive = false;
        buzzerOn();
        finishedBuzzerOn = true;
        renderTop();
        renderBottom();
      }
      renderTimer();
    }
  }

  // Only FINISHED blinks now
  if (timerState == T_FINISHED) {
    if (now - lastFlashMs >= 500) {
      lastFlashMs = now;
      flashOn = !flashOn;
      renderTimer();
    }
  } else if (!flashOn) {
    flashOn = true;
  }

  // Finished: beep for 5s total, then auto-return to idle
  if (timerState == T_FINISHED) {
    if (finishedBuzzerOn && (now - finishedAtMs >= 5000)) {
      buzzerOff();
      finishedBuzzerOn = false;
    }
    if (now - finishedAtMs >= 5000) {
      timerState = T_IDLE;
      remainingMs = durationMs;
      flashOn = true;
      renderAll();
    }
  }

  if (timerState == T_IDLE) {
    static unsigned long lastIdleTick = 0;
    if (now - lastIdleTick >= 1000) {
      lastIdleTick = now;
      renderTop();
      renderTimer();
      renderBottom();
    }

    if (scheduleEnabled) {
      time_t nowEpoch;
      time(&nowEpoch);
      if (nowEpoch > 100000 && nowEpoch >= scheduledEpoch) {
        scheduleEnabled = false;
        timerStart();
      }
    }
  }

  if (bottomText.length() > 0 && !messagePaused && messageExpiresAt > 0) {
    if ((long)(now - messageExpiresAt) >= 0) {
      bottomText = "";
      renderBottom();
    }
  }
}