require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

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

let urlDatabase = {};
let id = 0;

app.post('/api/shorturl', function (req, res) {
  const originalUrl = req.body.url;
  const parsedUrl = url.parse(originalUrl);

  if (!/^https?:\/\//.test(originalUrl)) {
    res.json({ error: 'invalid URL' });
    return;
  }

  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      res.json({ error: 'invalid URL' });
    } else {
      id++;
      urlDatabase[id] = originalUrl;
      res.json({ original_url: originalUrl, short_url: id });
    }
  });
});

app.get('/api/shorturl/:short_url', function (req, res) {
  const shortUrl = req.params.short_url;
  const originalUrl = urlDatabase[shortUrl];
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.json({ error: 'No short URL found' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
