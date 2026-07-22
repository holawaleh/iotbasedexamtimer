#include "web_server.h"
#include "timer_engine.h"
#include "auth.h"
#include "user_store.h"
#include "logger.h"
#include "config.h"
#include "exam_queue.h"
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>
#include "dashboard_html.h"

static AsyncWebServer server(80);

static const char b64chars[] =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

static String base64Encode(const uint8_t *data, size_t len) {
  String out;
  out.reserve(((len + 2) / 3) * 4);
  size_t i = 0;
  while (i + 3 <= len) {
    uint32_t n = ((uint32_t)data[i] << 16) | ((uint32_t)data[i+1] << 8) | data[i+2];
    out += b64chars[(n >> 18) & 0x3F];
    out += b64chars[(n >> 12) & 0x3F];
    out += b64chars[(n >> 6) & 0x3F];
    out += b64chars[n & 0x3F];
    i += 3;
  }
  size_t rem = len - i;
  if (rem == 1) {
    uint32_t n = (uint32_t)data[i] << 16;
    out += b64chars[(n >> 18) & 0x3F];
    out += b64chars[(n >> 12) & 0x3F];
    out += "==";
  } else if (rem == 2) {
    uint32_t n = ((uint32_t)data[i] << 16) | ((uint32_t)data[i+1] << 8);
    out += b64chars[(n >> 18) & 0x3F];
    out += b64chars[(n >> 12) & 0x3F];
    out += b64chars[(n >> 6) & 0x3F];
    out += "=";
  }
  return out;
}

static void packFramebuffer(uint8_t *out384) {
  memset(out384, 0, 384);
  int bitIndex = 0;
  for (int r = 0; r < DISPLAY_ROWS; r++) {
    for (int c = 0; c < DISPLAY_COLS; c++) {
      if (framebuffer[r][c]) {
        out384[bitIndex / 8] |= (1 << (7 - (bitIndex % 8)));
      }
      bitIndex++;
    }
  }
}

static String getTokenFromRequest(AsyncWebServerRequest *request) {
  if (!request->hasHeader("Cookie")) return "";
  String cookie = request->getHeader("Cookie")->value();
  int idx = cookie.indexOf("session=");
  if (idx == -1) return "";
  int start = idx + 8;
  int end = cookie.indexOf(';', start);
  if (end == -1) end = cookie.length();
  return cookie.substring(start, end);
}

static bool requireAuth(AsyncWebServerRequest *request, String &outUser, UserRole &outRole) {
  String token = getTokenFromRequest(request);
  if (!authValidate(token, outUser, outRole)) {
    request->send(401, "text/plain", "Unauthorized");
    return false;
  }
  return true;
}

static bool requireAdmin(AsyncWebServerRequest *request, String &outUser) {
  UserRole role;
  if (!requireAuth(request, outUser, role)) return false;
  if (role != ROLE_ADMIN) {
    request->send(403, "text/plain", "Forbidden - admin only");
    return false;
  }
  return true;
}

static bool requireStaffOrAdmin(AsyncWebServerRequest *request, String &outUser, UserRole &outRole) {
  if (!requireAuth(request, outUser, outRole)) return false;
  if (outRole == ROLE_STUDENT) {
    request->send(403, "text/plain", "Forbidden");
    return false;
  }
  return true;
}

static const char* stateToStr(TimerState s) {
  switch (s) {
    case T_RUNNING:  return "RUNNING";
    case T_PAUSED:   return "PAUSED";
    case T_FINISHED: return "FINISHED";
    default:         return "IDLE";
  }
}

static const char LOGIN_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Smart Exam Timer - Login</title>
  <style>
    body {
      font-family: -apple-system, Segoe UI, Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0; margin: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
    }
    .card {
      background: #1e293b; border-radius: 12px; padding: 32px;
      width: 100%; max-width: 340px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    h1 { font-size: 20px; color: #38bdf8; text-align: center; margin-bottom: 24px; }
    label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; margin-top: 12px; }
    input {
      width: 100%; box-sizing: border-box; padding: 10px;
      border-radius: 8px; border: 1px solid #334155;
      background: #0f172a; color: #e2e8f0; font-size: 14px;
    }
    button {
      width: 100%; margin-top: 20px; padding: 12px;
      border: none; border-radius: 8px; background: #2563eb;
      color: white; font-size: 14px; font-weight: 600; cursor: pointer;
    }
    .error { color: #f87171; font-size: 13px; text-align: center; margin-top: 12px; min-height: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Smart Exam Timer</h1>
    <label>Username</label>
    <input type="text" id="username" autocomplete="username">
    <label>Password</label>
    <input type="password" id="password" autocomplete="current-password">
    <button onclick="doLogin()">Sign In</button>
    <div class="error" id="errorMsg"></div>
  </div>
<script>
async function doLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('errorMsg');
  errorMsg.textContent = '';
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  const res = await fetch('/api/login', { method: 'POST', body: params });
  if (res.ok) {
    window.location.href = '/';
  } else {
    errorMsg.textContent = 'Invalid username or password';
  }
}
document.getElementById('password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
</script>
</body>
</html>
)rawliteral";

void webServerSetup() {
  server.on("/login", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send_P(200, "text/html", LOGIN_HTML);
  });

  server.on("/api/login", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (!request->hasParam("username", true) || !request->hasParam("password", true)) {
      request->send(400, "text/plain", "Missing credentials");
      return;
    }
    String username = request->getParam("username", true)->value();
    String password = request->getParam("password", true)->value();

    UserRole role;
    String token = authLogin(username, password, role);
    if (token.length() == 0) {
      request->send(401, "text/plain", "Invalid credentials");
      return;
    }

    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", "OK");
    String cookie = "session=" + token + "; Path=/; Max-Age=1800";
    response->addHeader("Set-Cookie", cookie);
    request->send(response);

    logEvent(username, "LOGIN", "role=" + roleToString(role));
  });

  server.on("/api/logout", HTTP_POST, [](AsyncWebServerRequest *request) {
    String token = getTokenFromRequest(request);
    String user; UserRole role;
    if (authValidate(token, user, role)) {
      logEvent(user, "LOGOUT", "");
    }
    authLogout(token);
    AsyncWebServerResponse *response = request->beginResponse(200, "text/plain", "OK");
    response->addHeader("Set-Cookie", "session=; Path=/; Max-Age=0");
    request->send(response);
  });

  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    String token = getTokenFromRequest(request);
    if (!authValidate(token, user, role)) {
      request->redirect("/login");
      return;
    }
    request->send_P(200, "text/html", INDEX_HTML);
  });

  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireAuth(request, user, role)) return;

    uint8_t fbBytes[384];
    packFramebuffer(fbBytes);

    JsonDocument doc;
    doc["state"] = stateToStr(timerState);
    doc["remainingMs"] = remainingMs;
    doc["durationMs"] = durationMs;
    doc["line1"] = topLine1;
    doc["message"] = bottomText;
    doc["messagePaused"] = messagePaused;
    doc["warning"] = warningActive;
    doc["you"] = user;
    doc["role"] = roleToString(role);
    doc["fb"] = base64Encode(fbBytes, 384);

    String out;
    serializeJson(doc, out);
    request->send(200, "application/json", out);
  });

  server.on("/api/start", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    timerStart();
    logEvent(user, "START", "");
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/pause", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    timerPauseResume();
    logEvent(user, "PAUSE_RESUME", "");
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/reset", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    timerReset();
    logEvent(user, "RESET", "");
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/set", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;

    String details = "";
    if (request->hasParam("line1", true)) {
      topLine1 = request->getParam("line1", true)->value();
      details += "line1=" + topLine1 + " ";
    }
    if (request->hasParam("duration", true)) {
      long mins = request->getParam("duration", true)->value().toInt();
      timerSetDuration(mins);
      details += "duration=" + String(mins) + "min";
    }
    renderTop();
    logEvent(user, "SET", details);
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/message", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;

    String action = request->hasParam("action", true)
                       ? request->getParam("action", true)->value()
                       : "set";

    if (action == "pause") {
      timerPauseMessage();
      logEvent(user, "MESSAGE_PAUSE", "");
    } else if (action == "resume") {
      timerResumeMessage();
      logEvent(user, "MESSAGE_RESUME", "");
    } else if (action == "cancel") {
      timerCancelMessage();
      logEvent(user, "MESSAGE_CANCEL", "");
    } else {
      String msg = request->hasParam("message", true)
                     ? request->getParam("message", true)->value()
                     : "";
      unsigned long timeoutSec = 60;
      if (request->hasParam("timeout", true)) {
        long t = request->getParam("timeout", true)->value().toInt();
        if (t > 0) timeoutSec = t;
      }
      timerSetMessage(msg, timeoutSec * 1000UL);
      logEvent(user, "MESSAGE", msg);
    }

    request->send(200, "text/plain", "OK");
  });

  // ---------- Schedule ----------
  server.on("/api/schedule", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    if (!request->hasParam("year", true) || !request->hasParam("month", true) ||
        !request->hasParam("day", true) || !request->hasParam("hour", true) ||
        !request->hasParam("minute", true)) {
      request->send(400, "text/plain", "Missing fields");
      return;
    }
    int y = request->getParam("year", true)->value().toInt();
    int mo = request->getParam("month", true)->value().toInt();
    int d = request->getParam("day", true)->value().toInt();
    int h = request->getParam("hour", true)->value().toInt();
    int mi = request->getParam("minute", true)->value().toInt();
    timerArmSchedule(y, mo, d, h, mi);
    logEvent(user, "SCHEDULE_ARM", String(y) + "-" + String(mo) + "-" + String(d) + " " + String(h) + ":" + String(mi));
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/schedule/cancel", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    timerCancelSchedule();
    logEvent(user, "SCHEDULE_CANCEL", "");
    request->send(200, "text/plain", "OK");
  });

  // ---------- Queue (provision only, not enforced) ----------
  server.on("/api/queue", HTTP_GET, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireAuth(request, user, role)) return;
    request->send(200, "application/json", queueToJson());
  });

  server.on("/api/queue/add", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    if (!request->hasParam("courseCode", true) || !request->hasParam("duration", true)) {
      request->send(400, "text/plain", "Missing fields");
      return;
    }
    String code = request->getParam("courseCode", true)->value();
    long dur = request->getParam("duration", true)->value().toInt();
    bool ok = queueAdd(code, dur);
    if (!ok) { request->send(409, "text/plain", "Queue full"); return; }
    logEvent(user, "QUEUE_ADD", code + " " + String(dur) + "min");
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/queue/remove", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireStaffOrAdmin(request, user, role)) return;
    if (!request->hasParam("index", true)) { request->send(400, "text/plain", "Missing index"); return; }
    int idx = request->getParam("index", true)->value().toInt();
    queueRemove(idx);
    logEvent(user, "QUEUE_REMOVE", String(idx));
    request->send(200, "text/plain", "OK");
  });

  // ---------- Self-service password change (any logged-in role) ----------
  server.on("/api/me/password", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user; UserRole role;
    if (!requireAuth(request, user, role)) return;
    if (!request->hasParam("oldPassword", true) || !request->hasParam("newPassword", true)) {
      request->send(400, "text/plain", "Missing fields");
      return;
    }
    String oldPass = request->getParam("oldPassword", true)->value();
    String newPass = request->getParam("newPassword", true)->value();
    if (newPass.length() < 4) {
      request->send(400, "text/plain", "Password too short");
      return;
    }
    bool ok = userSelfChangePassword(user, oldPass, newPass);
    if (!ok) { request->send(401, "text/plain", "Current password incorrect"); return; }
    logEvent(user, "SELF_CHANGE_PASSWORD", "");
    request->send(200, "text/plain", "OK");
  });

  // ---------- Logs (admin only) ----------
  server.on("/api/logs", HTTP_GET, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;
    request->send(200, "application/json", logListJson());
  });

  // ---------- Admin: list users ----------
  server.on("/api/admin/users", HTTP_GET, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;
    request->send(200, "application/json", usersToJson());
  });

  // ---------- Admin: add user ----------
  server.on("/api/admin/users/add", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;

    if (!request->hasParam("username", true) || !request->hasParam("password", true) ||
        !request->hasParam("role", true)) {
      request->send(400, "text/plain", "Missing fields");
      return;
    }
    String newUsername = request->getParam("username", true)->value();
    String newPassword = request->getParam("password", true)->value();
    String roleStr = request->getParam("role", true)->value();

    if (newUsername.length() == 0 || newPassword.length() < 4) {
      request->send(400, "text/plain", "Invalid username or password too short");
      return;
    }

    bool ok = userAdd(newUsername, newPassword, stringToRole(roleStr));
    if (!ok) {
      request->send(409, "text/plain", "Username already exists");
      return;
    }

    logEvent(user, "ADD_USER", newUsername + " role=" + roleStr);
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/admin/users/suspend", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;
    if (!request->hasParam("username", true)) { request->send(400, "text/plain", "Missing username"); return; }
    String target = request->getParam("username", true)->value();
    userSetStatus(target, STATUS_SUSPENDED);
    logEvent(user, "SUSPEND_USER", target);
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/admin/users/activate", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;
    if (!request->hasParam("username", true)) { request->send(400, "text/plain", "Missing username"); return; }
    String target = request->getParam("username", true)->value();
    userSetStatus(target, STATUS_ACTIVE);
    logEvent(user, "ACTIVATE_USER", target);
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/admin/users/remove", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;
    if (!request->hasParam("username", true)) { request->send(400, "text/plain", "Missing username"); return; }
    String target = request->getParam("username", true)->value();

    if (target == user) {
      request->send(400, "text/plain", "Cannot remove your own account");
      return;
    }

    bool ok = userRemove(target);
    if (!ok) { request->send(404, "text/plain", "User not found"); return; }
    logEvent(user, "REMOVE_USER", target);
    request->send(200, "text/plain", "OK");
  });

  server.on("/api/admin/users/password", HTTP_POST, [](AsyncWebServerRequest *request) {
    String user;
    if (!requireAdmin(request, user)) return;
    if (!request->hasParam("username", true) || !request->hasParam("password", true)) {
      request->send(400, "text/plain", "Missing fields");
      return;
    }
    String target = request->getParam("username", true)->value();
    String newPassword = request->getParam("password", true)->value();
    if (newPassword.length() < 4) {
      request->send(400, "text/plain", "Password too short");
      return;
    }
    bool ok = userChangePassword(target, newPassword);
    if (!ok) { request->send(404, "text/plain", "User not found"); return; }
    logEvent(user, "CHANGE_PASSWORD", target);
    request->send(200, "text/plain", "OK");
  });

  server.begin();
  Serial.println("Web server started on port 80");
}