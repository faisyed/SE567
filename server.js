const express = require("express");
const mysql = require("mysql");

const app = express();
const port = 3000;



//Connection to Mysql
const config = {
  host: "db-se-567.cx8txkcnxtfy.us-east-1.rds.amazonaws.com",
  port: 3306,
  database: "db_se_567",
  user: "admin",
  password: "database567"
}

const pool = mysql.createPool(config);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/getAllArts/",(req,res) => {

  pool.query("SELECT * FROM objects", (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    }
    var result = [];
    Object.keys(data).forEach(function(key) {
      var row = data[key];
      
      result.push({
        'obj_title': row.obj_title
      });
    });

    res.send(result);
  });

});