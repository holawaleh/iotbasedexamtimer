#include "auth.h"

#define MAX_SESSIONS 5
#define SESSION_TIMEOUT_MS (30UL * 60UL * 1000UL)  // 30 minutes

static Session sessions[MAX_SESSIONS];

static String generateToken() {
  String token = "";
  const char chars[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (int i = 0; i < 24; i++) {
    token += chars[random(0, 62)];
  }
  return token;
}

void authInit() {
  randomSeed(esp_random());
  for (int i = 0; i < MAX_SESSIONS; i++) {
    sessions[i].used = false;
  }
}

void authCleanupExpired() {
  unsigned long now = millis();
  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (sessions[i].used && (now - sessions[i].lastActive > SESSION_TIMEOUT_MS)) {
      sessions[i].used = false;
    }
  }
}

String authLogin(const String &username, const String &password, UserRole &outRole) {
  UserRole role;
  UserStatus status;
  if (!userVerify(username, password, role, status)) {
    return "";  // invalid credentials
  }
  if (status == STATUS_SUSPENDED) {
    return "";  // suspended accounts cannot log in
  }

  authCleanupExpired();

  // Find a free slot, or evict the oldest if full
  int slot = -1;
  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (!sessions[i].used) { slot = i; break; }
  }
  if (slot == -1) {
    // evict oldest
    unsigned long oldest = ULONG_MAX;
    for (int i = 0; i < MAX_SESSIONS; i++) {
      if (sessions[i].lastActive < oldest) {
        oldest = sessions[i].lastActive;
        slot = i;
      }
    }
  }

  sessions[slot].token = generateToken();
  sessions[slot].username = username;
  sessions[slot].role = role;
  sessions[slot].lastActive = millis();
  sessions[slot].used = true;

  outRole = role;
  return sessions[slot].token;
}

bool authValidate(const String &token, String &outUsername, UserRole &outRole) {
  if (token.length() == 0) return false;
  authCleanupExpired();
  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (sessions[i].used && sessions[i].token == token) {
      sessions[i].lastActive = millis();
      outUsername = sessions[i].username;
      outRole = sessions[i].role;
      return true;
    }
  }
  return false;
}

void authLogout(const String &token) {
  for (int i = 0; i < MAX_SESSIONS; i++) {
    if (sessions[i].used && sessions[i].token == token) {
      sessions[i].used = false;
      return;
    }
  }
}