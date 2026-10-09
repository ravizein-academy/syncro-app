/**
 * =========================================================================
 * SYNCRO PWA - GOOGLE APPS SCRIPT REST API BACKEND
 * =========================================================================
 * Backend berbasis Google Sheets & Google Apps Script sesuai PRD Syncro:
 * - 100% Free Tier (Google Ecosystem)
 * - REST API JSON (doGet, doPost, doOptions)
 * - Otentikasi & Database multi-sheet (Tasks, Users, Teams, Spaces, Channels, DMs, Events)
 * - Auto-initialization function: setupInitialDatabase()
 * =========================================================================
 */

const SHEET_NAMES = {
  TASKS: 'Tasks',
  USERS: 'Users',
  TEAMS: 'Teams',
  SPACES: 'Spaces',
  CHANNELS: 'Channels',
  DMS: 'DirectMessages',
  EVENTS: 'PlannerEvents',
  SYSTEM: 'SystemMeta'
};

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * HTTP GET HANDLER
 * Parameter: ?action=<action_name>&...
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'health';

    let result = null;

    switch (action) {
      case 'health':
        result = {
          status: 'ok',
          service: 'Syncro Google Apps Script Backend',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        };
        break;

      case 'getTasks':
        result = { tasks: getTasksRecords() };
        break;

      case 'getUsers':
        result = { users: getRecords(SHEET_NAMES.USERS) };
        break;

      case 'getTeams':
        result = { teams: getRecords(SHEET_NAMES.TEAMS) };
        break;

      case 'getSpaces':
        result = { spaces: getRecords(SHEET_NAMES.SPACES) };
        break;

      case 'getChannels':
        result = { channels: getJsonFieldRecords(SHEET_NAMES.CHANNELS, ['messages']) };
        break;

      case 'getDMs':
        result = { dmThreads: getJsonFieldRecords(SHEET_NAMES.DMS, ['messages']) };
        break;

      case 'getEvents':
        result = { events: getRecords(SHEET_NAMES.EVENTS) };
        break;

      case 'getAllData':
        result = {
          tasks: getTasksRecords(),
          users: getRecords(SHEET_NAMES.USERS),
          teams: getRecords(SHEET_NAMES.TEAMS),
          spaces: getRecords(SHEET_NAMES.SPACES),
          channels: getJsonFieldRecords(SHEET_NAMES.CHANNELS, ['messages']),
          dmThreads: getJsonFieldRecords(SHEET_NAMES.DMS, ['messages']),
          events: getRecords(SHEET_NAMES.EVENTS)
        };
        break;

      case 'initDatabase':
        result = setupInitialDatabase();
        break;

      default:
        return jsonResponse({
          status: 'error',
          message: 'Unknown action: ' + action
        }, 400);
    }

    return jsonResponse({ status: 'success', data: result });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() }, 500);
  }
}

/**
 * HTTP POST HANDLER
 * Body JSON: { action: "createTask" | "updateTask" | "deleteTask" | "syncAll", payload: {...} }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: 'error', message: 'No payload provided' }, 400);
    }

    let body = {};
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ status: 'error', message: 'Invalid JSON payload' }, 400);
    }

    const action = body.action;
    const payload = body.payload;

    if (!action) {
      return jsonResponse({ status: 'error', message: 'Field "action" is required' }, 400);
    }

    let result = null;

    switch (action) {
      case 'createTask':
        result = upsertTask(payload);
        break;

      case 'updateTask':
        result = upsertTask(payload);
        break;

      case 'deleteTask':
        result = deleteTask(payload.id);
        break;

      case 'createUser':
        result = createRecord(SHEET_NAMES.USERS, payload);
        break;

      case 'syncAll':
        result = syncAllData(payload);
        break;

      case 'initDatabase':
        result = setupInitialDatabase();
        break;

      default:
        return jsonResponse({
          status: 'error',
          message: 'Unknown action: ' + action
        }, 400);
    }

    return jsonResponse({ status: 'success', data: result });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() }, 500);
  }
}

/**
 * CORS PREFLIGHT HANDLER
 */
function doOptions(e) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT)
    .setHeaders(headers);
}

/**
 * Helper JSON Response
 */
function jsonResponse(data, statusCode) {
  const responseOutput = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return responseOutput;
}

/**
 * Helper: Read all rows from a sheet as Array of Objects
 */
function getRecords(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const records = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j];
    }
    records.push(record);
  }
  return records;
}

/**
 * Helper: Read records and auto-parse JSON strings for specific fields
 */
function getJsonFieldRecords(sheetName, jsonFields) {
  const records = getRecords(sheetName);
  return records.map(rec => {
    jsonFields.forEach(field => {
      if (rec[field] && typeof rec[field] === 'string') {
        try {
          rec[field] = JSON.parse(rec[field]);
        } catch (e) {
          rec[field] = [];
        }
      }
    });
    return rec;
  });
}

/**
 * Read Tasks with serialized fields decoded (attachments, comments, subtasks, tags)
 */
function getTasksRecords() {
  const records = getRecords(SHEET_NAMES.TASKS);
  return records.map(task => {
    ['subtasks', 'attachments', 'comments', 'tags'].forEach(field => {
      if (task[field] && typeof task[field] === 'string') {
        try {
          task[field] = JSON.parse(task[field]);
        } catch (e) {
          task[field] = [];
        }
      } else if (!task[field]) {
        task[field] = [];
      }
    });
    // Parse booleans and numbers
    if (task.timeEstimate) task.timeEstimate = Number(task.timeEstimate);
    if (task.timeTracked) task.timeTracked = Number(task.timeTracked);
    if (task.isPersonal !== undefined) task.isPersonal = String(task.isPersonal).toLowerCase() === 'true';
    return task;
  });
}

/**
 * Insert or Update a Task
 */
function upsertTask(task) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (!sheet) {
    setupInitialDatabase();
    sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  }

  const id = task.id || ('task_' + Date.now());
  task.id = id;

  // Prepare fields
  const serializedTask = {
    ...task,
    subtasks: JSON.stringify(task.subtasks || []),
    attachments: JSON.stringify(task.attachments || []),
    comments: JSON.stringify(task.comments || []),
    tags: JSON.stringify(task.tags || []),
    updatedAt: new Date().toISOString()
  };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idIndex = headers.indexOf('id');

  const data = sheet.getDataRange().getValues();
  let foundRow = -1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      foundRow = i + 1;
      break;
    }
  }

  if (foundRow > 0) {
    // Update existing row
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (serializedTask.hasOwnProperty(header)) {
        sheet.getRange(foundRow, j + 1).setValue(serializedTask[header]);
      }
    }
  } else {
    // Append new row
    const newRow = [];
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      newRow.push(serializedTask[header] !== undefined ? serializedTask[header] : '');
    }
    sheet.appendRow(newRow);
  }

  return task;
}

/**
 * Delete a Task by ID
 */
function deleteTask(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.TASKS);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, deletedId: id };
    }
  }
  return { success: false, message: 'Task not found: ' + id };
}

/**
 * Create a Generic Record
 */
function createRecord(sheetName, recordData) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' not found');

  if (!recordData.id) {
    recordData.id = 'id_' + Math.random().toString(36).substring(2, 9);
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = [];

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    let val = recordData[header];
    if (typeof val === 'object') val = JSON.stringify(val);
    newRow.push(val !== undefined ? val : '');
  }

  sheet.appendRow(newRow);
  return recordData;
}

/**
 * Bulk Sync All Data from frontend
 */
function syncAllData(state) {
  if (state.tasks && Array.isArray(state.tasks)) {
    state.tasks.forEach(task => upsertTask(task));
  }
  return {
    syncedAt: new Date().toISOString(),
    taskCount: state.tasks ? state.tasks.length : 0
  };
}

/**
 * Database Initializer & Setup Function
 * Run this function once from Apps Script editor or call ?action=initDatabase
 */
function setupInitialDatabase() {
  const ss = getSpreadsheet();

  const schemas = {
    [SHEET_NAMES.TASKS]: [
      'id', 'title', 'description', 'status', 'priority', 'assigneeId', 'spaceId',
      'dueDate', 'timeEstimate', 'timeTracked', 'scheduledSlot', 'isPersonal',
      'subtasks', 'attachments', 'comments', 'tags', 'createdAt', 'updatedAt'
    ],
    [SHEET_NAMES.USERS]: [
      'id', 'name', 'email', 'role', 'avatar', 'department', 'capacityHours'
    ],
    [SHEET_NAMES.TEAMS]: [
      'id', 'name', 'description'
    ],
    [SHEET_NAMES.SPACES]: [
      'id', 'name', 'color', 'description'
    ],
    [SHEET_NAMES.CHANNELS]: [
      'id', 'name', 'description', 'department', 'messages'
    ],
    [SHEET_NAMES.DMS]: [
      'id', 'participantId', 'participantName', 'messages'
    ],
    [SHEET_NAMES.EVENTS]: [
      'id', 'title', 'start', 'end', 'meetLink', 'taskId'
    ]
  };

  // Create or configure each sheet
  Object.keys(schemas).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    const headers = schemas[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#EE3726').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  });

  // Seed default Users if empty
  const userSheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (userSheet.getLastRow() <= 1) {
    userSheet.appendRow(['user_1', 'Ravi Zein', 'ravizein@itsecacademy.com', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', 'Product & Tech', 40]);
    userSheet.appendRow(['user_2', 'Sarah Connor', 'sarah@itsecacademy.com', 'member', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', 'Engineering', 38]);
    userSheet.appendRow(['user_3', 'Alex Rivera', 'alex@itsecacademy.com', 'member', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', 'Cyber Security', 35]);
    userSheet.appendRow(['user_4', 'Devin Vance', 'devin@itsecacademy.com', 'guest', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', 'Marketing', 20]);
  }

  // Seed default Spaces if empty
  const spaceSheet = ss.getSheetByName(SHEET_NAMES.SPACES);
  if (spaceSheet.getLastRow() <= 1) {
    spaceSheet.appendRow(['sp_1', 'Product Development', '#EE3726', 'Ruang kerja tim produk']);
    spaceSheet.appendRow(['sp_2', 'Operations & IT', '#2563eb', 'Infrastruktur dan operasional']);
    spaceSheet.appendRow(['sp_3', 'Marketing & Sales', '#10b981', 'Kampanye pemasaran']);
  }

  return {
    status: 'success',
    message: 'Database schema and initial sheets successfully created!'
  };
}
