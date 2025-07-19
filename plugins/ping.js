const config = require('../config');
const { cmd, commands } = require('../command');

// ⚡ PING COMMAND
cmd({
    pattern: "ping",
    alias: ["speed", "p"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        const startTime = Date.now();

        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay

        const endTime = Date.now();
        const ping = endTime - startTime;

        // Send the ping result
        await conn.sendMessage(from, {
            text: `*KAVI MD SPEED ➟ ${ping}ms*`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363417070951702@newsletter',
                    newsletterName: '🎬𝐌𝐎𝐕𝐈𝐄 𝐂𝐈𝐑𝐂𝐋𝐄🎬',
                    serverMessageId: 143
                }
            },
            externalAdReply: {
                title: "✨𝐊𝐀𝐕𝐈 𝐌𝐃✨",
                body: "> *ᴘᴏᴡᴇʀᴅ ʙʏ  ᴋᴀᴠɪᴅᴜ ʀᴀꜱᴀɴɢᴀ : )*",
                thumbnailUrl: "https://raw.githubusercontent.com/LAKSIDUOFFICIAL/LAKSIDU-BOT/refs/heads/main/Screenshot_20250208-114759_Photo%20Editor.jpg",
                sourceUrl: "https://github.com/laksidunimsara1/QUEEN-HASHI-MD",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }, { quoted: Supunwa }); // 🔁 mek → Supunwa

    } catch (e) {
        console.error(e);
        reply(`An error occurred: ${e.message}`);
    }
});

const botname = "𝙺𝙰𝚅𝙸 𝙼𝙳"; //add your name
 const ownername = "𝙺𝙰𝚅𝙸𝙳𝚄 𝚁𝙰𝚂𝙰𝙽𝙶𝙰"; // add your name
 const Supunwa = { 
 key: { 
  remoteJid: 'status@broadcast', 
  participant: '0@s.whatsapp.net' 
   }, 
message:{ 
  newsletterAdminInviteMessage: { 
    newsletterJid: '120363417070951702@newsletter', //add your channel jid
    newsletterName: "MOVIE CIRCLE", //add your bot name
    caption: botname + ` 𝚅𝙴𝚁𝙸𝙵𝙸𝙴𝙳 ` + ownername, 
    inviteExpiration: 0
  }
 }
}
