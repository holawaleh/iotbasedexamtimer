#pragma once
#include <Arduino.h>

enum UserRole { ROLE_ADMIN, ROLE_STAFF, ROLE_STUDENT };
enum UserStatus { STATUS_ACTIVE, STATUS_SUSPENDED };

struct UserRecord {
  String username;
  String passwordHash;
  UserRole role;
  UserStatus status;
};

void userStoreInit();
bool userVerify(const String &username, const String &password, UserRole &outRole, UserStatus &outStatus);
bool userExists(const String &username);
bool userAdd(const String &username, const String &password, UserRole role);
bool userSetStatus(const String &username, UserStatus status);
bool userRemove(const String &username);
bool userChangePassword(const String &username, const String &newPassword);
bool userSelfChangePassword(const String &username, const String &oldPassword, const String &newPassword);
String usersToJson();
String roleToString(UserRole r);
String statusToString(UserStatus s);
UserRole stringToRole(const String &s);