const Binance = require('node-binance-api');
const config = require('../config');

const binance = new Binance().options({
    APIKEY: config.BINANCE.API_KEY,
    APISECRET: config.BINANCE.API_SECRET
});

// Функция для получения данных с Binance
function tick(pairs) {
    return new Promise((resolve, reject) => {
        binance.prices(pairs, (error, ticker) => {
            if (error) {
                return reject(error);
            }
            resolve(ticker);
        });
    });
}

// Функция для получения баланса
function balance(pair) {
    return new Promise((resolve, reject) => {
        binance.balance((error, balance) => {
            if (error) {
                return reject(error);
            }
            resolve(balance[pair] ? balance[pair].available : 0);
        });
    });
}

module.exports = {
    tick,
    balance,
    init: () => Promise.resolve('Binance initialized')
};
