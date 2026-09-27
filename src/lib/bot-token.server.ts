// Telegram bot token config (server-only file, never bundled to the browser).
// Paste the bot token from BotFather between the quotes below.
export const TELEGRAM_BOT_TOKEN = "8926266030:AAERQp6sQgjbxNg2UGUSrwjg56lvlivbbGY";

// Mandatory private subscription channel numeric ID.
export const TELEGRAM_CHANNEL = "-1002116863288";
export const TELEGRAM_CHANNEL_LINK = "https://t.me/+e6g2Fxf-C2I4NzZk";

export function getBotToken(): string {
  const token = TELEGRAM_BOT_TOKEN || process.env["TELEGRAM_BOT_TOKEN"] || "";
  if (!token) throw new Error("Bot token is empty: set TELEGRAM_BOT_TOKEN in src/lib/bot-token.server.ts");
  return token;
}
