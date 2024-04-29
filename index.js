require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const mongoose = require('mongoose');
const { count } = require('console');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
const mongoDb = process.env.MONDB;

mongoose.connect(mongoDb, { useNewUrlParser: true, useUnifiedTopology: true});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
})

const Url = mongoose.model('Url', urlSchema)

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;
  const parsedUrl = url.parse(originalUrl);

  const validUrlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i;

  if (!validUrlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid URL' });
  }
  
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      res.json({ error: 'invalid URL' });
    } else {
      Url.findOne({ original_url: originalUrl }).then(foundUrl => {
        if (foundUrl) {
          res.json({ original_url: foundUrl.original_url, short_url: foundUrl.short_url });
        } else {
          Url.estimatedDocumentCount().then(count => {
            let newUrl = new Url({ original_url: originalUrl, short_url: count + 1 });
            newUrl.save().then(savedUrl => {
              res.json({ original_url: savedUrl.original_url, short_url: savedUrl.short_url });
            });
          });
        }
      });
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  Url.findOne({ short_url: shortUrl }).then(foundUrl => {
    if (foundUrl) {
      res.redirect(foundUrl.original_url);
    } else {
      res.json({ error: 'No short URL found' });
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
