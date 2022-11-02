const express = require("express");
const mysql = require("mysql");
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
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

/*
Sample home page api req-response
*/
app.get("/", (req, res) => {
  res.send("Hello World!");
});

/*
API to get all art collections from database to display on UI
*/
app.get("/getAllArts/",(req,res) => {
  pool.query("SELECT * FROM `objects`", (err, data) => {
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

/*
API to get a paritcular art details from database where id is sent as URL parameter
Example: localhost:3000/getArt?id=10
GET REQUEST
*/
app.get("/getArt/:id",(req,res) => {

  pool.query("SELECT * FROM `objects` where `obj_id` < ?", [req.params.id], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };

    res.send(data);
  });

});

/*
API to get a paritcular art collections from database based on type 
Example: localhost:3000/getArtsCol/
POST REQUEST
request body = {
  "type": "painting"
}
*/
app.post("/getArtsCol/",(req,res) => {
  
  pool.query("SELECT * FROM `objects` where `obj_class` = ?", [req.body.type], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };

    res.send(data);
  });

});


/*Get past shows*/
app.get("/getPastShows/",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_type=? and ev_date<CURDATE()",["show"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

});

//get current and upcoming shows
app.get("/getUpcomingShows/",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_type=? and ev_date>=CURDATE()",["show"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

});

//get past exhibitions
app.get("/getPastExhibitions/",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_type=? and ev_date<CURDATE()",["exhibition"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

});

//get current and upcoming exhibitions
app.get("/getUpcomingExhibitions/",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_type=? and ev_date>=CURDATE()",["exhibition"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

});

//get past auctions
app.get("/getPastAuctions/",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_type=? and ev_date<CURDATE()",["auction"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//get current and upcoming auctions
app.get("/getUpcomingAuctions/",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_type=? and ev_date>=CURDATE()",["auction"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//get show with id
app.get("/getShow/:id",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_id=? and ev_type=?", [req.params.id,"show"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//get exhibition with id
app.get("/getExhibition/:id",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_id=? and ev_type=?", [req.params.id,"exhibition"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//get auction with id
app.get("/getAuction/:id",(req,res) => {
  pool.query("SELECT * FROM `events` where ev_id=? and ev_type=?", [req.params.id,"auction"], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//create a new show
app.post("/createShow/",(req,res) => {
  console.log(req.body);
  pool.query("INSERT INTO `events` (ev_name, ev_date, ev_type, ev_description, ev_site,ev_room_no) VALUES (?,?,?,?,?,?)", [req.body[0].ev_name, req.body[0].ev_date, "show", req.body[0].ev_description, req.body[0].ev_site, req.body[0].ev_room_no], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//create a new exhibition
app.post("/createExhibition/",(req,res) => {
  console.log(req.body);
  pool.query("INSERT INTO `events` (ev_name, ev_date, ev_type, ev_description, ev_site,ev_room_no) VALUES (?,?,?,?,?,?)", [req.body[0].ev_name, req.body[0].ev_date, "exhibition", req.body[0].ev_description, req.body[0].ev_site, req.body[0].ev_room_no], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//create a new auction
app.post("/createAuction/",(req,res) => {
  console.log(req.body);
  pool.query("INSERT INTO `events` (ev_name, ev_date, ev_type, ev_description, ev_site,ev_room_no) VALUES (?,?,?,?,?,?)", [req.body[0].ev_name, req.body[0].ev_date, "auction", req.body[0].ev_description, req.body[0].ev_site, req.body[0].ev_room_no], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );