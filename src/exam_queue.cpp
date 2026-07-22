#include "exam_queue.h"

static QueueEntry queueEntries[MAX_QUEUE_ENTRIES];

void queueInit() {
  for (int i = 0; i < MAX_QUEUE_ENTRIES; i++) queueEntries[i].used = false;
}

bool queueAdd(const String &courseCode, long durationMin) {
  for (int i = 0; i < MAX_QUEUE_ENTRIES; i++) {
    if (!queueEntries[i].used) {
      queueEntries[i].courseCode = courseCode;
      queueEntries[i].durationMin = durationMin;
      queueEntries[i].used = true;
      return true;
    }
  }
  return false; // queue full
}

bool queueRemove(int index) {
  if (index < 0 || index >= MAX_QUEUE_ENTRIES) return false;
  if (!queueEntries[index].used) return false;
  queueEntries[index].used = false;
  return true;
}

String queueToJson() {
  String out = "[";
  bool first = true;
  for (int i = 0; i < MAX_QUEUE_ENTRIES; i++) {
    if (!queueEntries[i].used) continue;
    if (!first) out += ",";
    first = false;
    out += "{\"index\":" + String(i) + ",\"courseCode\":\"" + queueEntries[i].courseCode +
           "\",\"durationMin\":" + String(queueEntries[i].durationMin) + "}";
  }
  out += "]";
  return out;
}