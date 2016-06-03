'use strict';
const UrbanSlang = require('./urban-slang');
const express = require('express');
const app = express();

const urbanSlang = new UrbanSlang();

app.use(express.static('public'));

app.get('/search/:word', (req, res) =>
    res.send({ results: urbanSlang.retrieveWords(req.params.word) })
);

function startServer() {
    app.listen(3000, () =>
        console.log('Urban Slang started on port 3000')
    );
}

urbanSlang.loadWordsFromFile('data/scrabble.txt', startServer);