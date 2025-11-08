import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔧 Environment Variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// 🌐 Your Vercel domain (update after deploy)
const SITE_URL = "https://your-vercel-domain.vercel.app"; // <-- change this after deploy

// 📩 Helper: Send message to Telegram user
async function sendMessage(chatId, text, replyMarkup = null) {
  await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
}

// 🤖 Telegram Bot Logic
app.post("/", async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text.trim();

    // 🏁 Start command
    if (text === "/start") {
      await sendMessage(
        chatId,
        `🎬 <b>Welcome to TeraFetch Bot</b>\n\nSend me any Terabox link to get a playable video link.`
      );
      return res.sendStatus(200);
    }

    // ❌ Invalid link
    if (!text.includes("terabox.com")) {
      await sendMessage(chatId, "📎 Please send a valid Terabox link!");
      return res.sendStatus(200);
    }

    // 🔄 Fetch Direct Download Link from RapidAPI
    const apiUrl = `https://terabox-downloader-direct-download-link-generator1.p.rapidapi.com/url?url=${encodeURIComponent(
      text
    )}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host":
          "terabox-downloader-direct-download-link-generator1.p.rapidapi.com",
        "x-rapidapi-key": RAPIDAPI_KEY,
      },
    });

    const data = await response.json();

    if (!data || !data.data || !data.data.download_link) {
      await sendMessage(chatId, "❌ Could not fetch link. Try again later.");
      return res.sendStatus(200);
    }

    const downloadLink = data.data.download_link;
    const playerUrl = `${SITE_URL}/player?url=${encodeURIComponent(downloadLink)}`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: "🎬 Open Video",
            url: playerUrl,
          },
        ],
      ],
    };

    await sendMessage(chatId, "✅ Your video is ready to play!", replyMarkup);
    res.sendStatus(200);
  } catch (error) {
    console.error("Bot Error:", error);
    res.sendStatus(500);
  }
});

// 🎬 Player Page (With Adsterra + Telegram Button)
app.get("/player", (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) return res.send("Missing video URL.");

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>TeraFetch Player</title>
      <style>
        body {
          background: #000;
          margin: 0;
          padding: 0;
          color: white;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        video {
          width: 100%;
          max-width: 800px;
          height: auto;
          margin-top: 20px;
          border-radius: 10px;
        }
        footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 20px 0;
          color: #aaa;
        }
        .telegram {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e90ff;
          color: white;
          padding: 8px 14px;
          border-radius: 20px;
          text-decoration: none;
          font-size: 16px;
          font-weight: bold;
          transition: 0.3s;
        }
        .telegram:hover {
          background: #0b77d0;
        }
        .telegram img {
          width: 22px;
          height: 22px;
          margin-right: 8px;
        }
        .ad-container {
          width: 100%;
          max-width: 800px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <video controls autoplay>
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>

      <!-- 💰 Adsterra Ad -->
      <div class="ad-container">
        <script async="async" data-cfasync="false" src="//pl26875836.effectivegatecpm.com/f8008bd2b70198aec0cb214fe705a556/invoke.js"></script>
        <div id="container-f8008bd2b70198aec0cb214fe705a556"></div>
      </div>

      <!-- 📱 Telegram Footer -->
      <footer>
        <a href="https://t.me/terafetch_bot" target="_blank" class="telegram">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="Telegram">
          @terafetch_bot
        </a>
        <p>🎬 Powered by TeraFetch</p>
      </footer>
    </body>
    </html>
  `);
});

// ✅ Start server
app.listen(3000, () => console.log("✅ TeraFetch Bot running..."));
