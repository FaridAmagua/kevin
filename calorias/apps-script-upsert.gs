const SPREADSHEET_ID = '1znXYf7TIj78cdJoakJ4oEJtj8g33sjSuJk797CgYK_c';
const SHEET_NAME = 'Leads';

const HEADERS = [
  'id',
  'email',
  'name',
  'age',
  'gender',
  'height',
  'weight',
  'activity',
  'maintenance',
  'loss',
  'gain',
  'source',
  'createdAt',
  'updatedAt'
];

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || '{}');
  const email = String(payload.email || payload.id || '').trim().toLowerCase();

  if (!email) {
    return jsonResponse({ ok: false, error: 'email_required' });
  }

  const sheet = getOrCreateSheet();
  ensureHeaders(sheet);

  const rowValues = [
    email,
    email,
    payload.name || '',
    payload.age || '',
    payload.gender || '',
    payload.height || '',
    payload.weight || '',
    payload.activity || '',
    payload.maintenance || '',
    payload.loss || '',
    payload.gain || '',
    payload.source || 'calories_calculator',
    payload.createdAt || new Date().toISOString(),
    new Date().toISOString()
  ];

  const row = findRowByEmail(sheet, email);

  if (row) {
    sheet.getRange(row, 1, 1, HEADERS.length).setValues([rowValues]);
    return jsonResponse({ ok: true, action: 'updated', id: email });
  }

  sheet.appendRow(rowValues);
  return jsonResponse({ ok: true, action: 'created', id: email });
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = currentHeaders.some(Boolean);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function findRowByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return null;
  }

  const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const index = emails.findIndex((row) => String(row[0]).trim().toLowerCase() === email);

  return index === -1 ? null : index + 2;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
