const { cmd } = require('../command');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const { File } = require('megajs');

cmd({
  pattern: "mega",
  alias: ["megadl"],
  desc: "Download from Mega.nz",
  react: "📥",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, q, reply }) => {
  try {
    if (!q || !q.includes('mega.nz')) {
      return reply("❌ කරුණාකර සත්‍ය MEGA.nz ලින්ක් එකක් ලබාදෙන්න.");
    }

    await conn.sendMessage(from, { react: { text: "⏳", key: m.key } });

    const file = File.fromURL(q);
    await file.loadAttributes();

    const fileName = file.name || "mega_download";
    const fileSize = file.size || 0;
    const savePath = path.join(__dirname, '..', 'tmp', fileName);

    const writeStream = fs.createWriteStream(savePath);
    const downloadStream = file.download();

    downloadStream.pipe(writeStream);

    downloadStream.on('end', async () => {
      await conn.sendMessage(from, {
        document: { url: savePath },
        mimetype: "application/octet-stream",
        fileName: fileName,
        caption: `📥 *MEGA File:* ${fileName}\n📦 *Size:* ${(fileSize / (1024 * 1024)).toFixed(2)} MB\n\n${config.FOOTER}`
      }, { quoted: m });

      await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

      // Optional: Delete temp file after sending
      fs.unlink(savePath, () => {});
    });

    downloadStream.on('error', err => {
      console.error("MEGA Download Error:", err);
      reply("❌ ගොනුව බාගැනීමේදී දෝෂයක් සිදු විය.");
    });

  } catch (error) {
    console.error("MEGA Error:", error);
    reply("❌ MEGA link එක ක්‍රියාවට නැහැ. කරුණාකර link එක සත්‍යද බලන්න.");
  }
});
