var mysql = require('mysql');
var fs = require('fs');

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'test',
  database: 'd3test'
});

connection.connect();

function errorHandler(error, result) {
  if (error) {
    console.log(error.message);
  } else {
    console.log('success');
    //  console.log(result);
  }
}

var jsonObj;

connection.query('DROP TABLE IF EXISTS `epic_ticket`', errorHandler);
connection.query('DROP TABLE IF EXISTS `module`', errorHandler);
connection.query('DROP TABLE IF EXISTS `module_epic_ticket`', errorHandler);
connection.query('DROP TABLE IF EXISTS `modulmodule_depends`', errorHandler);

connection.query('CREATE TABLE epic_ticket (id INT AUTO_INCREMENT PRIMARY KEY, label VARCHAR(255) NOT NULL)', errorHandler);
jsonObj = JSON.parse(fs.readFileSync('epicticketfakedata.json'));
for (i in jsonObj) {
  var epicTicket = jsonObj[i];
  connection.query('INSERT INTO epic_ticket SET ?', epicTicket, errorHandler);
}

connection.query('CREATE TABLE module (id VARCHAR(255) NOT NULL PRIMARY KEY, label VARCHAR(255) NOT NULL)', errorHandler);
jsonObj = JSON.parse(fs.readFileSync('declareddeps.json'));
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
  };
  connection.query('INSERT INTO module SET ?', node, errorHandler);
}

connection.query('CREATE TABLE module_epic_ticket (epic_ticket INT NOT NULL, module VARCHAR(255) NOT NULL)', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (1, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (1, "mam-post")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (2, "restful-api-perl")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (2, "mam-access")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (3, "ardome-role-app")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (3, "mam-conform")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (3, "mam-delete")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (4, "mam-access")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (4, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (4, "mam-config")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (4, "mam-event")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (5, "mam-debug")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (5, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (5, "restful-api-perl")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (6, "mam-filelogic")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (6, "mam-asset")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (6, "mam-media")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (6, "mam-storage")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (7, "mam-storage")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (7, "ardome5")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (7, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (7, "mam-event")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (7, "restful-api-perl")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (8, "mam-transcode")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (8, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (8, "restful-api-perl")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (9, "mam-task")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (9, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (9, "mam-asset")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (9, "mam-metadata")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (10, "mam-wan")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (10, "dal")', errorHandler);
connection.query('INSERT INTO module_epic_ticket (epic_ticket, module) VALUES (10, "mam-transfer")', errorHandler);



connection.query('CREATE TABLE modulmodule_depends (from_module VARCHAR(255) NOT NULL, to_module VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, PRIMARY KEY (from_module, to_module, type))', errorHandler);
jsonObj = JSON.parse(fs.readFileSync('declareddeps.json'));
for (key in jsonObj) {
  var arr = jsonObj[key];
  for (depi in arr) {
    var link = {
      from_module: key,
      to_module: arr[depi],
      type: 'declared'
    };
    connection.query('INSERT INTO modulmodule_depends SET ?', link, errorHandler);
  }
}

// connection.query('SELECT et.label, met.module FROM d3test.epic_ticket et, d3test.module_epic_ticket met WHERE et.id = met.epic_ticket ORDER BY et.label', errorHandler);
// connection.query('SELECT m.id, met.epic_ticket FROM d3test.module m, d3test.module_epic_ticket met WHERE m.id = met.epic_ticket ORDER BY m.id', errorHandler);

connection.commit();
