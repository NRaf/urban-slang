'use strict';
const UrbanSlang = require('./urban-slang');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const logger = require('./util/logger').getLogger('app');

const urbanSlang = new UrbanSlang();

const rp = require('request-promise');
const cheerio = require('cheerio');
const co = require('co');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static('public'));

const expressHandlebars = require('express-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        eq: function (v1, v2) {
            return v1 === v2;
        },
        ne: function (v1, v2) {
            return v1 !== v2;
        },
        lt: function (v1, v2) {
            return v1 < v2;
        },
        gt: function (v1, v2) {
            return v1 > v2;
        },
        lte: function (v1, v2) {
            return v1 <= v2;
        },
        gte: function (v1, v2) {
            return v1 >= v2;
        },
        and: function (v1, v2) {
            return v1 && v2;
        },
        or: function (v1, v2) {
            return v1 || v2;
        }
    }
});

app.engine('handlebars', expressHandlebars.engine);
app.set('view engine', 'handlebars');

app.get('/',  (req, res) => res.render('pages/home'));
app.get('/word/:word',  (req, res) => {
    res.render('pages/word', {word: req.params.word, mode: 'definition'});
});

app.get('/word/:word/rhymes',  (req, res) => {
    const getRhymes = word => {
        rp({uri: `https://api.datamuse.com/words?rel_rhy=${word}`, json: true})
            .then(rhymes => res.render('pages/word', {word, mode: 'rhyme', rhymes: rhymes.map(r => r.word)}))
            .error(err => console.log(err));
    }

    getRhymes(req.params.word);
});

app.get('/word/:word/etymology',  (req, res) => {
    co(function*() {
        logger.info(req.params.word);
        logger.info(`https://en.wiktionary.org/w/index.php?title=${req.params.word}&printable=yes`);
        var wikitionaryResult = yield rp.get({url: `https://en.wiktionary.org/w/index.php?title=${req.params.word}&printable=yes`, simple: true});

        const $wiki = cheerio(wikitionaryResult);
        const $wikiBody = $wiki.find('#English').parent('h2').nextUntil('h2');
        $wikiBody.find('a').each((i, a) => {
            if (a.attribs.href.indexOf('://') < 0) {
                if (a.attribs.href.indexOf(':') < 0) {
                    a.attribs.class = 'inline-word';
                    a.attribs['data-word'] = a.attribs.href.replace('/wiki/', '').split('#')[0];
                }
                
                a.attribs.href = `https://en.wiktionary.org${a.attribs.href}`;
                a.attribs.target = '_blank';
            }
        });

        const etymogolies = $wikiBody.find('[id*=Etymology]').parent().next();
        res.render('pages/word', {word: req.params.word, data: $wikiBody.find('[id*=Etymology]').parent().next(), mode: 'etymology'});
    }).catch(e => {
        console.log(e);
        res.render('pages/word', {word: req.params.word, data: `<h3>No etymology information found</h3>`, mode: 'etymology'});
    });
});

app.get('/word/:word/wiki',  (req, res) => {
    co(function*() {
        logger.info(req.params.word);
        var wikitionaryResult = yield rp.get({url: `https://en.wikipedia.org/w/index.php?title=${req.params.word}&printable=yes`, simple: true});

        const $wiki = cheerio(wikitionaryResult);
        const $wikiBody = $wiki;//.find('#English').parent('h2').nextUntil('h2');
        $wikiBody.find('a').each((i, a) => {
            try {
                if (a.attribs.href.indexOf('://') < 0) {
                    if (a.attribs.href.indexOf(':') < 0) {
                        a.attribs.class = 'inline-word';
                        a.attribs['data-word'] = a.attribs.href.replace('/wiki/', '').split('#')[0];
                    }
                    
                    a.attribs.href = `https://en.wiktionary.org${a.attribs.href}`;
                    a.attribs.target = '_blank';
                }
            } catch (e) {

            }
        });

        res.render('pages/word', {word: req.params.word, url: `https://en.wikipedia.org/wiki/${req.params.word}`, mode: 'wiki'});
    }).catch(e => {
        console.log(e);
        res.render('pages/word', {word: req.params.word, data: `<h3>No etymology information found</h3>`, mode: 'etymology'});
    });
});

app.get('/contact', (req, res) => res.render('pages/contact'));

app.post('/contact', (req, res) => {
    var AWS = require('aws-sdk');
    AWS.config.update({region: 'us-west-2'});
    var ses = new AWS.SES({apiVersion: '2010-12-01'});
    var to = ['nedrafehi@gmail.com'];
    var from = 'info@wordpursuits.com';

    logger.info({
            Source: from,
            Destination: { ToAddresses: to },
            Message: {
                Subject: {
                    Data: `New email from wordpursuits.com ${req.body.subject}`,
                },
                Body: {
                    Text: {
                        Data: req.body.message,
                    }
                }
            }
        }
        , function (err, data) {
            logger.warn(err);
            logger.warn(data);
            if (err) throw err;
        });

    ses.sendEmail(
        {
            Source: from,
            Destination: { ToAddresses: to },
            Message: {
                Subject: {
                    Data: `New email from wordpursuits.com: ${req.body.subject}`,
                },
                Body: {
                    Text: {
                        Data: 
                        `
                        ${req.body.name}, ${req.body.email} has sent you an email.
                        Subject: ${req.body.subject}
                        Body: ${req.body.message}
                        `,
                    }
                }
            }
        }
        , function (err, data) {
            logger.warn(err);
            logger.warn(data);
            if (err) throw err;
        }
    );


    return res.render('pages/contact')
});

app.get('/about', (req, res) =>
    res.render('pages/about')
);

app.get('/terms', (req, res) =>
    res.render('pages/terms')
);

app.get('/search/:word', (req, res) =>
    res.send({ results: urbanSlang.retrieveWords(req.params.word) })
);

app.get('/rehab', (req, res) =>
    res.render('pages/rehab')
);

function startServer() {
    app.listen(8081, () =>
        console.log('Urban Slang started on port 8081')
    );
}

urbanSlang.loadWordsFromFile('data/scrabble.txt', startServer);
