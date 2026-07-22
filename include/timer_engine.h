#pragma once
#include <Arduino.h>
#include <time.h>

enum TimerState { T_IDLE, T_RUNNING, T_PAUSED, T_FINISHED };

extern TimerState timerState;
extern unsigned long durationMs;
extern unsigned long remainingMs;
extern String topLine1;
extern String topLine2;
extern String bottomText;
extern bool warningActive;
extern bool messagePaused;
extern bool scheduleEnabled;
extern time_t scheduledEpoch;

void timerSetDuration(long minutes);
void timerStart();
void timerPauseResume();
void timerReset();
void timerTick();
void renderAll();
void renderTop();
void renderTimer();
void renderBottom();

void timerSetMessage(const String &msg, unsigned long timeoutMs);
void timerPauseMessage();
void timerResumeMessage();
void timerCancelMessage();

void timerArmSchedule(int year, int month, int day, int hour, int minute);
void timerCancelSchedule();