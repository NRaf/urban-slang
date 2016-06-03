'use strict';

const UrbanSlang = require('../urban-slang');
const assert = require('chai').assert;

let urbanSlang;
describe('empty word list', function() {
    before(function() {
        urbanSlang = new UrbanSlang();
    });

    it(`should return [] when search term is ''`, function() {
        assert.lengthOf(urbanSlang.retrieveWords(''), 0);
    });

    it(`should return [] when search term is 'test'`, function() {
        assert.lengthOf(urbanSlang.retrieveWords('test'), 0);
    });
});

describe('single word list', function() {
    before(function() {
        urbanSlang = new UrbanSlang();
        urbanSlang.insertWord('apple');
    });

    it(`should return [] when search term is ''`, function() {
        assert.lengthOf(urbanSlang.retrieveWords(''), 0);
    });

    it(`should return ['apple'] when search term is 'apple'`, function() {
        assert.sameMembers(urbanSlang.retrieveWords('apple'), ['apple']);
    });
});

describe('multiple words starting with app', function() {
    const words = ['app', 'apple', 'appliance', 'appliances'];
    before(function() {
        urbanSlang = new UrbanSlang();
        words.forEach(w => urbanSlang.insertWord(w));
    });

    it(`should return all entries when search term is 'app'`, function() {
        assert.sameMembers(urbanSlang.retrieveWords('app'), words);
    });

    it(`should return all entries when search term is 'APP'`, function() {
        assert.sameMembers(urbanSlang.retrieveWords('APP'), words);
    });

    it(`should return all entries when search term is ' APP '`, function() {
        assert.sameMembers(urbanSlang.retrieveWords(' APP '), words);
    });

    it(`should return ['apple'] when search term is 'apple'`, function() {
        assert.sameMembers(urbanSlang.retrieveWords('apple'), ['apple']);
    });
});

describe('inserting words', function() {
    const words = ['app', 'apple', 'appliance', 'appliances'];
    const wordsToInsert = ['banana', 'bandana', 'bandage', 'bake'];
    beforeEach(function() {
        urbanSlang = new UrbanSlang();
        words.forEach(w => urbanSlang.insertWord(w));
    });

    it(`should return [] when search term is 'banana' (before insert)`, function() {
        assert.sameMembers(urbanSlang.retrieveWords('banana'), []);
    });

    it(`should return ['banana'] when search term is 'banana' (after insert)`, function() {
        wordsToInsert.forEach(w => urbanSlang.insertWord(w));
        assert.sameMembers(urbanSlang.retrieveWords('banana'), ['banana']);
    });

    it(`should return ['banana', 'bandana', 'bandage'] when search term is 'ban' (after insert)`, function() {
        wordsToInsert.forEach(w => urbanSlang.insertWord(w));
        assert.sameMembers(urbanSlang.retrieveWords('ban'), ['banana', 'bandana', 'bandage']);
    });
});

describe('loading words from file', function() {
    before(function(done) {
        this.timeout(10000);
        urbanSlang = new UrbanSlang();
        urbanSlang.loadWordsFromFile('data/scrabble.txt', done);
    });

    it(`should return ['banana', 'bananas'] when search term is 'banana'`, function() {
        assert.sameMembers(urbanSlang.retrieveWords('banana'), ['banana', 'bananas']);
    });


    it(`should return [].length = 201 (limit) when search term is 'ban'`, function() {
        const words = urbanSlang.retrieveWords('ban');
        assert.lengthOf(words, 201);
        words.forEach(w => assert.match(w, /^ban/));
    });
});