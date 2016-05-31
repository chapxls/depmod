var mysql = require('mysql');
var fs = require('fs');

if (process.argv.length < 3) {
  console.log("Missing parameter");
  process.exit(1);
}

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'test',
  database: 'depmoddb'
});

connection.connect();

function errorHandler(error, result) {
  if (error) {
    console.log(error.message);
  } else {
    console.log('success');
    console.log(result);
  }
}

var content = fs.readFileSync(process.argv[2]);

var jsonObj = JSON.parse(content);

connection.query('DROP TABLE IF EXISTS `nodes`', errorHandler);
connection.query('DROP TABLE IF EXISTS `links`', errorHandler);

connection.query('CREATE TABLE nodes (label VARCHAR(255) NOT NULL, x INT NOT NULL, y INT NOT NULL, id VARCHAR(255) PRIMARY KEY)', errorHandler);
connection.query('CREATE TABLE links (target VARCHAR(255) NOT NULL, source VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, id INT AUTO_INCREMENT PRIMARY KEY)', errorHandler);

var idMap = new Map();

for (key in jsonObj) {
  idMap[key] = 0;
  var arr = jsonObj[key];
  for (depi in arr) {
    idMap[arr[depi]] = 0;
  }
}

for (id in idMap) {
  var node = {
    id: id,
    label: id,
    x: 5,
    y: 10
  };
  connection.query('INSERT INTO nodes SET ?', node, errorHandler);

}

for (key in jsonObj) {
  var arr = jsonObj[key];
  for (depi in arr) {
    var link = {
      source: key,
      target: arr[depi],
      type: 'declared'
    };
    connection.query('INSERT INTO links SET ?', link, errorHandler);

  }
}
