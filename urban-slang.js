'use strict'
const fs = require('fs');
const readline = require('readline');

class UrbanSlang {
    constructor() {
        this.wordTree = {};
        this.limit = 201;
        this.insertWord = this.insertWord.bind(this);
    }

    loadWordsFromFile(filename, callback) {
        var lineReader = readline.createInterface({ input: fs.createReadStream(filename) });
        lineReader.on('line', this.insertWord);
        lineReader.on('close', () => {
            console.log(`Finished loading words from ${filename}`);
            callback && callback();
        });
    }

    insertWord(word) {
        let level = this.wordTree; //Start at the root node
        word.split('').forEach(w => {
            if (!level[w]) level[w] = {}; //Create the next level if it doesn't exist
            level = level[w];
        });

        level._ = true; //`_` indicates that the start of the tree to this node spells a valid word
    }

    retrieveWords(searchTerm) {
        searchTerm = searchTerm.trim().toLowerCase();

        if (searchTerm === '') return []; //searchTerm cannot be empty.

        let startNode = this._findStartingNode(searchTerm);
        if (!startNode) return []; //Return an empty array if the searchTerm itself doesn't exist

        const matchedWords = startNode._ ? [searchTerm] : []; //If the searchTerm is a word, add it to the matched list

        this._performSearch(matchedWords, searchTerm, startNode);

        return matchedWords;
    }

    _findStartingNode(searchTerm) {
        let startNode = this.wordTree;
        for (const l of searchTerm.split('')) {
            startNode = startNode[l];
            if (!startNode) return undefined;
        }
        return startNode;
    }

    _performSearch(matchedWords, searchTerm, startNode) {
        startNode = startNode || this.wordTree;

        const doTraverse = (curNode, curQueue) => {
            const letters = Object.keys(curNode);
            if (letters.length == 0 || (letters.length == 1 && letters[0] == ['_'])) return; //Reached end of a branch

            for (const l of letters) {
                if (matchedWords.length >= this.limit) break;

                if (l == '_') continue;

                const queue = curQueue.slice(0); //Make a copy of the current queue
                queue.push(l);

                if (curNode[l] && curNode[l]._) matchedWords.push((queue + '').replace(/,/g, ''));

                doTraverse(curNode[l], queue);
            }
        };

        doTraverse(startNode, searchTerm.split(''));
    }
}

module.exports = UrbanSlang;