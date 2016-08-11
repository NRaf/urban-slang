'use strict';
const UrbanSlang = require('./urban-slang');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const logger = require('./util/logger').getLogger('app');

const urbanSlang = new UrbanSlang();

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

app.get('/', function (req, res) {
    res.render('pages/home')
});

app.get('/contact', (req, res) =>
    res.render('pages/contact')
);

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

function startServer() {
    app.listen(8081, () =>
        console.log('Urban Slang started on port 8081')
    );
}

urbanSlang.loadWordsFromFile('data/scrabble.txt', startServer);
