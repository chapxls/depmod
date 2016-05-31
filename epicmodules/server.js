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
  database: 'd3test'
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

app.get('/epictickets/:ticketid/nodesandlinks', function(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');

  var nodesandlinks = {
    nodes: [],
    links: [],
    ticketLabel: ''
  };

  connection.query('SELECT m.*, et.id AS ticket_id, '+
  'et.label AS ticket_label ' +
  'FROM epic_ticket et, module m, module_epic_ticket met ' +
  'WHERE met.module = m.id ' + 'AND met.epic_ticket = ? ' +
  'AND met.epic_ticket = et.id', [request.params.ticketid], function(errorHandler, rows, fields) {
    for (rowi in rows) {
      var row = rows[rowi];
      nodesandlinks.nodes.push({
        "id": row.id,
        "label": row.label,
        "type": "module",
        "x": row.x,
        "y": row.y
      })
      nodesandlinks.ticketLabel = row.ticket_label;
    };
    console.log("Ticket ID: " + request.params.ticketid);
    connection.query('SELECT mmd.* ' +
      'FROM module_epic_ticket met1, module_epic_ticket met2, modulmodule_depends mmd ' +
      'WHERE met1.epic_ticket = ? ' +
      'AND met2.epic_ticket = ? ' +
      'AND mmd.from_module = met1.module ' +
      'AND mmd.to_module = met2.module', [request.params.ticketid, request.params.ticketid],
      function(errorHandler, rows, fields) {
        for (rowi in rows) {
          var row = rows[rowi];
          nodesandlinks.links.push({
            "to": row.to_module,
            "from": row.from_module
          })
        };
        response.send(nodesandlinks);
      });
  });
});

app.get('/nodesandlinks', function(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  var nodesandlinks = {
    nodes: [],
    links: []
  };
  connection.query('SELECT * FROM module', function(errorHandler, rows, fields) {
    for (rowi in rows) {
      var row = rows[rowi];
      nodesandlinks.nodes.push({
        "id": row.id,
        "label": row.label,
        "type": "module",
        "x": row.x,
        "y": row.y
      })
    };
    connection.query('SELECT * FROM modulmodule_depends', function(errorHandler, rows, fields) {
      for (rowi in rows) {
        var row = rows[rowi];
        console.log(row);
        nodesandlinks.links.push({
          "to": row.to_module,
          "from": row.from_module
        })
      };
      response.send(nodesandlinks);
    });
  });
});

app.get('/epictickets', function(request, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  //push to drop down menu
  var epictickets = [];
  connection.query('SELECT * FROM epic_ticket', function(errorHandler, rows, fields) {
    for (rowi in rows) {
      var row = rows[rowi];
      epictickets.push({
        "id": row.id,
        "label": row.label
      })
    };
    response.send(epictickets);
  });
});

app.use('/', express.static(path.resolve('./app')));
app.listen(3000, function() {
  console.log('listening');
});
