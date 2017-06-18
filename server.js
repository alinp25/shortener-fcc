var mongodb = require('mongodb');
var _ = require('lodash');
var validator = require('validator');
var express = require('express');

var app = express();

var mongoURI = 'mongodb://' + process.env.USER + ':' + process.env.PASS + '@' + process.env.HOST + ':' + process.env.PORT + '/' + process.env.DB;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('views/index.html', {root: __dirname});
})

app.get('/new/*', (req, res) => {
  var urlParam = req.params[0];
  if (!validator.isURL(urlParam)) {
    res.send({
      error: "URL is not valid",
      url: urlParam
    })
  }
  mongodb.MongoClient.connect(mongoURI, (err, db) => {
    if (err) {
      return console.log("Couldn't connect to database");
    }
    console.log("Connected to MongoDB Server");
    
    db.collection('urls').find({original_url: urlParam}).toArray().then((docs) => {
      var items = db.collection('urls').count().then((numItems) => {
        if (docs.length === 0) {
          var shorter = {
            original_url: urlParam,
            short_url: numItems.toString()
          };
          db.collection('urls').insert(shorter);
          res.send(_.pick(shorter, ['original_url', 'short_url']));
        } else {
          res.send(JSON.stringify(_.pick(docs[0], ['original_url', 'short_url'])));
        }
      });
    });    
  });
});

app.get('/*', (req, res) => {
  var urlParam = req.params[0];
  mongodb.MongoClient.connect(mongoURI, (err, db) => {
    if (err) {
      return console.log("Couldn't connect to database");
    }
    console.log("Connected to MongoDB Server");
    
    db.collection('urls').findOne({short_url: urlParam}).then((doc) => {
      if (!doc) {
        res.send("URL doesn't exist!!!");
      }
      res.redirect(doc.original_url);
    });
  });
});

var listener = app.listen('3000', () => {
  console.log("Your app is listening on port" + listener.address().port)
});