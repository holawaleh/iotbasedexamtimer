#pragma once
#include <Arduino.h>

void buzzerInit();
void buzzerBeep2x();   // blocking short double-beep (used for 30% warning)
void buzzerOn();       // non-blocking, for pulsed alarm patterns
void buzzerOff();