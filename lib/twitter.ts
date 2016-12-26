import { connect } from 'amqplib';
import Twitter = require('twitter');
import { Observable, Subscriber } from 'rxjs';

import argv from './options';
import createLogger from './logging';

let client = new Twitter({
  consumer_key: argv.consumerKey,
  consumer_secret: argv.consumerSecret,
  access_token_key: argv.accessTokenKey,
  access_token_secret: argv.accessTokenSecret
});



export const input = new Observable<any>((sub: Subscriber<any>) => {
  const logger = createLogger('lib', 'twitter', argv.screenName);
  let lastId = undefined;

  function fetchBatch() {
    const params = {
      screen_name: argv.screenName,
      trim_user: true,
      exclude_replies: true,
      include_rts: false,
      count: argv.fetchBatchSize,
      max_id: lastId
    };

    logger.info('Fetching next batch of tweets', params);
    client.get<any[]>('statuses/user_timeline', params, (err, result) => {
      if(err) {
        sub.error(err);
        return;
      }

      if (!result || !result.length) {
        logger.info('No tweets have been fetch, closing producer');
        sub.complete();
        return;
      }

      const allIds = result.map(t => t.id);
      const newLastId = Math.min.apply(Math, allIds);
      logger.info(`Fetched ${result.length} tweets`, {
        lastId, newLastId
      });

      if (newLastId === lastId) {
        logger.info('No more tweets to fetch, closing producer');
        sub.complete();
        return;
      }
      lastId = newLastId;
      result.filter(t => 
        t.id !== lastId
      ).forEach(t =>
        sub.next(t)
      );

      fetchBatch();
    });
  }

  fetchBatch();
  logger.info('Producer ready');
});

export default input;