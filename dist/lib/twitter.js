"use strict";
const Twitter = require("twitter");
const rxjs_1 = require("rxjs");
const options_1 = require("./options");
const logging_1 = require("./logging");
const { consumerKey, consumerSecret, accessTokenKey, accessTokenSecret } = options_1.default;
const DEFAULT_TWITTER_CLIENT = new Twitter({
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
    access_token_key: accessTokenKey,
    access_token_secret: accessTokenSecret
});
function createInput(settings, client = DEFAULT_TWITTER_CLIENT) {
    const { screenName, fetchBatchSize } = settings;
    return new rxjs_1.Observable((sub) => {
        const logger = logging_1.default('lib', 'twitter', options_1.default.screenName);
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
            client.get('statuses/user_timeline', params, (err, result) => {
                if (err) {
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
                result.filter(t => t.id !== lastId).forEach(t => sub.next(t));
                lastId = newLastId;
                fetchBatch();
            });
        }
        fetchBatch();
        logger.info('Producer ready');
    });
}
exports.createInput = createInput;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createInput;
//# sourceMappingURL=twitter.js.map