#include <Arduino.h>
#include "dashboard_html.h"

const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Smart Exam Timer</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, Segoe UI, Roboto, sans-serif;
      background: #0f172a; color: #e2e8f0; margin: 0; padding: 24px;
      display: flex; flex-direction: column; align-items: center;
    }
    .wrap { width: 100%; max-width: 860px; }
    h1 { font-size: 22px; color: #38bdf8; margin: 0; }
    .topbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px; gap: 12px;
    }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .whoami { font-size: 13px; color: #94a3b8; }
    .btn-logout-sm {
      background: #64748b; color: white; border: none; border-radius: 6px;
      padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
    }
    .status { font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
    .running-banner {
      display: none;
      background: #16a34a; color: white; text-align: center;
      padding: 10px; border-radius: 8px; font-size: 14px;
      font-weight: 600; margin-bottom: 16px;
    }
    .running-banner.show { display: block; }

    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #334155; flex-wrap: wrap; }
    .tab-btn {
      background: none; border: none; color: #94a3b8; padding: 10px 18px;
      font-size: 14px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent;
    }
    .tab-btn.active { color: #38bdf8; border-bottom-color: #38bdf8; }
    .tab-btn.hidden { display: none; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) {
      .grid { grid-template-columns: 1fr 1fr; }
    }

    .card {
      background: #1e293b; border-radius: 12px; padding: 20px;
      margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .timer-display {
      font-size: 56px; font-weight: 700; text-align: center;
      color: #38bdf8; letter-spacing: 2px;
    }
    .timer-display.warning { color: #f87171; animation: pulse 1s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .state-badge {
      display: inline-block; padding: 4px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 600; text-transform: uppercase;
      margin: 8px auto;
    }
    .state-idle { background: #475569; }
    .state-running { background: #16a34a; animation: glow 1.5s infinite; }
    .state-paused { background: #d97706; }
    .state-finished { background: #dc2626; }
    @keyframes glow {
      0%,100% { box-shadow: 0 0 4px #16a34a; }
      50% { box-shadow: 0 0 14px #22c55e; }
    }
    .center { text-align: center; }
    label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 4px; margin-top: 12px; }
    input, select {
      width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #334155;
      background: #0f172a; color: #e2e8f0; font-size: 14px;
    }
    .btn-row { display: flex; gap: 8px; margin-top: 16px; }
    button {
      flex: 1; padding: 12px; border: none; border-radius: 8px;
      font-size: 14px; font-weight: 600; cursor: pointer; color: white;
    }
    .btn-start { background: #16a34a; }
    .btn-pause { background: #d97706; }
    .btn-reset { background: #dc2626; }
    .btn-set { background: #2563eb; width: 100%; margin-top: 12px; }
    .btn-small { flex: 1; padding: 8px; font-size: 12px; }
    .btn-msg-pause { background: #d97706; }
    .btn-msg-cancel { background: #dc2626; }
    .preview-wrap { display: flex; justify-content: center; margin-top: 12px; }
    #preview { background: #000; border-radius: 4px; }

    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 8px 4px; font-size: 13px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-weight: 600; }
    .role-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
    }
    .role-admin { background: #7c3aed; }
    .role-staff { background: #2563eb; }
    .role-student { background: #475569; }
    .status-active { color: #4ade80; }
    .status-suspended { color: #f87171; }
    .row-actions { display: flex; gap: 4px; flex-wrap: wrap; }
    .btn-tiny { padding: 4px 8px; font-size: 11px; flex: none; }
    .btn-suspend { background: #d97706; }
    .btn-activate { background: #16a34a; }
    .btn-remove { background: #dc2626; }
    .btn-pass { background: #64748b; }
    .msg { font-size: 13px; margin-top: 8px; min-height: 16px; }
    .msg.err { color: #f87171; }
    .msg.ok { color: #4ade80; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="topbar">
    <h1>Smart Exam Timer</h1>
    <div class="topbar-right">
      <span class="whoami" id="whoami"></span>
      <button class="btn-logout-sm" onclick="doLogout()">Sign Out</button>
    </div>
  </div>
  <div class="status" id="connStatus">Connecting...</div>
  <div class="running-banner" id="runningBanner">A programme is currently running</div>

  <div class="tabs">
    <button class="tab-btn active" onclick="showTab('dashboard')">Dashboard</button>
    <button class="tab-btn" onclick="showTab('settings')">Settings</button>
    <button class="tab-btn hidden" id="adminTabBtn" onclick="showTab('admin')">Admin</button>
    <button class="tab-btn hidden" id="logsTabBtn" onclick="showTab('logs')">Logs</button>
  </div>

  <!-- DASHBOARD TAB -->
  <div class="tab-content active" id="tab-dashboard">
    <div class="grid">
      <div class="card center">
        <div id="stateBadge" class="state-badge state-idle">IDLE</div>
        <div class="timer-display" id="timerDisplay">--:--</div>
        <div class="btn-row">
          <button class="btn-start" onclick="cmd('start')">Start</button>
          <button class="btn-pause" onclick="cmd('pause')">Pause</button>
          <button class="btn-reset" onclick="cmd('reset')">Reset</button>
        </div>
      </div>
      <div class="card center">
        <label style="margin-top:0">Live Board Preview</label>
        <div class="preview-wrap"><canvas id="preview"></canvas></div>
      </div>
    </div>
  </div>

  <!-- SETTINGS TAB -->
  <div class="tab-content" id="tab-settings">
    <div class="grid">
      <div class="card">
        <label style="margin-top:0">Exam Title / Course Code</label>
        <input type="text" id="line1" placeholder="e.g. PHY 201" maxlength="20">
        <label>Duration (minutes)</label>
        <input type="number" id="duration" placeholder="e.g. 90" min="1" max="999">
        <button class="btn-set" onclick="setAll()">Apply Settings</button>
      </div>

      <div class="card">
        <label style="margin-top:0">Bottom Message Override</label>
        <input type="text" id="message" placeholder="leave empty for auto" maxlength="20">
        <label>Timeout (seconds)</label>
        <input type="number" id="msgTimeout" placeholder="60" value="60" min="5" max="600">
        <button class="btn-set" onclick="setMessage()">Set Message</button>
        <div class="btn-row" style="margin-top:8px">
          <button class="btn-small btn-msg-pause" id="msgToggleBtn" onclick="msgToggle()">Pause</button>
          <button class="btn-small btn-msg-cancel" onclick="msgAction('cancel')">Cancel</button>
        </div>
      </div>

      <div class="card">
        <label style="margin-top:0">Scheduled Start</label>
        <input type="date" id="schedDate">
        <label>Time</label>
        <input type="time" id="schedTime">
        <div class="btn-row">
          <button class="btn-start" onclick="armSchedule()">Arm Schedule</button>
          <button class="btn-reset" onclick="cancelSchedule()">Cancel</button>
        </div>
      </div>

      <div class="card">
        <label style="margin-top:0">My Account</label>
        <input type="password" id="myOldPass" placeholder="Current password">
        <input type="password" id="myNewPass" placeholder="New password" style="margin-top:8px">
        <button class="btn-set" onclick="changeMyPassword()">Change Password</button>
        <div class="msg" id="myPassMsg"></div>
      </div>
    </div>

    <div class="card">
      <label style="margin-top:0">Exam Queue (not auto-started)</label>
      <input type="text" id="queueCode" placeholder="Course code">
      <input type="number" id="queueDuration" placeholder="Duration (min)" style="margin-top:8px">
      <button class="btn-set" onclick="addQueue()">Add to Queue</button>
      <table>
        <thead><tr><th>Course</th><th>Duration</th><th></th></tr></thead>
        <tbody id="queueBody"></tbody>
      </table>
    </div>
  </div>

  <!-- ADMIN TAB -->
  <div class="tab-content" id="tab-admin">
    <div class="card">
      <label style="margin-top:0">New Username</label>
      <input type="text" id="newUsername" placeholder="e.g. jsmith">
      <label>New Password</label>
      <input type="password" id="newPassword" placeholder="min 4 characters">
      <label>Role</label>
      <select id="newRole">
        <option value="staff">Staff</option>
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>
      <button class="btn-set" onclick="addUser()">Add User</button>
      <div class="msg" id="addMsg"></div>
    </div>
    <div class="card">
      <table id="usersTable">
        <thead><tr><th>Username</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="usersBody"></tbody>
      </table>
      <div class="msg" id="listMsg"></div>
    </div>
  </div>

  <!-- LOGS TAB -->
  <div class="tab-content" id="tab-logs">
    <div class="card">
      <table>
        <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
        <tbody id="logsBody"></tbody>
      </table>
      <div class="msg" id="logsMsg"></div>
    </div>
  </div>
</div>

<script>
let lastMessagePaused = false;

function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
  if (name === 'admin') loadUsers();
  if (name === 'logs') loadLogs();
  if (name === 'settings') loadQueue();
}

async function cmd(action) {
  const res = await fetch('/api/' + action, { method: 'POST' });
  if (res.status === 401) { window.location.href = '/login'; return; }
  refresh();
}

async function setAll() {
  const line1 = document.getElementById('line1').value;
  const duration = document.getElementById('duration').value;
  const params = new URLSearchParams();
  if (line1) params.append('line1', line1);
  if (duration) params.append('duration', duration);
  const res = await fetch('/api/set', { method: 'POST', body: params });
  if (res.status === 401) { window.location.href = '/login'; return; }
  refresh();
}

async function setMessage() {
  const message = document.getElementById('message').value;
  const timeout = document.getElementById('msgTimeout').value || 60;
  const params = new URLSearchParams();
  params.append('action', 'set');
  params.append('message', message);
  params.append('timeout', timeout);
  const res = await fetch('/api/message', { method: 'POST', body: params });
  if (res.status === 401) { window.location.href = '/login'; return; }
  refresh();
}

async function msgToggle() {
  const action = lastMessagePaused ? 'resume' : 'pause';
  await msgAction(action);
}

async function msgAction(action) {
  const params = new URLSearchParams();
  params.append('action', action);
  const res = await fetch('/api/message', { method: 'POST', body: params });
  if (res.status === 401) { window.location.href = '/login'; return; }
  refresh();
}

async function armSchedule() {
  const dateVal = document.getElementById('schedDate').value;
  const timeVal = document.getElementById('schedTime').value;
  if (!dateVal || !timeVal) { alert('Pick a date and time'); return; }
  const [y, mo, d] = dateVal.split('-').map(Number);
  const [h, mi] = timeVal.split(':').map(Number);
  const params = new URLSearchParams();
  params.append('year', y);
  params.append('month', mo);
  params.append('day', d);
  params.append('hour', h);
  params.append('minute', mi);
  await fetch('/api/schedule', { method: 'POST', body: params });
  alert('Schedule armed - timer will auto-start at the chosen time.');
}

async function cancelSchedule() {
  await fetch('/api/schedule/cancel', { method: 'POST' });
  alert('Schedule cancelled.');
}

async function loadQueue() {
  const res = await fetch('/api/queue');
  if (res.status === 401) { window.location.href = '/login'; return; }
  const items = await res.json();
  const body = document.getElementById('queueBody');
  body.innerHTML = '';
  items.forEach(q => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${q.courseCode}</td><td>${q.durationMin} min</td>
      <td><button class="btn-tiny btn-remove" onclick="removeQueue(${q.index})">Remove</button></td>`;
    body.appendChild(tr);
  });
}

async function addQueue() {
  const code = document.getElementById('queueCode').value.trim();
  const dur = document.getElementById('queueDuration').value;
  if (!code || !dur) { alert('Enter course code and duration'); return; }
  const params = new URLSearchParams();
  params.append('courseCode', code);
  params.append('duration', dur);
  await fetch('/api/queue/add', { method: 'POST', body: params });
  document.getElementById('queueCode').value = '';
  document.getElementById('queueDuration').value = '';
  loadQueue();
}

async function removeQueue(index) {
  const params = new URLSearchParams();
  params.append('index', index);
  await fetch('/api/queue/remove', { method: 'POST', body: params });
  loadQueue();
}

async function changeMyPassword() {
  const oldPass = document.getElementById('myOldPass').value;
  const newPass = document.getElementById('myNewPass').value;
  const msg = document.getElementById('myPassMsg');
  msg.textContent = '';
  if (!oldPass || newPass.length < 4) {
    msg.textContent = 'Enter current password and a new password (min 4 chars).';
    msg.className = 'msg err';
    return;
  }
  const params = new URLSearchParams();
  params.append('oldPassword', oldPass);
  params.append('newPassword', newPass);
  const res = await fetch('/api/me/password', { method: 'POST', body: params });
  if (res.ok) {
    msg.textContent = 'Password changed successfully.';
    msg.className = 'msg ok';
    document.getElementById('myOldPass').value = '';
    document.getElementById('myNewPass').value = '';
  } else {
    msg.textContent = 'Failed - check your current password.';
    msg.className = 'msg err';
  }
}

async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

function decodeFb(b64) {
  const bin = atob(b64);
  const bits = new Uint8Array(48 * 64);
  let idx = 0;
  for (let i = 0; i < bin.length; i++) {
    const byte = bin.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      if (idx < bits.length) bits[idx++] = (byte >> b) & 1;
    }
  }
  return bits;
}

function drawPreview(bits) {
  const canvas = document.getElementById('preview');
  const ctx = canvas.getContext('2d');
  const scale = 5;
  canvas.width = 64 * scale;
  canvas.height = 48 * scale;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f87171';
  for (let r = 0; r < 48; r++) {
    for (let c = 0; c < 64; c++) {
      if (bits[r * 64 + c]) {
        ctx.fillRect(c * scale, r * scale, scale - 1, scale - 1);
      }
    }
  }
}

async function refresh() {
  try {
    const res = await fetch('/api/status');
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    document.getElementById('connStatus').textContent = 'Connected';
    document.getElementById('whoami').textContent = data.you + ' (' + data.role + ')';
    document.getElementById('adminTabBtn').classList.toggle('hidden', data.role !== 'admin');
    document.getElementById('logsTabBtn').classList.toggle('hidden', data.role !== 'admin');

    const banner = document.getElementById('runningBanner');
    banner.classList.toggle('show', data.state === 'RUNNING');

    const mins = Math.floor(data.remainingMs / 60000);
    const secs = Math.floor((data.remainingMs % 60000) / 1000);
    const disp = document.getElementById('timerDisplay');
    disp.textContent = (data.state === 'IDLE') ? '--:--' :
      String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    disp.classList.toggle('warning', data.warning);

    const badge = document.getElementById('stateBadge');
    badge.textContent = data.state;
    badge.className = 'state-badge state-' + data.state.toLowerCase();

    lastMessagePaused = data.messagePaused;
    document.getElementById('msgToggleBtn').textContent = data.messagePaused ? 'Resume' : 'Pause';

    drawPreview(decodeFb(data.fb));
  } catch (e) {
    document.getElementById('connStatus').textContent = 'Disconnected - retrying...';
  }
}

async function loadUsers() {
  const res = await fetch('/api/admin/users');
  if (res.status === 401) { window.location.href = '/login'; return; }
  if (res.status === 403) {
    document.getElementById('listMsg').textContent = 'Admin access only.';
    document.getElementById('listMsg').className = 'msg err';
    return;
  }
  const users = await res.json();
  const body = document.getElementById('usersBody');
  body.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    const statusClass = u.status === 'active' ? 'status-active' : 'status-suspended';
    tr.innerHTML = `
      <td>${u.username}</td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td class="${statusClass}">${u.status}</td>
      <td class="row-actions">
        ${u.status === 'active'
          ? `<button class="btn-tiny btn-suspend" onclick="suspendUser('${u.username}')">Suspend</button>`
          : `<button class="btn-tiny btn-activate" onclick="activateUser('${u.username}')">Activate</button>`}
        <button class="btn-tiny btn-pass" onclick="changePassword('${u.username}')">Password</button>
        <button class="btn-tiny btn-remove" onclick="removeUser('${u.username}')">Remove</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

async function addUser() {
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  const msg = document.getElementById('addMsg');
  msg.textContent = '';
  if (!username || password.length < 4) {
    msg.textContent = 'Username required, password min 4 chars.';
    msg.className = 'msg err';
    return;
  }
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', password);
  params.append('role', role);
  const res = await fetch('/api/admin/users/add', { method: 'POST', body: params });
  if (res.ok) {
    msg.textContent = 'User added.';
    msg.className = 'msg ok';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    loadUsers();
  } else {
    const text = await res.text();
    msg.textContent = 'Failed: ' + text;
    msg.className = 'msg err';
  }
}

async function suspendUser(username) { await postAction('/api/admin/users/suspend', username); }
async function activateUser(username) { await postAction('/api/admin/users/activate', username); }
async function removeUser(username) {
  if (!confirm('Remove user "' + username + '"? This cannot be undone.')) return;
  await postAction('/api/admin/users/remove', username);
}
async function changePassword(username) {
  const newPass = prompt('New password for ' + username + ' (min 4 chars):');
  if (!newPass || newPass.length < 4) return;
  const params = new URLSearchParams();
  params.append('username', username);
  params.append('password', newPass);
  await fetch('/api/admin/users/password', { method: 'POST', body: params });
  alert('Password updated for ' + username);
}
async function postAction(url, username) {
  const params = new URLSearchParams();
  params.append('username', username);
  await fetch(url, { method: 'POST', body: params });
  loadUsers();
}

async function loadLogs() {
  const res = await fetch('/api/logs');
  if (res.status === 401) { window.location.href = '/login'; return; }
  if (res.status === 403) {
    document.getElementById('logsMsg').textContent = 'Admin access only.';
    document.getElementById('logsMsg').className = 'msg err';
    return;
  }
  const logs = await res.json();
  const body = document.getElementById('logsBody');
  body.innerHTML = '';
  logs.slice().reverse().forEach(l => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.time}</td><td>${l.user}</td><td>${l.action}</td><td>${l.details}</td>`;
    body.appendChild(tr);
  });
}

setInterval(refresh, 1000);
refresh();
</script>
</body>
</html>
)rawliteral";