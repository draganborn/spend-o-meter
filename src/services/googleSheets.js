const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;
const BASE_URL = SHEET_ID
  ? `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`
  : null;

if (!SHEET_ID) {
  console.warn(
    'VITE_GOOGLE_SHEET_ID is not defined. Google Sheets sync will remain disabled until it is provided.',
  );
}

const ensureConfig = () => {
  if (!BASE_URL) {
    throw new Error('Google Sheet ID is not configured.');
  }
};

const withAuth = (accessToken, init = {}) => ({
  ...init,
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  },
});

const handleResponse = async response => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Google Sheets request failed');
  }
  return response.status === 204 ? null : response.json();
};

const encodeRange = range => encodeURIComponent(range);

export const sheetsApi = {
  async read(range, accessToken) {
    ensureConfig();
    const response = await fetch(
      `${BASE_URL}/values/${encodeRange(range)}?majorDimension=ROWS`,
      withAuth(accessToken),
    );
    return handleResponse(response);
  },
  async clear(range, accessToken) {
    ensureConfig();
    const response = await fetch(
      `${BASE_URL}/values/${encodeRange(range)}:clear`,
      withAuth(accessToken, { method: 'POST', body: JSON.stringify({}) }),
    );
    return handleResponse(response);
  },
  async write(range, values, accessToken) {
    ensureConfig();
    const response = await fetch(
      `${BASE_URL}/values/${encodeRange(range)}?valueInputOption=RAW`,
      withAuth(accessToken, {
        method: 'PUT',
        body: JSON.stringify({ values, majorDimension: 'ROWS' }),
      }),
    );
    return handleResponse(response);
  },
  async append(range, values, accessToken) {
    ensureConfig();
    const response = await fetch(
      `${BASE_URL}/values/${encodeRange(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      withAuth(accessToken, {
        method: 'POST',
        body: JSON.stringify({ values, majorDimension: 'ROWS' }),
      }),
    );
    return handleResponse(response);
  },
};

export const rowsToObjects = (values = [], expectedHeaders = []) => {
  if (!values.length) return [];
  const [headerRow, ...rows] = values;
  const headers = headerRow?.length ? headerRow : expectedHeaders;
  if (!headers.length) return [];
  return rows.map(row => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = row[index] ?? '';
    });
    return entry;
  });
};

export const objectsToRows = (items, headers) =>
  items.map(item => headers.map(header => (item[header] ?? '').toString()));
