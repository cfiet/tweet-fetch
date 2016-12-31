"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const chai_1 = require("chai");
const typemoq_1 = require("typemoq");
require("./setup");
const twitter_1 = require("../../lib/twitter");
describe('spec: lib/twitter', () => {
    const SETTINGS = {
        screenName: 'test_user',
        fetchBatchSize: 10
    };
    const TWEETS = [
        { id: 10 },
        { id: 9 },
        { id: 8 },
        { id: 7 },
        { id: 6 }
    ];
    let clientMock;
    let input;
    let result;
    before(() => __awaiter(this, void 0, void 0, function* () {
        clientMock = typemoq_1.Mock.ofInstance({
            get: () => { }
        });
        let calls = 0;
        const BATCHES = [
            [TWEETS[0], TWEETS[1], TWEETS[2]],
            [TWEETS[2], TWEETS[3], TWEETS[4]]
        ];
        clientMock.setup(i => i.get(typemoq_1.It.isAnyString(), typemoq_1.It.isAny(), typemoq_1.It.isAny()))
            .callback((e, p, cb) => {
            if (BATCHES[calls] !== undefined) {
                cb(null, BATCHES[calls++]);
                return;
            }
            cb(null, [TWEETS[4]]);
        });
        input = twitter_1.default(SETTINGS, clientMock.object);
        result = yield input.toArray().toPromise();
    }));
    describe('calls Twitter API', () => {
        const TWITTER_ENDPOINT = 'statuses/user_timeline';
        it(`endpoint '${TWITTER_ENDPOINT}'`, () => {
            clientMock.verify(i => i.get(TWITTER_ENDPOINT, typemoq_1.It.isAny(), typemoq_1.It.isAny()), typemoq_1.Times.exactly(3));
        });
        it(`with screen_name = ${SETTINGS.screenName}`, () => {
            clientMock.verify(i => i.get(typemoq_1.It.isAny(), typemoq_1.It.is(parameters => {
                chai_1.expect(parameters.screen_name).to.be.equal(SETTINGS.screenName);
                return true;
            }), typemoq_1.It.isAny()), typemoq_1.Times.exactly(3));
        });
        it(`with screen_name = ${SETTINGS.screenName}`, () => {
            clientMock.verify(i => i.get(typemoq_1.It.isAny(), typemoq_1.It.is(parameters => {
                chai_1.expect(parameters.count).to.be.equal(SETTINGS.fetchBatchSize);
                return true;
            }), typemoq_1.It.isAny()), typemoq_1.Times.exactly(3));
        });
    });
    it('passes no max_id in the first request', () => {
        clientMock.verify(i => i.get(typemoq_1.It.isAny(), typemoq_1.It.is(parameters => parameters.max_id === undefined), typemoq_1.It.isAny()), typemoq_1.Times.once());
    });
    it('calculates corretct max_id after first request', () => {
        clientMock.verify(i => i.get(typemoq_1.It.isAny(), typemoq_1.It.is(parameters => parameters.max_id === TWEETS[2].id), typemoq_1.It.isAny()), typemoq_1.Times.once());
    });
    it('calculates corretct max_id for subsequent requests', () => {
        clientMock.verify(i => i.get(typemoq_1.It.isAny(), typemoq_1.It.is(parameters => parameters.max_id === TWEETS[4].id), typemoq_1.It.isAny()), typemoq_1.Times.atLeastOnce());
    });
    it('emits all expected tweets, without duplicates and in the same order as API calls', () => {
        chai_1.expect(result).to.be.eql(TWEETS);
    });
});
//# sourceMappingURL=twitter.test.js.map