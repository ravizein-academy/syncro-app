/**
 * WorkFlow PWA (Syncro) - Google Apps Script Backend (REST API)
 * 100% Free Tier Database using Google Sheets
 * 
 * Deployment Instructions:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Extensions > Apps Script
 * 3. Replace all code with this file content
 * 4. Run `initDatabase()` once in Apps Script editor to create tables & headers
 * 5. Click "Deploy" > "New deployment" > Select type: "Web app"
 * 6. Execute as: "Me", Who has access: "Anyone"
 * 7. Copy the generated Web App URL into your .env.local:
 *    NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
 */

const SHEET_NAMES = {
  TASKS: 'Tasks',
  USERS: 'Users',
  TEAMS: 'Teams',
  SPACES: 'Spaces',
  TIME_LOGS: 'TimeLogs'
};

const HEADERS = {
  TASKS: ['id', 'title', 'description', 'status', 'priority', 'dueDate', 'scheduledTime', 'durationMinutes', 'assignedTo', 'spaceId', 'createdAt', 'updatedAt'],
  USERS: ['id', 'name', 'email', 'avatar', 'role', 'team'],
  TEAMS: ['id', 'name', 'division', 'leaderId'],
  SPACES: ['id', 'name', 'color', 'icon'],
  TIME_LOGS: ['id', 'taskId', 'userId', 'durationMinutes', 'logDate', 'notes', 'createdAt']
};

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'getInitialData';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let result = {};

    switch (action) {
      case 'getInitialData':
        result = {
          tasks: getSheetData(ss, SHEET_NAMES.TASKS),
          users: getSheetData(ss, SHEET_NAMES.USERS),
          teams: getSheetData(ss, SHEET_NAMES.TEAMS),
          spaces: getSheetData(ss, SHEET_NAMES.SPACES),
          timeLogs: getSheetData(ss, SHEET_NAMES.TIME_LOGS)
        };
        break;

      case 'getTasks':
        result = { tasks: getSheetData(ss, SHEET_NAMES.TASKS) };
        break;

      case 'getUsers':
        result = { users: getSheetData(ss, SHEET_NAMES.USERS) };
        break;

      case 'getTeams':
        result = { teams: getSheetData(ss, SHEET_NAMES.TEAMS) };
        break;

      case 'getSpaces':
        result = { spaces: getSheetData(ss, SHEET_NAMES.SPACES) };
        break;

      case 'getTimeLogs':
        result = { timeLogs: getSheetData(ss, SHEET_NAMES.TIME_LOGS) };
        break;

      default:
        result = { error: 'Unknown action: ' + action };
    }

    return responseJson({ status: 'success', data: result });
  } catch (err) {
    return responseJson({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let result = {};

    switch (action) {
      case 'createTask':
        result = createTask(ss, payload.data);
        break;

      case 'updateTask':
        result = updateTask(ss, payload.id, payload.data);
        break;

      case 'deleteTask':
        result = deleteTask(ss, payload.id);
        break;

      case 'logTime':
        result = logTime(ss, payload.data);
        break;

      case 'seedDemoData':
        result = seedDemoData(ss);
        break;

      default:
        return responseJson({ status: 'error', message: 'Unknown action: ' + action });
    }

    return responseJson({ status: 'success', data: result });
  } catch (err) {
    return responseJson({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Read data from sheet as JSON array of objects
 */
function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

/**
 * Create a new task
 */
function createTask(ss, data) {
  const sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  const id = 'task_' + Utilities.getUuid().substring(0, 8);
  const now = new Date().toISOString();

  const row = [
    id,
    data.title || 'Untitled Task',
    data.description || '',
    data.status || 'todo',
    data.priority || 'medium',
    data.dueDate || '',
    data.scheduledTime || '',
    data.durationMinutes || 30,
    data.assignedTo || '',
    data.spaceId || 'space_general',
    now,
    now
  ];

  sheet.appendRow(row);
  return { id: id, ...data, createdAt: now, updatedAt: now };
}

/**
 * Update an existing task
 */
function updateTask(ss, id, updates) {
  const sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) throw new Error('Task not found');

  const headers = values[0];
  const idColIdx = headers.indexOf('id');
  const updatedColIdx = headers.indexOf('updatedAt');

  for (let r = 1; r < values.length; r++) {
    if (values[r][idColIdx] == id) {
      Object.keys(updates).forEach(key => {
        const cIdx = headers.indexOf(key);
        if (cIdx !== -1) {
          sheet.getRange(r + 1, cIdx + 1).setValue(updates[key]);
        }
      });
      if (updatedColIdx !== -1) {
        sheet.getRange(r + 1, updatedColIdx + 1).setValue(new Date().toISOString());
      }
      return { id: id, ...updates };
    }
  }

  throw new Error('Task ID ' + id + ' not found');
}

/**
 * Delete a task
 */
function deleteTask(ss, id) {
  const sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  const values = sheet.getDataRange().getValues();
  const idColIdx = values[0].indexOf('id');

  for (let r = 1; r < values.length; r++) {
    if (values[r][idColIdx] == id) {
      sheet.deleteRow(r + 1);
      return { id: id, deleted: true };
    }
  }

  throw new Error('Task ID ' + id + ' not found');
}

/**
 * Log Time Tracking Entry
 */
function logTime(ss, data) {
  const sheet = ss.getSheetByName(SHEET_NAMES.TIME_LOGS);
  const id = 'log_' + Utilities.getUuid().substring(0, 8);
  const now = new Date().toISOString();

  const row = [
    id,
    data.taskId || '',
    data.userId || '',
    data.durationMinutes || 0,
    data.logDate || now.substring(0, 10),
    data.notes || '',
    now
  ];

  sheet.appendRow(row);
  return { id: id, ...data, createdAt: now };
}

/**
 * Helper JSON response with CORS
 */
function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Initialize Tables & Headers (Run once manually in Apps Script)
 */
function initDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(SHEET_NAMES).forEach(key => {
    const sheetName = SHEET_NAMES[key];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS[key]);
    }
  });

  // Remove default 'Sheet1' if exists and empty
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

/**
 * Seed initial sample demo data
 */
function seedDemoData(ss) {
  initDatabase();
  const today = new Date().toISOString().substring(0, 10);

  // Users
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (userSheet.getLastRow() <= 1) {
    userSheet.appendRow(['user_1', 'Ravi Zein', 'ravizein@itsecacademy.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', 'Admin', 'Product & Tech']);
    userSheet.appendRow(['user_2', 'Sarah Connor', 'sarah@itsecacademy.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', 'Member', 'Engineering']);
    userSheet.appendRow(['user_3', 'Alex Rivera', 'alex@itsecacademy.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', 'Member', 'Cyber Security']);
  }

  // Spaces
  const spaceSheet = ss.getSheetByName(SHEET_NAMES.SPACES);
  if (spaceSheet.getLastRow() <= 1) {
    spaceSheet.appendRow(['space_1', 'Product Development', '#6366f1', 'Layers']);
    spaceSheet.appendRow(['space_2', 'IT Security Operations', '#ef4444', 'Shield']);
    spaceSheet.appendRow(['space_3', 'Academy & Training', '#10b981', 'GraduationCap']);
  }

  // Tasks
  const taskSheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (taskSheet.getLastRow() <= 1) {
    taskSheet.appendRow(['task_1', 'Setup Google Apps Script REST API', 'Implement doGet and doPost handlers', 'done', 'high', today, '09:00', 60, 'user_1', 'space_1', new Date().toISOString(), new Date().toISOString()]);
    taskSheet.appendRow(['task_2', 'Integrasi Next.js PWA & UI ClickUp', 'Buat layout sidebar, kanban, dan kalender', 'in_progress', 'urgent', today, '13:00', 120, 'user_1', 'space_1', new Date().toISOString(), new Date().toISOString()]);
    taskSheet.appendRow(['task_3', 'Review SOC Assessment Report', 'Pemeriksaan temuan keamanan DNS block list', 'todo', 'high', today, '', 45, 'user_3', 'space_2', new Date().toISOString(), new Date().toISOString()]);
    taskSheet.appendRow(['task_4', 'SOP Mac Mini Lab Update', 'Finalisasi panduan lab student ITSEC', 'todo', 'medium', today, '', 90, 'user_2', 'space_3', new Date().toISOString(), new Date().toISOString()]);
  }

  return { message: 'Demo data seeded successfully' };
}
