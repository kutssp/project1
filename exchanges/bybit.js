const Bybit = require('bybit-api');
const config = require('../config');

const bybit = new Bybit({
    apiKey: config.BYBIT.API_KEY,
    apiSecret: config.BYBIT.API_SECRET
});

// Функция для получения данных с Bybit
function tick(pairs) {
    return new Promise((resolve, reject) => {
        bybit.MarketData.getTickers(pairs)
            .then(response => resolve(response.result))
            .catch(error => reject(error));
    });
}

// Функция для получения баланса
function balance(pair) {
    return new Promise((resolve, reject) => {
        bybit.Account.getBalance()
            .then(response => resolve(response.result.available_balance))
            .catch(error => reject(error));
    });
}

module.exports = {
    tick,
    balance,
    init: () => Promise.resolve('Bybit initialized')
};
