import { connect } from 'amqplib';
import Twitter = require('twitter');
import { TwitterClient } from 'twitter/interfaces';
import { Observable, Subscriber } from 'rxjs';

import argv from './options';
import createLogger from './logging';

const { consumerKey, consumerSecret, accessTokenKey, accessTokenSecret } = argv;
const DEFAULT_TWITTER_CLIENT = new Twitter({
  consumer_key: consumerKey,
  consumer_secret: consumerSecret,
  access_token_key: accessTokenKey,
  access_token_secret: accessTokenSecret
});

export interface TwitterFetchSettings {
  screenName,
  fetchBatchSize
}

export function createInput (settings: TwitterFetchSettings, client: TwitterClient = DEFAULT_TWITTER_CLIENT): Observable<any> {
  const { screenName, fetchBatchSize } = settings;

  return new Observable<any>((sub: Subscriber<any>) => {
    const logger = createLogger('lib', 'twitter', argv.screenName);
    let lastId = undefined;

    function fetchBatch() {
      const params = {
        screen_name: screenName,
        trim_user: true,
        exclude_replies: true,
        include_rts: false,
        count: fetchBatchSize,
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
        
        result.filter(t => 
          t.id !== lastId
        ).forEach(t =>
          sub.next(t)
        );
        
        lastId = newLastId;
        fetchBatch();
      });
    }

    fetchBatch();
    logger.info('Producer ready');
  });
}

export default createInput;