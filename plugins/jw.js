const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');
const apiDylux = require('api-dylux');

cmd({
  pattern: "g",
  desc: "Download Google Drive files using api-dylux",
  react: "🌐",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.startsWith("http")) {
      return reply("❌ Please provide a valid Google Drive link.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    // call api-dylux gdrive function
    const result = await apiDylux.gdrive(q);

    if (!result || !result.url) {
      return reply("⚠️ Failed to fetch Google Drive file.");
    }

    const safeFileName = (result.filename || "gdrive_file").replace(/[\\/:*?"<>|]/g, "_");

    await conn.sendMessage(from, {
      document: { url: result.url },
      mimetype: result.mimeType || "application/octet-stream",
      fileName: safeFileName,
      caption: `🌐 Google Drive Downloader\n\n${config.FOOTER}`
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("GDrive Error:", error);
    reply("❌ An error occurred while downloading Google Drive file.");
  }
});
