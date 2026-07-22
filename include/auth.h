#pragma once
#include <Arduino.h>
#include "user_store.h"

struct Session {
  String token;
  String username;
  UserRole role;
  unsigned long lastActive;
  bool used;
};

void authInit();
String authLogin(const String &username, const String &password, UserRole &outRole);
bool authValidate(const String &token, String &outUsername, UserRole &outRole);
void authLogout(const String &token);
void authCleanupExpired();