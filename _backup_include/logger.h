#pragma once
#include <Arduino.h>

void loggerInit();
void logEvent(const String &username, const String &action, const String &details);
String logListJson();
void loggerClear();