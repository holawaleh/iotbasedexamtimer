#include "config.h"

const uint8_t PIN_CLK      = 18;
const uint8_t PIN_LAT      = 21;
const uint8_t PIN_OE       = 19;
const uint8_t PIN_A        = 22;
const uint8_t PIN_B        = 23;
const uint8_t PIN_DATA_X   = 25;
const uint8_t PIN_DATA_Y   = 26;
const uint8_t PIN_DATA_Z   = 27;

const int DISPLAY_COLS = 64;
const int DISPLAY_ROWS = 48;
const int PANEL_ROWS   = 16;

uint8_t framebuffer[48][64];