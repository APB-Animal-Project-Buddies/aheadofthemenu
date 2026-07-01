// SETUP INSTRUCTIONS:
// 1. Open your Google Sheet → Extensions → Apps Script
// 2. Paste this entire script, replacing any existing code
// 3. Replace YOUR_API_KEY_HERE with the actual API key
// 4. To set up automatic 30-minute sync:
//    a. In Apps Script, click the clock icon (Triggers) in the left sidebar
//    b. Click "+ Add Trigger"
//    c. Choose function: syncToWebsite
//    d. Event source: Time-driven
//    e. Type: Minutes timer → Every 30 minutes
//    f. Click Save (you'll need to authorize the script)
// 5. Reload the Google Sheet — you should see an "APB Tools" menu

// Configuration — set your API key and website URL
const API_URL = "https://animalprojectbuddies.com/api/ideas";
const API_KEY = "YOUR_API_KEY_HERE"; // Replace with actual key

/**
 * Adds a custom menu to the Google Sheet.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("APB Tools")
    .addItem("Sync to Website", "syncToWebsite")
    .addToUi();
}

/**
 * Reads all rows from the active sheet and POSTs them to the website API.
 * Rows without an "Idea" value in column A are skipped.
 */
function syncToWebsite() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Skip header row (row 0), filter out empty ideas
  const ideas = [];
  for (let i = 1; i < data.length; i++) {
    const idea = (data[i][0] || "").toString().trim();
    if (!idea) continue;

    ideas.push({
      idea: idea,
      sub_ideas: (data[i][1] || "").toString().trim() || null,
      other_notes: (data[i][2] || "").toString().trim() || null,
      contact_email: (data[i][3] || "").toString().trim() || null,
      sort_order: ideas.length,
    });
  }

  if (ideas.length === 0) {
    SpreadsheetApp.getUi().alert("No valid ideas found in the sheet.");
    return;
  }

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": API_KEY },
    payload: JSON.stringify(ideas),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(API_URL, options);
  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code === 200) {
    const result = JSON.parse(body);
    SpreadsheetApp.getUi().alert("Synced " + result.synced + " ideas to the website!");
  } else {
    SpreadsheetApp.getUi().alert("Sync failed (" + code + "): " + body);
  }
}
