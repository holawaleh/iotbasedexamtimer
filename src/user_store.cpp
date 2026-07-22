#include "user_store.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

#define USERS_FILE "/users.json"

static String simpleHash(const String &input) {
  uint32_t h1 = 5381, h2 = 52711;
  for (size_t i = 0; i < input.length(); i++) {
    uint8_t c = input[i];
    h1 = ((h1 << 5) + h1) + c;
    h2 = ((h2 << 5) + h2) ^ c;
  }
  char buf[17];
  snprintf(buf, sizeof(buf), "%08x%08x", h1, h2);
  return String(buf);
}

String roleToString(UserRole r) {
  switch (r) {
    case ROLE_ADMIN: return "admin";
    case ROLE_STAFF: return "staff";
    default:         return "student";
  }
}

UserRole stringToRole(const String &s) {
  if (s == "admin") return ROLE_ADMIN;
  if (s == "staff")  return ROLE_STAFF;
  return ROLE_STUDENT;
}

String statusToString(UserStatus s) {
  return s == STATUS_ACTIVE ? "active" : "suspended";
}

static UserStatus stringToStatus(const String &s) {
  return s == "suspended" ? STATUS_SUSPENDED : STATUS_ACTIVE;
}

static void writeUsersDoc(JsonDocument &doc) {
  File f = LittleFS.open(USERS_FILE, "w");
  if (!f) { Serial.println("Failed to open users.json for write"); return; }
  serializeJson(doc, f);
  f.close();
}

static bool readUsersDoc(JsonDocument &doc) {
  if (!LittleFS.exists(USERS_FILE)) return false;
  File f = LittleFS.open(USERS_FILE, "r");
  if (!f) return false;
  DeserializationError err = deserializeJson(doc, f);
  f.close();
  return !err;
}

void userStoreInit() {
  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS mount failed");
    return;
  }

  if (!LittleFS.exists(USERS_FILE)) {
    Serial.println("No users.json found - creating default admin account");
    JsonDocument doc;
    JsonArray arr = doc.to<JsonArray>();
    JsonObject admin = arr.add<JsonObject>();
    admin["username"] = "admin";
    admin["passwordHash"] = simpleHash("admin123");
    admin["role"] = "admin";
    admin["status"] = "active";
    writeUsersDoc(doc);
    Serial.println("Default admin created: username=admin password=admin123");
    Serial.println("CHANGE THIS PASSWORD after first login.");
  }
}

bool userVerify(const String &username, const String &password, UserRole &outRole, UserStatus &outStatus) {
  JsonDocument doc;
  if (!readUsersDoc(doc)) return false;
  JsonArray arr = doc.as<JsonArray>();
  for (JsonObject u : arr) {
    if (String((const char*)u["username"]) == username) {
      String storedHash = u["passwordHash"].as<String>();
      if (storedHash == simpleHash(password)) {
        outRole = stringToRole(u["role"].as<String>());
        outStatus = stringToStatus(u["status"].as<String>());
        return true;
      }
      return false;
    }
  }
  return false;
}

bool userExists(const String &username) {
  JsonDocument doc;
  if (!readUsersDoc(doc)) return false;
  JsonArray arr = doc.as<JsonArray>();
  for (JsonObject u : arr) {
    if (String((const char*)u["username"]) == username) return true;
  }
  return false;
}

bool userAdd(const String &username, const String &password, UserRole role) {
  if (userExists(username)) return false;
  JsonDocument doc;
  readUsersDoc(doc);
  JsonArray arr = doc.as<JsonArray>();
  if (arr.isNull()) arr = doc.to<JsonArray>();
  JsonObject u = arr.add<JsonObject>();
  u["username"] = username;
  u["passwordHash"] = simpleHash(password);
  u["role"] = roleToString(role);
  u["status"] = "active";
  writeUsersDoc(doc);
  return true;
}

bool userSetStatus(const String &username, UserStatus status) {
  JsonDocument doc;
  if (!readUsersDoc(doc)) return false;
  JsonArray arr = doc.as<JsonArray>();
  for (JsonObject u : arr) {
    if (String((const char*)u["username"]) == username) {
      u["status"] = statusToString(status);
      writeUsersDoc(doc);
      return true;
    }
  }
  return false;
}

bool userRemove(const String &username) {
  JsonDocument doc;
  if (!readUsersDoc(doc)) return false;
  JsonArray arr = doc.as<JsonArray>();

  JsonDocument newDoc;
  JsonArray newArr = newDoc.to<JsonArray>();
  bool found = false;
  for (JsonObject u : arr) {
    if (String((const char*)u["username"]) == username) {
      found = true;
      continue;
    }
    newArr.add(u);
  }
  if (found) writeUsersDoc(newDoc);
  return found;
}

bool userChangePassword(const String &username, const String &newPassword) {
  JsonDocument doc;
  if (!readUsersDoc(doc)) return false;
  JsonArray arr = doc.as<JsonArray>();
  for (JsonObject u : arr) {
    if (String((const char*)u["username"]) == username) {
      u["passwordHash"] = simpleHash(newPassword);
      writeUsersDoc(doc);
      return true;
    }
  }
  return false;
}

bool userSelfChangePassword(const String &username, const String &oldPassword, const String &newPassword) {
  UserRole role; UserStatus status;
  if (!userVerify(username, oldPassword, role, status)) return false;
  return userChangePassword(username, newPassword);
}

String usersToJson() {
  JsonDocument doc;
  if (!readUsersDoc(doc)) return "[]";
  JsonArray arr = doc.as<JsonArray>();
  JsonDocument outDoc;
  JsonArray outArr = outDoc.to<JsonArray>();
  for (JsonObject u : arr) {
    JsonObject o = outArr.add<JsonObject>();
    o["username"] = u["username"];
    o["role"] = u["role"];
    o["status"] = u["status"];
  }
  String out;
  serializeJson(outDoc, out);
  return out;
}