const { cmd } = require("../command");
const {
  generateForwardMessageContent,
  generateWAMessageFromContent
} = require("@whiskeysockets/baileys");

cmd({
  pattern: "vi",
  alias: ["fwd"],
  react: "📤",
  desc: "Forward a quoted message to the given JID",
  category: "general",
  use: ".forward <jid>",
  filename: __filename,
}, async (conn, m, { q, quoted, reply }) => {
  if (!q) return reply("📥 *Enter a valid JID (e.g., 1203xxxxxx@g.us)*");
  if (!quoted) return reply("🔁 *Reply to the message you want to forward.*");

  try {
    const content = await generateForwardMessageContent(quoted, true);
    const waMessage = await generateWAMessageFromContent(q, content, {
      userJid: conn.user.id,
      messageId: quoted.key.id
    });

    await conn.relayMessage(q, waMessage.message, { messageId: waMessage.key.id });
    await reply("✅ Message forwarded successfully!");
  } catch (err) {
    console.error(err);
    await reply("❌ Failed to forward message.");
  }
});
