/* ======================
   START CAMPAIGN (UI TRIGGER)
====================== */
app.post("/start-campaign", async (req, res) => {
  try {
    const batchId = "BATCH_" + Date.now();

    // 1️⃣ Read Google Sheet
    const sheet = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Bulk_Calls!A:D"
    });

    const rows = sheet.data.values || [];
    const phones = [];

    // Skip header
    for (let i = 1; i < rows.length; i++) {
      const phone = rows[i][0];
      const status = rows[i][2];

      if (phone && status !== "Completed") {
        phones.push(phone);

        // Update BatchId + Status
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `Bulk_Calls!B${i + 1}:C${i + 1}`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[batchId, "Queued"]]
          }
        });
      }
    }

    if (!phones.length) {
      return res.status(200).json({
        message: "No pending phone numbers"
      });
    }

    // 2️⃣ Call existing bulk-call logic
    await twilioClient.calls.create; // safety check (no-op)

    await fetch(`${BASE_URL}/bulk-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId, phones })
    });

    return res.json({
      success: true,
      batchId,
      total: phones.length
    });

  } catch (err) {
    console.error("Start campaign failed:", err);
    return res.status(500).json({ error: "Failed to start campaign" });
  }
});
