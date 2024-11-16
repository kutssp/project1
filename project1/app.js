const exchanges = {
  binance: require('./exchanges/binance'),
  bybit: require('./exchanges/bybit'),
};

const logger = require('./utils/logger');
const telegramBot = require('./utils/telegramBot');  // Импорт Telegram-бота
const _ = require('lodash');
const SUPPORTED_PAIRS = ['BTCUSDT', 'ETHUSDT', 'XRPUSDT', 'XMRUSDT', 'LTCUSDT'];
const OPPORTUNITY_THRESHOLD_PERCENTAGE = 1;
let interval;

(function init(){
  Promise.all([exchanges.binance.init(), exchanges.bybit.init()]).then((messages)=>{
      logger.log(messages[0]);
      logger.log(messages[1]);
      interval = setInterval(tick, 3000);
  }).catch(logger.error);

  function tick(){
      getPrices(SUPPORTED_PAIRS).then(getOrderSize).then(telegramBot.sendMessage).catch(logger.error);
  }
}());

function getOrderSize(opportunity){
  return new Promise((resolve, reject) => {
      const balancePromises = [
          exchanges[opportunity.shortExchange].balance(opportunity.pair).catch(reject),
          exchanges[opportunity.longExchange].balance(opportunity.pair).catch(reject)
      ];
      Promise.all(balancePromises).then(balances => {
          opportunity.orderSize = _.min(balances);
          resolve(opportunity);
      }).catch(reject);
  });
}

function getPrices(pairs) {
  return new Promise((resolve, reject) => {
      const pricePromises = [
          exchanges.binance.tick(pairs).catch(reject),
          exchanges.bybit.tick(pairs).catch(reject)
      ];
      Promise.all(pricePromises).then(prices => {
          let opportunity = {};
          let binancePrices = prices[0];
          let bybitPrices = prices[1];

          _.each(binancePrices, (binancePrice) =>{
              _.each(bybitPrices, (bybitPrice) =>{
                  if(binancePrice.pair === bybitPrice.pair){
                      let ordered =_.sortBy([binancePrice, bybitPrice], ['mid']);
                      let longExchange = ordered[0];
                      let shortExchange = ordered[1];
                      let delta = parseFloat(100 - (longExchange.ask / shortExchange.bid * 100)).toFixed(2);
                      if ( delta > OPPORTUNITY_THRESHOLD_PERCENTAGE ){
                          if((opportunity && (opportunity.delta < delta)) || _.isEmpty(opportunity)){
                              opportunity = {
                                  pair: binancePrice.pair,
                                  shortExchange: shortExchange.exchange,
                                  longExchange: longExchange.exchange,
                                  shortExchangeAsk: shortExchange.ask,
                                  shortExchangeBid: shortExchange.bid,
                                  shortExchangeMid: shortExchange.mid,
                                  longExchangeAsk: longExchange.ask,
                                  longExchangeBid: longExchange.bid,
                                  longExchangeMid: longExchange.mid,
                                  delta: delta,
                              }
                          }
                      }
                  }
              })
          });
          if(_.isEmpty(opportunity)){
              reject('No opportunity.');
          }
          else{
              // Формирование сообщения о найденной арбитражной возможности
              const message = `
                  🚨 **Arbitrage Opportunity Found** 🚨
                  **Pair**: ${opportunity.pair}
                  **Short Exchange**: ${opportunity.shortExchange} - Ask: ${opportunity.shortExchangeAsk}, Bid: ${opportunity.shortExchangeBid}
                  **Long Exchange**: ${opportunity.longExchange} - Ask: ${opportunity.longExchangeAsk}, Bid: ${opportunity.longExchangeBid}
                  **Delta**: ${opportunity.delta}%
              `;
              telegramBot.sendMessage(message);  // Отправка сообщения в Telegram
              resolve(opportunity);
          }
      });
  });
}
