import { config } from 'dotenv';
import * as yargs from 'yargs';

const QUEUE_SETTINGS = "Queue settings"
const TWITTER_API_SETTINGS = "Twitter API settings"

// Load .env file if avaliable
config({
  silent: true
});

export interface TweetFetchOptions extends yargs.Argv {
  queueUrl: string;
  queueExchange: string;
  queueRoutingPrefix: string;
  queueAppId: string;
  queueMessageType: string;
  consumerKey: string;
  consumerSecret: string;
  accessTokenKey: string;
  accessTokenSecret: string;
  fetchBatchSize: number;
  screenName: string;
}

export const argv = <TweetFetchOptions>yargs.usage('$0 [args]')
  .env('TWEET_FETCH')
  .option('queue-url', {
    alias: 'q',
    description: 'RabbitMQ URL',
    required: true,
    type: 'string',
    group: QUEUE_SETTINGS
  })
  .option('queue-exchange', {
    alias: 'x',
    description: 'RabbitMQ target exchange',
    default: 'tweets',
    required: true,
    type: 'string',
    group: QUEUE_SETTINGS
  })
  .option('queue-routing-prefix', {
    description: 'RabbitMQ routing key prefix',
    default: 'tweet',
    required: true,
    type: 'string',
    group: QUEUE_SETTINGS
  })
  .option('queue-app-id', {
    description: 'RabbitMQ app id',
    default: 'fetch-tweet',
    required: true,
    type: 'string',
    group: QUEUE_SETTINGS
  })
  .option('queue-message-type', {
    description: 'RabbitMQ message type',
    default: 'tweet',
    required: true,
    type: 'string',
    group: QUEUE_SETTINGS
  })
  .option('consumer-key', {
    description: 'Twitter API consumer key',
    required: true,
    type: 'string',
    group: TWITTER_API_SETTINGS
  })
  .option('consumer-secret', {
    description: 'Twitter API consumer secret',
    required: true,
    type: 'string',
    group: TWITTER_API_SETTINGS
  })
  .option('access-token-key', {
    description: 'Twitter API access token key',
    required: true,
    type: 'string',
    group: TWITTER_API_SETTINGS
  })
  .option('access-token-secret', {
    description: 'Twitter API access token secret',
    required: true,
    type: 'string',
    group: TWITTER_API_SETTINGS
  })
  .option('screen-name', {
    description: 'Screen name of an account to fetch Tweets from',
    required: true,
    type: 'string',
    group: TWITTER_API_SETTINGS
  })
  .option('fetch-batch-size', {
    alias: 'b',
    description: 'Maximum number of tweets to fetch in a single batch. '
      + 'Keep in mind that Twitter API never returns more that 200 tweets for a single request',
    default: 200,
    type: 'number',
    group: TWITTER_API_SETTINGS
  })
  .help('h')
  .alias('h', 'help')
  .argv;

export default argv;