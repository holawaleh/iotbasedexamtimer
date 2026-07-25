#pragma once
#include <Arduino.h>

// ---------------- Pin Definitions ----------------
extern const uint8_t PIN_CLK;
extern const uint8_t PIN_LAT;
extern const uint8_t PIN_OE;
extern const uint8_t PIN_A;
extern const uint8_t PIN_B;
extern const uint8_t PIN_DATA_X;
extern const uint8_t PIN_DATA_Y;
extern const uint8_t PIN_DATA_Z;

// ---------------- Display Geometry ----------------
extern const int DISPLAY_COLS;
extern const int DISPLAY_ROWS;
extern const int PANEL_ROWS;

#define SCAN_STATES 4
#define CHAIN_BITS  256

// ---------------- Shared Framebuffer ----------------
extern uint8_t framebuffer[48][64];