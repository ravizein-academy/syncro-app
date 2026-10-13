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
        result = { users: getUsersRecords() };
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
        result = { dmThreads: getJsonFieldRecords(SHEET_NAMES.DMS, ['messages', 'participantEmails']) };
        break;

      case 'getEvents':
      case 'getCalendarEvents':
        result = { events: getGoogleCalendarEvents(e) };
        break;

      case 'getAllData':
        const filterEmail = (e && e.parameter && e.parameter.userEmail) || '';
        result = {
          tasks: getTasksRecords(filterEmail),
          users: getUsersRecords(),
          teams: getRecords(SHEET_NAMES.TEAMS),
          spaces: getRecords(SHEET_NAMES.SPACES),
          channels: getJsonFieldRecords(SHEET_NAMES.CHANNELS, ['messages']),
          dmThreads: getJsonFieldRecords(SHEET_NAMES.DMS, ['messages', 'participantEmails']),
          events: getRecords(SHEET_NAMES.EVENTS)
        };
        break;

      case 'initDatabase':
        result = setupInitialDatabase();
        break;

      case 'upgradeUserSchema':
        result = upgradeUserSchema();
        break;

      case 'clearAllData':
        result = clearAllData();
        break;

      case 'notifyAdminAccessRequest':
        result = notifyAdminAccessRequest(e && e.parameter);
        break;

      case 'notifyLogin':
        result = sendLoginNotificationEmail(e && e.parameter);
        break;

      case 'createUser':
        result = createRecord(SHEET_NAMES.USERS, e && e.parameter);
        break;

      case 'updateUser':
        result = updateUserRecord(e && e.parameter);
        break;

      case 'deleteUser':
        result = deleteUser(e && e.parameter);
        break;

      case 'deleteDMThread':
        result = deleteDMThread((e && e.parameter && e.parameter.id) || '');
        break;

      case 'deleteDMMessage':
        result = deleteDMMessage(
          (e && e.parameter && e.parameter.threadId) || '',
          (e && e.parameter && e.parameter.messageId) || ''
        );
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

      case 'updateUser':
        result = updateUserRecord(payload);
        break;

      case 'deleteUser':
        result = deleteUser(payload);
        break;

      case 'notifyAdminAccessRequest':
        result = notifyAdminAccessRequest(payload);
        break;

      case 'syncAll':
        result = syncAllData(payload);
        break;

      case 'initDatabase':
        result = setupInitialDatabase();
        break;

      case 'notifyLogin':
        result = sendLoginNotificationEmail(payload);
        break;

      case 'createCalendarEvent':
        result = createGoogleCalendarEvent(payload);
        break;

      case 'saveDM':
        result = upsertDMThread(payload);
        break;

      case 'deleteDMThread':
        result = deleteDMThread(payload.id);
        break;

      case 'deleteDMMessage':
        result = deleteDMMessage(payload.threadId, payload.messageId);
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
 * Ensure Users Sheet has 'status' and 'requestedAt' headers
 */
function ensureUserSheetHeaders(sheet) {
  if (!sheet) return;
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  if (headers.indexOf('status') === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('status');
  }
  if (headers.indexOf('requestedAt') === -1) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue('requestedAt');
  }
}

/**
 * Upgrade Users Sheet: Add 'status' and 'requestedAt' headers and set admin to 'active'
 */
function upgradeUserSchema() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return { success: false, message: 'Users sheet not found' };

  ensureUserSheetHeaders(sheet);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, message: 'Schema ensured on empty sheet' };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const emailIdx = headers.indexOf('email');
  const statusIdx = headers.indexOf('status');

  if (statusIdx >= 0) {
    for (let i = 1; i < data.length; i++) {
      const email = emailIdx >= 0 ? String(data[i][emailIdx]).toLowerCase().trim() : '';
      const curStatus = String(data[i][statusIdx] || '').trim();
      if (email === 'ravizein@itsecacademy.com') {
        sheet.getRange(i + 1, statusIdx + 1).setValue('active');
      } else if (!curStatus) {
        sheet.getRange(i + 1, statusIdx + 1).setValue('pending');
      }
    }
  }

  return { success: true, message: 'Users table upgraded with status column and default active for admin!' };
}

/**
 * Read Users from Users sheet with guaranteed status ('active' for admin, 'pending' for waiting approval)
 */
function getUsersRecords() {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return [];

  ensureUserSheetHeaders(sheet);

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
    const email = String(record.email || '').toLowerCase().trim();
    if (email === 'ravizein@itsecacademy.com') {
      record.role = 'admin';
      record.status = 'active';
    } else if (!record.status) {
      record.status = 'pending';
    }
    records.push(record);
  }
  return records;
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
function getTasksRecords(filterEmail) {
  const records = getRecords(SHEET_NAMES.TASKS);
  const tasks = records.map(task => {
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

  if (filterEmail) {
    const cleanFilter = String(filterEmail).toLowerCase().trim();
    return tasks.filter(t => {
      const taskEmail = (t.userEmail || '').toLowerCase().trim();
      const isPersonal = t.isPersonal === true;
      if (!isPersonal) return true; // Shared workspace tasks
      return !taskEmail || taskEmail === cleanFilter;
    });
  }

  return tasks;
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
 * Insert or Update a Direct Message Thread
 */
function upsertDMThread(thread) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.DMS);
  if (!sheet) {
    setupInitialDatabase();
    sheet = ss.getSheetByName(SHEET_NAMES.DMS);
  }

  const id = thread.id;
  if (!id) return { error: 'No thread id provided' };

  const serializedThread = {
    ...thread,
    messages: JSON.stringify(thread.messages || []),
    participantEmails: JSON.stringify(thread.participantEmails || []),
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
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (serializedThread.hasOwnProperty(header)) {
        sheet.getRange(foundRow, j + 1).setValue(serializedThread[header]);
      }
    }
  } else {
    const newRow = [];
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      newRow.push(serializedThread[header] !== undefined ? serializedThread[header] : '');
    }
    sheet.appendRow(newRow);
  }

  return { success: true, thread: thread };
}

/**
 * Delete a Direct Message Thread from DirectMessages sheet
 */
function deleteDMThread(id) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.DMS);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: 'Sheet is empty' };

  const headers = data[0];
  const idIndex = headers.indexOf('id');
  if (idIndex === -1) return { success: false, message: 'id header not found' };

  const cleanId = String(id || '').trim();
  if (!cleanId) return { success: false, message: 'Invalid id' };

  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const rowId = String(data[i][idIndex] || '').trim();
    if (rowId === cleanId || (cleanId.length > 5 && rowId.indexOf(cleanId) !== -1)) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }

  return { success: true, deletedId: id, deletedCount: deletedCount };
}

/**
 * Delete a specific message inside a Direct Message Thread
 */
function deleteDMMessage(threadId, messageId) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.DMS);
  if (!sheet) return { success: false, message: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('id');
  const msgIndex = headers.indexOf('messages');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(threadId)) {
      let messages = [];
      try {
        messages = JSON.parse(data[i][msgIndex]);
      } catch (e) {
        messages = [];
      }
      messages = messages.filter(function(m) { return String(m.id) !== String(messageId); });
      sheet.getRange(i + 1, msgIndex + 1).setValue(JSON.stringify(messages));
      return { success: true, threadId: threadId, deletedMessageId: messageId };
    }
  }
  return { success: false, message: 'Thread not found' };
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

  if (sheetName === SHEET_NAMES.USERS) {
    ensureUserSheetHeaders(sheet);
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
 * Helper: Upsert User Profile Record into Users sheet
 */
function upsertUserRecord(user) {
  if (!user || !user.email) return;
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return;

  const email = String(user.email).toLowerCase().trim();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    createRecord(SHEET_NAMES.USERS, {
      id: 'u_' + Date.now(),
      name: user.name || email.split('@')[0],
      email: email,
      role: user.role || 'member',
      avatar: user.name ? user.name.slice(0, 2).toUpperCase() : 'U',
      department: user.department || 'Product & Tech',
      capacityHours: user.capacityHours || 40
    });
    return;
  }

  const headers = data[0];
  const emailIdx = headers.indexOf('email');
  if (emailIdx === -1) return;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][emailIdx]).toLowerCase().trim() === email) {
      return; // Already registered
    }
  }

  createRecord(SHEET_NAMES.USERS, {
    id: 'u_' + Date.now(),
    name: user.name || email.split('@')[0],
    email: email,
    role: user.role || 'member',
    avatar: user.name ? user.name.slice(0, 2).toUpperCase() : 'U',
    department: user.department || 'Product & Tech',
    capacityHours: user.capacityHours || 40
  });
}

/**
 * Bulk Sync All Data from frontend tagged by user's Gmail
 */
function syncAllData(state) {
  const userEmail = (state.userEmail || '').toLowerCase().trim();

  // KEAMANAN: Jangan pernah meng-auto-register user dari sync!
  // Pendaftaran akun baru HANYA boleh lewat flow permintaan akses resmi (request-access)
  // dan harus disetujui secara sadar oleh Admin (status: 'active').
  if (userEmail && userEmail !== 'ravizein@itsecacademy.com') {
    const ss = getSpreadsheet();
    const uSheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (uSheet) {
      const uData = uSheet.getDataRange().getValues();
      const uHeaders = uData[0];
      const emailIdx = uHeaders.indexOf('email');
      const statusIdx = uHeaders.indexOf('status');
      let isAllowed = false;
      if (emailIdx !== -1) {
        for (let i = 1; i < uData.length; i++) {
          if (String(uData[i][emailIdx]).toLowerCase().trim() === userEmail) {
            const st = statusIdx !== -1 ? String(uData[i][statusIdx]).toLowerCase().trim() : '';
            if (st === 'active') {
              isAllowed = true;
            }
            break;
          }
        }
      }
      if (!isAllowed) {
        return {
          status: 'error',
          unauthorized: true,
          message: 'Akun ' + userEmail + ' tidak diizinkan sinkronisasi data karena belum disetujui Admin.'
        };
      }
    }
  }

  if (state.tasks && Array.isArray(state.tasks)) {
    state.tasks.forEach(task => {
      if (!task.userEmail && userEmail) {
        task.userEmail = userEmail;
      }
      upsertTask(task);
    });
  }

  if (state.dmThreads && Array.isArray(state.dmThreads)) {
    const activeEmails = {};
    const ss = getSpreadsheet();
    const uSheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (uSheet) {
      const uData = uSheet.getDataRange().getValues();
      if (uData.length > 1) {
        const emailIdx = uData[0].indexOf('email');
        for (let i = 1; i < uData.length; i++) {
          if (emailIdx >= 0) {
            const em = String(uData[i][emailIdx]).toLowerCase().trim();
            if (em) activeEmails[em] = true;
          }
        }
      }
    }

    state.dmThreads.forEach(thread => {
      let partnerEmail = (thread.participantEmail || '').toLowerCase().trim();
      if (!partnerEmail && thread.participantEmails && Array.isArray(thread.participantEmails)) {
        for (let k = 0; k < thread.participantEmails.length; k++) {
          const em = String(thread.participantEmails[k]).toLowerCase().trim();
          if (em !== userEmail) {
            partnerEmail = em;
            break;
          }
        }
      }

      // Jangan simpan thread jika partnernya sudah dihapus dari sheet Users
      if (partnerEmail && partnerEmail !== 'ravizein@itsecacademy.com' && !activeEmails[partnerEmail]) {
        return;
      }

      upsertDMThread(thread);
    });
  }

  return {
    syncedAt: new Date().toISOString(),
    userEmail: userEmail,
    taskCount: state.tasks ? state.tasks.length : 0,
    dmCount: state.dmThreads ? state.dmThreads.length : 0
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
      'id', 'title', 'description', 'status', 'priority', 'assigneeId', 'userEmail', 'spaceId',
      'dueDate', 'timeEstimate', 'timeTracked', 'scheduledSlot', 'isPersonal',
      'subtasks', 'attachments', 'comments', 'tags', 'createdAt', 'updatedAt'
    ],
    [SHEET_NAMES.USERS]: [
      'id', 'name', 'email', 'role', 'avatar', 'department', 'capacityHours', 'status', 'requestedAt'
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
      'id', 'participantId', 'participantName', 'participantEmail', 'participantEmails', 'messages', 'updatedAt'
    ],
    [SHEET_NAMES.EVENTS]: [
      'id', 'title', 'start', 'end', 'dateStr', 'startHour', 'endHour', 'timeRange', 'meetLink', 'userEmail', 'taskId', 'location', 'description', 'guests'
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

  return {
    status: 'success',
    message: 'Database schema and initial sheets successfully created (clean without dummy data)!'
  };
}

/**
 * Clear All Dummy Data from all sheets (keeps header row)
 */
function clearAllData() {
  const ss = getSpreadsheet();
  Object.values(SHEET_NAMES).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet && sheet.getLastRow() > 1) {
      sheet.deleteRows(2, sheet.getLastRow() - 1);
    }
  });
  return {
    status: 'success',
    message: 'Semua data dummy telah dihapus. Database bersih untuk pengujian baru!'
  };
}

/**
 * Mengirim email notifikasi login keamanan ke email pengguna via Google MailApp
 */
function sendLoginNotificationEmail(payload) {
  if (!payload || !payload.email) {
    return { success: false, message: 'Alamat email wajib diisi' };
  }

  var targetEmail = String(payload.email).trim();
  var userName = payload.name || targetEmail.split('@')[0];
  var timeStr = payload.time || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'dd MMMM yyyy, HH:mm:ss') + ' WIB';
  var userAgent = payload.device || 'Perangkat Web Browser';

  var subject = '🔒 Notifikasi Keamanan: Akun Anda Berhasil Masuk ke Syncro';
  var htmlBody = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">'
    + '<div style="text-align: center; margin-bottom: 24px;">'
    + '<div style="display: inline-block; background: #EE3726; color: #ffffff; font-weight: 900; font-size: 22px; width: 48px; height: 48px; line-height: 48px; border-radius: 14px; text-align: center; box-shadow: 0 4px 12px rgba(238,55,38,0.3);">S</div>'
    + '<h2 style="color: #0f172a; margin: 14px 0 4px; font-size: 20px; font-weight: 800;">Aktivitas Masuk Berhasil</h2>'
    + '<p style="color: #64748b; margin: 0; font-size: 13px;">Syncro Workspace Security Notification</p>'
    + '</div>'
    + '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">'
    + '<p style="margin: 0 0 8px; color: #334155; font-size: 14px;">Halo <strong>' + userName + '</strong>,</p>'
    + '<p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">'
    + 'Kami mendeteksi aktivitas login baru ke workspace <strong>Syncro</strong> menggunakan akun email <strong>' + targetEmail + '</strong>.'
    + '</p>'
    + '</div>'
    + '<table style="width: 100%; font-size: 13px; color: #334155; margin-bottom: 20px; border-collapse: collapse;">'
    + '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b; width: 130px;">Waktu Masuk:</td><td style="padding: 10px 0; font-weight: 600;">' + timeStr + '</td></tr>'
    + '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b;">Metode Auth:</td><td style="padding: 10px 0; font-weight: 600;">Google SSO (OAuth 2.0)</td></tr>'
    + '<tr style="border-bottom: 1px solid #f1f5f9;"><td style="padding: 10px 0; color: #64748b;">Status Sesi:</td><td style="padding: 10px 0; font-weight: 600; color: #16a34a;">Aktif & Terverifikasi ✓</td></tr>'
    + '<tr><td style="padding: 10px 0; color: #64748b;">Klien / Browser:</td><td style="padding: 10px 0; font-weight: 600;">' + userAgent + '</td></tr>'
    + '</table>'
    + '<div style="border-top: 1px solid #e2e8f0; padding-top: 18px; text-align: center;">'
    + '<p style="color: #64748b; font-size: 12px; margin: 0 0 6px;">Jika ini adalah Anda, tidak ada tindakan lebih lanjut yang diperlukan.</p>'
    + '<p style="color: #94a3b8; font-size: 11px; margin: 0;">Syncro PWA • Workspace Platform • Google Ecosystem</p>'
    + '</div>'
    + '</div>';

  try {
    MailApp.sendEmail({
      to: targetEmail,
      subject: subject,
      htmlBody: htmlBody
    });
    return { success: true, email: targetEmail, message: 'Email sent successfully' };
  } catch (err) {
    return { success: false, error: err.toString() };
  }
}

/**
 * Dispatch Access Request Email to Admin (Ravi Zein)
 */
function notifyAdminAccessRequest(payload) {
  var adminEmail = 'ravizein@itsecacademy.com';
  var userEmail = (payload && payload.email) || '';
  var userName = (payload && payload.name) || userEmail.split('@')[0];
  var timeStr = (payload && payload.time) || new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB';

  var inboxUrl = 'https://syncro-app-sable.vercel.app/inbox';
  var subject = '🔔 [Syncro] Permintaan Izin Masuk: ' + userName + ' (' + userEmail + ')';
  
  var plainBody = 'Halo Admin Ravi Zein,\n\n'
    + 'Ada pengguna baru yang ingin masuk ke workspace Syncro:\n\n'
    + '• Nama: ' + userName + '\n'
    + '• Email: ' + userEmail + '\n'
    + '• Waktu: ' + timeStr + '\n'
    + '• Status: Menunggu Persetujuan Admin\n\n'
    + 'Untuk memeriksa, mengatur peran/divisi, dan menyetujui pengguna ini, silakan buka halaman Inbox aplikasi Syncro melalui tautan berikut:\n'
    + inboxUrl + '\n\n'
    + 'Syncro Workspace Access Control';

  var htmlBody = '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; padding: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.04);">'
    + '<div style="margin-bottom: 20px;">'
    + '<div style="display: inline-block; background: #EE3726; color: #ffffff; font-weight: 800; font-size: 18px; width: 38px; height: 38px; line-height: 38px; border-radius: 10px; text-align: center;">S</div>'
    + '<h2 style="color: #0f172a; margin: 12px 0 4px; font-size: 18px; font-weight: 700;">Permintaan Izin Masuk Baru</h2>'
    + '<p style="color: #64748b; margin: 0; font-size: 13px;">Syncro Workspace Access Control</p>'
    + '</div>'
    + '<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">'
    + '<p style="margin: 0 0 6px; color: #0f172a; font-size: 13px; font-weight: 600;">Data Pengguna Pemohon:</p>'
    + '<div style="font-size: 13px; color: #334155; line-height: 1.8;">'
    + '• <strong>Nama:</strong> ' + userName + '<br>'
    + '• <strong>Email:</strong> <span style="color: #EE3726; font-weight: 600;">' + userEmail + '</span><br>'
    + '• <strong>Waktu Pengajuan:</strong> ' + timeStr + '<br>'
    + '• <strong>Status:</strong> Menunggu Persetujuan Admin'
    + '</div>'
    + '</div>'
    + '<p style="font-size: 13px; color: #475569; margin-bottom: 16px; line-height: 1.6;">'
    + 'Untuk memeriksa dan memproses izin masuk akun ini, silakan buka menu Inbox di aplikasi Syncro:'
    + '</p>'
    + '<p style="font-size: 14px; margin-bottom: 24px;">'
    + '👉 <a href="' + inboxUrl + '" style="color: #EE3726; font-weight: 600; text-decoration: underline;">' + inboxUrl + '</a>'
    + '</p>'
    + '<div style="border-top: 1px solid #e2e8f0; padding-top: 14px;">'
    + '<p style="color: #94a3b8; font-size: 11px; margin: 0;">Syncro PWA • Workspace Access Control</p>'
    + '</div>'
    + '</div>';

  try {
    if (typeof GmailApp !== 'undefined') {
      GmailApp.sendEmail(adminEmail, subject, plainBody, {
        htmlBody: htmlBody,
        name: 'Syncro Workspace Security'
      });
    } else {
      MailApp.sendEmail({
        to: adminEmail,
        subject: subject,
        body: plainBody,
        htmlBody: htmlBody,
        name: 'Syncro Workspace Security'
      });
    }
    return { success: true, adminEmail: adminEmail };
  } catch (err) {
    try {
      MailApp.sendEmail({
        to: adminEmail,
        subject: subject,
        body: plainBody,
        htmlBody: htmlBody,
        name: 'Syncro Workspace Security'
      });
      return { success: true, adminEmail: adminEmail };
    } catch (e2) {
      return { success: false, error: err.toString() };
    }
  }
}

/**
 * Update User Record in Users sheet
 */
function updateUserRecord(user) {
  if (!user || (!user.id && !user.email)) return { success: false, message: 'Invalid payload' };
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return { success: false, message: 'Users sheet not found' };

  ensureUserSheetHeaders(sheet);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let idIdx = headers.indexOf('id');
  if (idIdx === -1) idIdx = headers.indexOf('sta');
  const emailIdx = headers.indexOf('email');

  const targetEmail = String(user.email || '').toLowerCase().trim();
  const targetId = String(user.id || '').trim();

  // PROTEKSI MASTER ADMIN
  if (targetEmail === 'ravizein@itsecacademy.com') {
    user.role = 'admin';
    user.status = 'active';
  }

  for (let i = 1; i < data.length; i++) {
    const rowId = idIdx >= 0 ? String(data[i][idIdx]).trim() : '';
    const rowEmail = emailIdx >= 0 ? String(data[i][emailIdx]).toLowerCase().trim() : '';

    // Prioritas pencocokan berdasarkan email unik, atau ID jika tidak kosong
    const isMatch = (targetEmail && rowEmail === targetEmail) ||
                    (targetId && targetId !== '' && rowId === targetId);

    if (isMatch) {
      if (rowEmail === 'ravizein@itsecacademy.com') {
        user.role = 'admin';
        user.status = 'active';
      }

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        if (user[header] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(user[header]);
        }
      }
      return { success: true, updated: user };
    }
  }
  return { success: false, message: 'User not found' };
}

/**
 * Clean up all direct message threads associated with a deleted user
 */
function cleanUpUserDMs(email, id) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.DMS);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return;

    const headers = data[0];
    const idIdx = headers.indexOf('id');
    const pIdIdx = headers.indexOf('participantId');
    const pEmailIdx = headers.indexOf('participantEmail');
    const pEmailsIdx = headers.indexOf('participantEmails');
    const msgIdx = headers.indexOf('messages');

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanId = id ? String(id).trim() : '';
    const cleanEmailSlug = cleanEmail ? cleanEmail.replace(/[^a-zA-Z0-9]/g, '_') : '';

    // Loop mundur agar penghapusan baris tidak mengacaukan index baris berikutnya
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const rowThreadId = idIdx >= 0 ? String(row[idIdx]) : '';
      const rowPId = pIdIdx >= 0 ? String(row[pIdIdx]) : '';
      const rowPEmail = pEmailIdx >= 0 ? String(row[pEmailIdx]).toLowerCase().trim() : '';
      const rowPEmailsRaw = pEmailsIdx >= 0 ? String(row[pEmailsIdx]) : '';
      const rowMessagesRaw = msgIdx >= 0 ? String(row[msgIdx]) : '';

      let match = false;
      if (cleanEmail) {
        if (rowPEmail === cleanEmail) match = true;
        if (rowPEmailsRaw.toLowerCase().indexOf(cleanEmail) !== -1) match = true;
        if (cleanEmailSlug && rowThreadId.indexOf(cleanEmailSlug) !== -1) match = true;
        if (rowMessagesRaw.toLowerCase().indexOf(cleanEmail) !== -1) match = true;
      }
      if (cleanId) {
        if (rowPId === cleanId) match = true;
        if (rowThreadId.indexOf(cleanId) !== -1) match = true;
        if (rowMessagesRaw.indexOf(cleanId) !== -1) match = true;
      }

      if (match) {
        sheet.deleteRow(i + 1);
      }
    }
  } catch (err) {
    console.error('Error cleaning up DMs for user: ' + err);
  }
}

/**
 * Delete User Record in Users sheet & cascade delete all associated DMs
 */
function deleteUser(payload) {
  if (!payload) return { success: false, message: 'Invalid payload' };
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return { success: false, message: 'Users sheet not found' };

  const id = typeof payload === 'object' ? (payload.id || '') : String(payload);
  const email = typeof payload === 'object' ? (payload.email || '') : '';

  // Bersihkan juga seluruh riwayat percakapan DM user ini
  cleanUpUserDMs(email, id);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: 'No users found' };

  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const emailIdx = headers.indexOf('email');

  for (let i = 1; i < data.length; i++) {
    const rowId = idIdx >= 0 ? String(data[i][idIdx]) : '';
    const rowEmail = emailIdx >= 0 ? String(data[i][emailIdx]).toLowerCase().trim() : '';
    if ((id && rowId === String(id)) || (email && rowEmail === String(email).toLowerCase().trim())) {
      sheet.deleteRow(i + 1);
      return { success: true, deleted: id || email };
    }
  }
  return { success: false, message: 'User not found in sheet' };
}

/**
 * =========================================================================
 * GOOGLE CALENDAR API INTEGRATION (2-Way Synchronization)
 * =========================================================================
 */

/**
 * Fetch events from Google Calendar (CalendarApp) with real Google Meet link & invitations
 * Fully synchronized across Workspace (itsecacademy.com) and Gmail (personal/shared) accounts
 */
function getGoogleCalendarEvents(e) {
  try {
    const filterEmail = (e && e.parameter && e.parameter.userEmail) || '';
    const cleanEmail = filterEmail.toLowerCase().trim();
    const isRavi = cleanEmail === 'ravizein@itsecacademy.com' || cleanEmail === 'ravizein@gmail.com';

    const calendarsToQuery = [];

    // 1. Kalender default workspace
    try {
      const defCal = CalendarApp.getDefaultCalendar();
      if (defCal) calendarsToQuery.push(defCal);
    } catch (e1) {}

    // 2. Kalender spesifik pengguna (jika di-share atau accessible)
    if (cleanEmail) {
      try {
        const userCal = CalendarApp.getCalendarById(cleanEmail);
        if (userCal && calendarsToQuery.indexOf(userCal) === -1) {
          calendarsToQuery.push(userCal);
        }
      } catch (e2) {}
    }

    // 3. Jika akun Ravi Zein, cek kedua kalender (academy & gmail)
    if (isRavi) {
      try {
        const altCal = CalendarApp.getCalendarById(
          cleanEmail === 'ravizein@gmail.com' ? 'ravizein@itsecacademy.com' : 'ravizein@gmail.com'
        );
        if (altCal && calendarsToQuery.indexOf(altCal) === -1) {
          calendarsToQuery.push(altCal);
        }
      } catch (e3) {}
    }

    // 4. Cek semua shared calendars yang ada di akun
    try {
      const allCals = CalendarApp.getAllCalendars();
      if (allCals && allCals.length > 0) {
        for (var c = 0; c < allCals.length; c++) {
          var calName = (allCals[c].getName() || '').toLowerCase();
          var calId = (allCals[c].getId() || '').toLowerCase();
          if (cleanEmail && (calName.indexOf(cleanEmail) !== -1 || calId.indexOf(cleanEmail) !== -1)) {
            if (calendarsToQuery.indexOf(allCals[c]) === -1) {
              calendarsToQuery.push(allCals[c]);
            }
          }
        }
      }
    } catch (calsErr) {}

    const now = new Date();
    const startTime = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const endTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const pad = function(n) { return String(n).padStart(2, '0'); };

    var oauthToken = '';
    try {
      oauthToken = ScriptApp.getOAuthToken();
    } catch (tokErr) {}

    const resultMap = {};

    calendarsToQuery.forEach(function(cal) {
      try {
        const events = cal.getEvents(startTime, endTime);
        events.forEach(function(ev) {
          const eventId = 'gcal_' + ev.getId();
          if (resultMap[eventId]) return;

          const start = ev.getStartTime();
          const end = ev.getEndTime();
          const dateStr = start.getFullYear() + '-' + pad(start.getMonth() + 1) + '-' + pad(start.getDate());
          const startHour = pad(start.getHours()) + ':' + pad(start.getMinutes());
          const endHour = pad(end.getHours()) + ':' + pad(end.getMinutes());
          const desc = ev.getDescription() || '';
          const loc = ev.getLocation() || '';

          // 1. Ekstrak Tamu / Undangan (Guest list)
          var guestEmails = [];
          try {
            var guestList = ev.getGuestList();
            if (guestList && guestList.length > 0) {
              for (var g = 0; g < guestList.length; g++) {
                var gEmail = guestList[g].getEmail();
                if (gEmail) guestEmails.push(gEmail.toLowerCase().trim());
              }
            }
          } catch (gErr) {}

          // 2. Ekstrak Google Meet Link yang Asli
          var meetUrl = '';
          var meetMatch = (desc + ' ' + loc).match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
          if (meetMatch) {
            meetUrl = meetMatch[0];
          }

          if (!meetUrl && typeof Calendar !== 'undefined' && Calendar.Events) {
            try {
              var rawId = ev.getId().split('@')[0];
              var advEv = Calendar.Events.get('primary', rawId);
              if (advEv) {
                if (advEv.hangoutLink) {
                  meetUrl = advEv.hangoutLink;
                } else if (advEv.conferenceData && advEv.conferenceData.entryPoints) {
                  for (var epIdx = 0; epIdx < advEv.conferenceData.entryPoints.length; epIdx++) {
                    var ep = advEv.conferenceData.entryPoints[epIdx];
                    if (ep.entryPointType === 'video' && ep.uri) {
                      meetUrl = ep.uri;
                      break;
                    }
                  }
                }
              }
            } catch (advErr) {}
          }

          if (!meetUrl && oauthToken) {
            try {
              var rawId2 = ev.getId().split('@')[0];
              var apiUrl = 'https://www.googleapis.com/calendar/v3/calendars/primary/events/' + encodeURIComponent(rawId2);
              var apiRes = UrlFetchApp.fetch(apiUrl, {
                headers: { Authorization: 'Bearer ' + oauthToken },
                muteHttpExceptions: true
              });
              if (apiRes.getResponseCode() === 200) {
                var advJson = JSON.parse(apiRes.getContentText());
                if (advJson.hangoutLink) {
                  meetUrl = advJson.hangoutLink;
                } else if (advJson.conferenceData && advJson.conferenceData.entryPoints) {
                  for (var ep2 = 0; ep2 < advJson.conferenceData.entryPoints.length; ep2++) {
                    var entryPoint = advJson.conferenceData.entryPoints[ep2];
                    if (entryPoint.entryPointType === 'video' && entryPoint.uri) {
                      meetUrl = entryPoint.uri;
                      break;
                    }
                  }
                }
              }
            } catch (fetchErr) {}
          }

          // 3. Status kehadiran
          var myStatus = '';
          try {
            if (ev.getMyStatus) myStatus = String(ev.getMyStatus());
          } catch (sErr) {}

          resultMap[eventId] = {
            id: eventId,
            title: ev.getTitle() || 'Acara Google Calendar',
            dateStr: dateStr,
            startHour: startHour,
            endHour: endHour,
            timeRange: startHour + ' - ' + endHour,
            description: desc,
            location: loc,
            guests: guestEmails.join(', '),
            myStatus: myStatus,
            isInvitation: guestEmails.length > 0 || myStatus === 'INVITED' || myStatus === 'YES' || myStatus === 'MAYBE',
            meetUrl: meetUrl || '',
            isGoogleEvent: true,
            userEmail: cleanEmail || 'ravizein@itsecacademy.com'
          };
        });
      } catch (calErr) {}
    });

    // 5. Selalu sertakan juga agenda dari Sheet Events
    try {
      const savedRecords = getRecords(SHEET_NAMES.EVENTS);
      savedRecords.forEach(function(ev) {
        const id = ev.id || ('ev_' + Date.now());
        if (resultMap[id]) return;

        const evUserEmail = (ev.userEmail || '').toLowerCase().trim();
        if (cleanEmail && !isRavi && evUserEmail && evUserEmail !== cleanEmail) {
          return;
        }

        resultMap[id] = {
          id: id,
          title: ev.title || 'Agenda',
          dateStr: ev.dateStr || (ev.start ? String(ev.start).split('T')[0] : ''),
          startHour: ev.startHour || '09:00',
          endHour: ev.endHour || '10:00',
          timeRange: ev.timeRange || '09:00 - 10:00',
          description: ev.description || '',
          location: ev.location || '',
          guests: ev.guests || '',
          meetUrl: ev.meetLink || '',
          isGoogleEvent: false,
          userEmail: evUserEmail || cleanEmail || 'ravizein@itsecacademy.com'
        };
      });
    } catch (sheetErr) {}

    return Object.keys(resultMap).map(function(k) { return resultMap[k]; });
  } catch (error) {
    console.error('getGoogleCalendarEvents error:', error);
    return [];
  }
}

/**
 * Create a new event in Google Calendar (CalendarApp) or Events sheet
 */
function createGoogleCalendarEvent(payload) {
  try {
    const userEmail = (payload.userEmail || '').toLowerCase().trim();
    let cal = null;

    if (userEmail) {
      try {
        cal = CalendarApp.getCalendarById(userEmail);
      } catch (e) {}
    }

    if (!cal && (!userEmail || userEmail === 'ravizein@itsecacademy.com')) {
      cal = CalendarApp.getDefaultCalendar();
    }

    const title = payload.title || 'Syncro Event';
    const dateStr = payload.dateStr || new Date().toISOString().split('T')[0];
    const startHour = payload.startHour || '09:00';
    const endHour = payload.endHour || '10:00';

    const sParts = startHour.split(':');
    const eParts = endHour.split(':');
    const dParts = dateStr.split('-');

    const sH = Number(sParts[0]) || 9;
    const sM = Number(sParts[1]) || 0;
    const eH = Number(eParts[0]) || 10;
    const eM = Number(eParts[1]) || 0;

    const year = Number(dParts[0]);
    const month = Number(dParts[1]);
    const day = Number(dParts[2]);

    const startDate = new Date(year, month - 1, day, sH, sM);
    const endDate = new Date(year, month - 1, day, eH, eM);

    let eventId = 'ev_' + Date.now();
    let isGoogleEvent = false;

    if (cal) {
      const options = {
        description: payload.description || 'Dibuat otomatis dari aplikasi Syncro'
      };
      if (payload.location) options.location = payload.location;
      if (payload.guests) options.guests = payload.guests;
      const event = cal.createEvent(title, startDate, endDate, options);
      eventId = 'gcal_' + event.getId();
      isGoogleEvent = true;
    }

    // Selalu simpan juga ke sheet Events agar data tersimpan aman di cloud
    createRecord(SHEET_NAMES.EVENTS, {
      id: eventId,
      title: title,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      dateStr: dateStr,
      startHour: startHour,
      endHour: endHour,
      timeRange: startHour + ' - ' + endHour,
      meetLink: payload.meetUrl || 'https://meet.google.com/new',
      userEmail: userEmail,
      taskId: payload.taskId || '',
      location: payload.location || '',
      description: payload.description || '',
      guests: payload.guests || ''
    });

    return {
      success: true,
      id: eventId,
      title: title,
      dateStr: dateStr,
      startHour: startHour,
      endHour: endHour,
      timeRange: startHour + ' - ' + endHour,
      isGoogleEvent: isGoogleEvent,
      userEmail: userEmail,
      color: payload.color || 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
      meetUrl: payload.meetUrl || 'https://meet.google.com/new',
      location: payload.location || '',
      description: payload.description || '',
      guests: payload.guests || ''
    };
  } catch (error) {
    console.error('createGoogleCalendarEvent error:', error);
    return { success: false, error: error.toString() };
  }
}


