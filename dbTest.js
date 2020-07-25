var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "maximo13",
  database: "mydb2"
});

con.connect(function(err) {
  if (err) throw err;
  con.query("SELECT * FROM customers3", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});