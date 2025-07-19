const axios = require("axios");
const { cmd } = require('../command');
const config = require('../config');

cmd({
  pattern: "mega",
  alias: ["megadl"],
  desc: "Download from Mega.nz",
  react: "📦",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.includes("mega.nz")) {
      return reply("❌ Mega.nz ලින්ක් එකක් දෙන්න.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const res = await axios.get(`https://api.gura.site/api/dl/mega?url=${encodeURIComponent(q)}`);
    const data = res.data;

    if (!data.status || !data.result || !data.result.url) {
      return reply("⚠️ ලින්ක් එකෙන් ගොනුව ගැනීමේදී දෝෂයක්. කරුණාකර පරක්කු වී නැවත උත්සාහ කරන්න.");
    }

    const { url, filename, mimetype, filesize } = data.result;

    await conn.sendMessage(from, {
      document: { url },
      mimetype: mimetype || "application/octet-stream",
      fileName: filename || "mega_file",
      caption: `📁 *File Name:* ${filename}\n📦 *Size:* ${filesize}\n\n${config.FOOTER}`
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("MEGA ERROR:", error);
    reply("❌ ගොනුව ලබාගැනීමේදී දෝෂයක් සිදු විය.");
  }
});
