#pragma once
#include <Arduino.h>

void ntpClockInit();
bool ntpClockIsSynced();
void ntpClockGetTime(int &hour24, int &minute, int &second);