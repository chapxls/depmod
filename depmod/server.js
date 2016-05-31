var express = require('express');
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var config = require("./webpack.config.js");
var path = require('path');
var mysql = require('mysql');
var fs = require('fs');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'test',
  database: 'depmoddb'
});

var app = express();

app.use(webpackDevMiddleware(webpack(config), {}));

connection.connect();

function errorHandler(error) {
  if (error) {
    console.log(error.message);
  } else {
    console.log('success');
  }
}

// handle data REST requests
app.get('/import', function(request, response) {
  var jsonObj = JSON.parse(fs.readFileSync('nodesandlinks.json', 'utf8'));
  console.log("Nodes: ", jsonObj.nodes);

  connection.query('DELETE FROM nodes WHERE id = ?', [1], errorHandler);
  connection.query('DELETE FROM nodes WHERE id = ?', [2], errorHandler);
  connection.query('DELETE FROM nodes WHERE id = ?', [3], errorHandler);

  connection.query('DELETE FROM links WHERE id = ?', [1], errorHandler);
  connection.query('DELETE FROM links WHERE id = ?', [2], errorHandler);

  for (nodei in jsonObj.nodes) {
    var node = jsonObj.nodes[nodei];
    connection.query('INSERT INTO nodes SET ?', node, errorHandler);
  }

  for (linki in jsonObj.links) {
    var link = jsonObj.links[linki];
    connection.query('INSERT INTO links SET ?', link, errorHandler);
  }

});

app.get('/nodesandlinks', function(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  var nodesandlinks = {
    nodes: [],
    links: []
  };
  connection.query('SELECT * FROM nodes', function(errorHandler, rows, fields) {
    for (rowi in rows) {
      var row = rows[rowi];
      nodesandlinks.nodes.push({
        "id": row.id,
        "label": row.label,
        "x": row.x,
        "y": row.y
      })
    };
    connection.query('SELECT * FROM links', function(errorHandler, rows, fields) {
      for (rowi in rows) {
        var row = rows[rowi];
        nodesandlinks.links.push({
          "id": row.id,
          "target": row.target,
          "source": row.source
        })
      };
      response.send(nodesandlinks);
    });
  });
});

app.use('/', express.static(path.resolve('./app')));
app.listen(3001, function() {
  console.log('listening');
});
