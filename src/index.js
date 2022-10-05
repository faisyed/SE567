const express = require("express");
const mysql = require("mysql2");

const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});


//Connection to Mysql
const config = {
    host: "db-se-567.cx8txkcnxtfy.us-east-1.rds.amazonaws.com",
    port: 3306,
    database: "db_se_567",
    user: "admin",
    password: "database567"
}
 
// const connection = mysql.createConnection(config)
 
// connection.connect(function(err) {
//     if (err) throw(err);
//     console.log("Connected!");
// });

// connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Connected!");
 
//     let createUser = `CREATE TABLE users (user_id INT(100), user_name VARCHAR(255), email VARCHAR(255))`;
 
//     connection.query(createUser, function(err, results, fields) {
//         if (err) {
//             console.log(err.message);
//         }
//     });
// });

const pool = mysql.createPool(config);
 
pool.query("SELECT * FROM dummy", (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    }
    console.log(data);
});