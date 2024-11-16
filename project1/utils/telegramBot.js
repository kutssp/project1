const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

// Создаем бота
const bot = new TelegramBot(config.TELEGRAM_API_KEY, { polling: true });
const CHAT_ID = config.TELEGRAM_CHAT_ID;  // ID чата для отправки сообщений

// Функция для отправки сообщений в Telegram
function sendMessage(message) {
    bot.sendMessage(CHAT_ID, message);
}

module.exports = {
    sendMessage
};
