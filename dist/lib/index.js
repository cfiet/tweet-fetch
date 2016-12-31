"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const options_1 = require("./options");
const twitter_1 = require("./twitter");
const logging_1 = require("./logging");
const queue_1 = require("./queue");
let inputSub;
const logger = logging_1.default('lib', 'index');
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const input = twitter_1.default(options_1.default);
        const queue = yield queue_1.default.create(options_1.default, options_1.default.screenName);
        input.do(tweet => {
            queue;
        });
        return yield input.do(tweet => {
            queue.publish(tweet, tweet.id.toString());
        })
            .toArray()
            .toPromise()
            .then(tweets => {
            logger.info(`Successfully fetched ${tweets.length} tweets`);
            return true;
        }).catch(err => {
            logger.error(`An error occured: ${err.message}`, err);
            return false;
        }).then((success) => __awaiter(this, void 0, void 0, function* () {
            yield queue.close();
            return success;
        }));
    });
}
main().then(success => {
    process.exit(success ? 0 : -1);
});
//# sourceMappingURL=index.js.map