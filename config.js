// Google Sheets configuration
// The site reads the three tabs through Google Visualization CSV endpoints.
// If the sheet is not publicly readable, the site automatically falls back to
// the bundled sample/current data in app.js.
const SHEET_CONFIG = {
  spreadsheetId: '1OAe7IKwAEZU5GxXs90i61tAR1O6KG1ZIk7dukpTFqgw',
  sheets: {
    research: 'รวบรวมวิจัย',
    verification: 'ตรวจสอบความน่าเชื่อถือ',
    proposed: 'เสนอ'
  }
};
