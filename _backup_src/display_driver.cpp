#include "display_driver.h"
#include "config.h"

static uint8_t shiftX[4][256];
static uint8_t shiftY[4][256];
static uint8_t shiftZ[4][256];

static void buildBand(uint8_t dest[SCAN_STATES][CHAIN_BITS], int rowOffset) {
  memset(dest, 0, SCAN_STATES * CHAIN_BITS);
  for (int r = 0; r < PANEL_ROWS; r++) {
    for (int fbCol = 0; fbCol < DISPLAY_COLS; fbCol++) {
      if (!framebuffer[rowOffset + r][fbCol]) continue;
      int physCol    = 64 - fbCol;
      int physRow    = r + 1;
      int strip      = (64 - physCol) / 8;
      int colInStrip = (64 - physCol) % 8;
      int rowSlot    = (16 - physRow) / 4;
      int rowInBand  = (physRow - 1) % 4;
      int state      = rowInBand;
      int bitPos     = strip * 32 + rowSlot * 8 + colInStrip;
      if (bitPos >= 0 && bitPos < CHAIN_BITS) dest[state][bitPos] = 1;
    }
  }
}

void buildShiftData() {
  buildBand(shiftX, 0);
  buildBand(shiftY, 16);
  buildBand(shiftZ, 32);
}

static inline void clockPulse() {
  digitalWrite(PIN_CLK, HIGH);
  digitalWrite(PIN_CLK, LOW);
}

static inline void latch() {
  digitalWrite(PIN_LAT, LOW);
  digitalWrite(PIN_LAT, HIGH);
}

static inline void outputEnable(bool enable) {
  digitalWrite(PIN_OE, enable ? HIGH : LOW);
}

static void displayRefreshTask(void *param) {
  while (true) {
    for (uint8_t state = 0; state < SCAN_STATES; state++) {
      outputEnable(false);
      delayMicroseconds(10);
      digitalWrite(PIN_A, (state & 0x01) ? HIGH : LOW);
      digitalWrite(PIN_B, (state & 0x02) ? HIGH : LOW);
      for (int i = 0; i < CHAIN_BITS; i++) {
        digitalWrite(PIN_DATA_X, shiftX[state][i] ? LOW : HIGH);
        digitalWrite(PIN_DATA_Y, shiftY[state][i] ? LOW : HIGH);
        digitalWrite(PIN_DATA_Z, shiftZ[state][i] ? LOW : HIGH);
        clockPulse();
      }
      latch();
      delayMicroseconds(2);
      outputEnable(true);
      delayMicroseconds(2500);
    }
    vTaskDelay(1);
  }
}

void displayInitPins() {
  pinMode(PIN_CLK,    OUTPUT);
  pinMode(PIN_LAT,    OUTPUT);
  pinMode(PIN_OE,     OUTPUT);
  pinMode(PIN_A,      OUTPUT);
  pinMode(PIN_B,      OUTPUT);
  pinMode(PIN_DATA_X, OUTPUT);
  pinMode(PIN_DATA_Y, OUTPUT);
  pinMode(PIN_DATA_Z, OUTPUT);
  digitalWrite(PIN_DATA_X, HIGH);
  digitalWrite(PIN_DATA_Y, HIGH);
  digitalWrite(PIN_DATA_Z, HIGH);
  digitalWrite(PIN_LAT,    HIGH);
  outputEnable(false);
}
void displayStartTask() {
  xTaskCreatePinnedToCore(
    displayRefreshTask,
    "DisplayRefresh",
    4096,
    NULL,
    2,     // priority: was 24, now moderate
    NULL,
    1      // core: was 0, now 1 (away from WiFi's core 0 tasks)
  );
}