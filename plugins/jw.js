const { cmd } = require('../command');
const axios = require('axios');
const config = require('../config');

cmd({
  pattern: "gd",
  alias: ["gdr", "drive"],
  desc: "Download Google Drive files using bk9.fun API",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.includes("drive.google.com")) {
      return reply("🔗 කරුණාකර සත්‍ය Google Drive link එකක් ලබා දෙන්න.");
    }

    await conn.sendMessage(from, {
      react: { text: "🔍", key: m.key }
    });

    const apiUrl = `https://bk9.fun/download/gdrive?url=${encodeURIComponent(q)}`;

    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.result) {
      return reply("❌ ගොනුව ලබාගැනීමට අසමත් විය. කරුණාකර සත්‍ය ලින්ක් එකක් ලබා දෙන්න හෝ පසුව නැවත උත්සහ කරන්න.");
    }

    const file = data.result;

    const caption = `📁 *GDrive ගොනු විස්තරය*\n\n`
      + `📌 *ගොනු නම*: ${file.filename}\n`
      + `📦 *ප්‍රමාණය*: ${file.size}\n`
      + `🔗 *වර්ගය*: ${file.mimetype || "නොදනිමි"}\n`;

    await conn.sendMessage(from, {
      document: { url: file.url },
      mimetype: file.mimetype || 'application/octet-stream',
      fileName: file.filename,
      caption: caption + `\n\n${config.FOOTER}`
    }, { quoted: m });

  } catch (e) {
    console.error("GDrive BK9 API error:", e);
    reply("⚠️ ගොනුව ලබාගැනීමේදී දෝෂයක් සිදු විය. පසුව නැවත උත්සහ කරන්න.");
  }
});
