#pragma once
#include <Arduino.h>

// Non-persistent (RAM-only) queue of upcoming exams. This is a storage/UI
// provision only - nothing automatically dequeues or starts these entries.
#define MAX_QUEUE_ENTRIES 10

struct QueueEntry {
  String courseCode;
  long durationMin;
  bool used;
};

void queueInit();
bool queueAdd(const String &courseCode, long durationMin);
bool queueRemove(int index);
String queueToJson();