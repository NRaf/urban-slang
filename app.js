'use strict';
const UrbanSlang = require('./urban-slang');
const express = require('express');
const app = express();

const urbanSlang = new UrbanSlang();

app.use(express.static('public'));

app.get('/about', (req, res) =>
    res.sendFile(__dirname + '/public/about.html')
);

app.get('/search/:word', (req, res) =>
    res.send({ results: urbanSlang.retrieveWords(req.params.word) })
);

function startServer() {
    app.listen(8081, () =>
        console.log('Urban Slang started on port 8081')
    );
}

urbanSlang.loadWordsFromFile('data/scrabble.txt', startServer);
