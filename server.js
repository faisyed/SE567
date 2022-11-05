const express = require("express");
const mysql = require("mysql");
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");

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

pool.getConnection( (err, connection)=> {
  if (err) throw (err)
  console.log ("DB connected successful: " + connection.threadId)
})

app.use(express.static(path.join(__dirname, './src')));
app.use(express.json());

app.get('/', (req, res) => {        
  res.sendFile('./src/home.html', {root: __dirname});
});


//CREATE USER
app.post("/createUser", async (req,res) => {
  res.sendFile('./src/my-account.html', {root: __dirname});
  console.log(req.body)
  const user = req.body.name;
  const pass = req.body.password;
  pool.getConnection( async (err, connection) => {
      if (err) throw (err)
      const sqlSearch = "SELECT * FROM users WHERE username = ?"
      const search_query = mysql.format(sqlSearch,[user])
      const sqlInsert = "INSERT INTO users VALUES (0,?,?)"
      const insert_query = mysql.format(sqlInsert,[user, pass])
      await connection.query (search_query, async (err, result) => {
          if (err) throw (err)
          console.log("------> Search Results")
          console.log(result.length)
          if (result.length != 0) {
              connection.release()
              console.log("------> User already exists")
              res.sendStatus(409) 
          } 
          else {
              await connection.query (insert_query, (err, result)=> {
                  connection.release()
                  if (err) throw (err)
                  console.log ("--------> Created new User")
                  console.log(result.insertId)
                  res.sendStatus(201)
              })
          }
      }) 
  }) 
}) 


//LOGIN (AUTHENTICATE USER)
app.post("/login", (req, res)=> {
  res.sendFile('./src/my-account.html', {root: __dirname});
  const user = req.body.name
  const password = req.body.password
  pool.getConnection ( async (err, connection)=> {
      if (err) throw (err)
      const sqlSearch = "Select * from users where username = ?"
      const search_query = mysql.format(sqlSearch,[user])
      await connection.query (search_query, async (err, result) => {
      connection.release()

      if (err) throw (err)
      if (result.length == 0) {
          console.log("--------> User does not exist")
          res.sendStatus(404)
      } 
      else {
          const pass = result[0].password
          console.log(password, pass)
      
          if (password == pass) {
              console.log("---------> Login Successful")
              res.send(`${user} is logged in!`)
          } 
          else {
              console.log("---------> Password Incorrect")
              res.send("Password incorrect!")
          }
      }
      }) 
  }) 
})

/*
API to get all art collections from database to display on UI
*/
app.get("/getArts/",(req,res) => {
  pool.query("SELECT * FROM `objects`", (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    }
    var result = [];
    Object.keys(data).forEach(function(key) {
      var row = data[key];
      
      result.push({
        'title': row.obj_title,
        'url': row.img_url,
        'price': row.price,
        'author': row.obj_attribution,
        'id': row.obj_id
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
  //validation
  let missed = [];
  
  if (req.params.id == null || req.params.id == undefined || req.params.id == "" || !Number.isInteger(parseInt(req.params.id))) {
    missed.push("Invalid id");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }
  
  pool.query("SELECT * FROM `objects` where `obj_id` = ?", [parseInt(req.params.id)], (err, data) => {
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
  //validation
  let missed = [];
  
  if (req.body.type == null || req.body.type == undefined || req.body.type == "") {
    missed.push("Type of art(type) is not valid");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }
  
  pool.query("SELECT * FROM `objects` where `obj_class` = ?", [req.body.type], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };
      var result = [];
      Object.keys(data).forEach(function(key) {
        var row = data[key];
        
        result.push({
          'title': row.obj_title,
          'url': row.img_url,
          'price': row.price,
          'author': row.obj_attribution,
          'id': row.obj_id
        });
      });

      res.send(result);
  });

});

/*Api for Search by keyword for fetching collections 
Example: localhost:3000/searchKey/
POST REQUEST
request body = {
  "key": "fpl"
}
*/
app.get("/searchKey/",(req,res) => {
  //validation
  let missed = [];
  
  if (req.query.key == null || req.query.key == undefined || req.query.key == "") {
    missed.push("Keyword(key) is missing");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }
  pool.query("select * from objects where obj_title like ? or obj_medium like ? or obj_inscription like ?", [`%${req.query.key}%`,`%${req.query.key}%`,`%${req.query.key}%`], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };
    var result = [];
      Object.keys(data).forEach(function(key) {
        var row = data[key];
        
        result.push({
          'title': row.obj_title,
          'url': row.img_url,
          'price': row.price,
          'author': row.obj_attribution,
          'id': row.obj_id
        });
      });

      res.send(result);
  });

});

/*Api for Search by keyword for fetching collections 
Example: localhost:3000/searchName/
POST REQUEST
request body = {
  "name": "fpl"
}
*/
app.get("/searchName/",(req,res) => {
  //validation
  let missed = [];
  
  if (req.query.name == null || req.query.name == undefined || req.query.name == "") {
    missed.push("Name(name) is missing");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }
  pool.query("select * from objects where obj_attribution = ?", [req.query.name], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };
    var result = [];
      Object.keys(data).forEach(function(key) {
        var row = data[key];
        
        result.push({
          'title': row.obj_title,
          'url': row.img_url,
          'price': row.price,
          'author': row.obj_attribution,
          'id': row.obj_id
        });
      });

      res.send(result);
  });

});

/*Api for Search by price for fetching collections 
Example: localhost:3000/searchPrice/
POST REQUEST
request body = {
  "from":2000
  "to":3000
}
*/
app.get("/searchPrice/",(req,res) => {
  //validation
  let missed = [];
  
  if (req.query.from == null || req.query.from == undefined || req.query.from == "" || !Number.isInteger(parseInt(req.query.from))) {
    missed.push("Price range from/low value is missing");
  }
  
  if (req.query.to == null || req.query.to == undefined || req.query.to == "" || !Number.isInteger(parseInt(req.query.to))) {
    missed.push("Price range to/high value is missing");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }


  pool.query("select * from `objects` where `price` between ? and ?", [parseInt(req.query.from),parseInt(req.query.to)], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };
    
    var result = [];
      Object.keys(data).forEach(function(key) {
        var row = data[key];
        
        result.push({
          'title': row.obj_title,
          'url': row.img_url,
          'price': row.price,
          'author': row.obj_attribution,
          'id': row.obj_id
        });
      });

      res.send(result);

  });

});

//add a new art
app.post("/addArt/",(req,res) => {
  console.log(req.body);
  
  //validation
  let missed = [];

  if (req.body.obj_title == null || req.body.obj_title == undefined || req.body.obj_title == "") {
      missed.push("Title(obj_title) is required");
  }
  if (req.body.obj_beginyear == null || req.body.obj_beginyear == undefined || req.body.obj_beginyear == "") {
    missed.push("obj_beginyear is required");
  }
  if (req.body.obj_endyear == null || req.body.obj_endyear == undefined || req.body.obj_endyear == "") {
    missed.push("obj_endyear is required");
  }
  if (req.body.obj_dimensions == null || req.body.obj_dimensions == undefined || req.body.obj_dimensions == "") {
    missed.push("Art dimensions(obj_dimensions) are required");
  }
  if (req.body.obj_class == null || req.body.obj_class == undefined || req.body.obj_class == "") {
    missed.push("Art type/class (obj_class) is required");
  }
  if (req.body.loc_site == null || req.body.loc_site == undefined || req.body.loc_site == "") {
    missed.push("Location site (loc_site) is required");
  }
  if (req.body.img_url == null || req.body.img_url == undefined || req.body.img_url == "") {
    missed.push("Image url(img_url) is required");
  }
  if (req.body.price == null || req.body.price == undefined || req.body.price == "" || !Number.isFinite(parseFloat(req.body.price))) {
    missed.push("Price is missing or should be a valid integer");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }

  pool.query("insert into `objects` (`obj_title`, `obj_beginyear`, `obj_endyear`, `obj_medium`, `obj_dimensions`, `obj_inscription`, `obj_attribution`, `obj_class`, `loc_site`, `loc_room`, `loc_description`, `img_url`, `price`) values (?,?,?,?,?,?,?,?,?,?,?,?,?)", [req.body.obj_title, req.body.obj_beginyear, req.body.obj_endyear, req.body.obj_medium, req.body.obj_dimensions,req.body.obj_inscription,req.body.obj_attribution,req.body.obj_class,req.body.loc_site,req.body.loc_room,req.body.loc_description,req.body.img_url,parseFloat(req.body.price)], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.status(200).send(data);
  });

} );

//add a new art
app.post("/buyArt/", async (req,res) => {
  //validation
  let missed = [];

  if (req.query.id == null || req.query.id == undefined || req.query.id == "") {
      missed.push("id is required");
  }

  if (req.body.user_id == null || req.body.user_id == undefined || req.body.user_id == "") {
    missed.push("user_id is required");
  }

  if (req.body.user_type == null || req.body.user_type == undefined || req.body.user_type == "") {
    missed.push("user_type is required");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }
  
  pool.query("SELECT obj_id, price FROM `objects` where `obj_id` = ?", [parseInt(req.query.id)], (err,data) => {
    if(err){
      console.log(err);
      missed.push("id does not exist in the database");
      res.status(400).send(missed);
      throw(err);
    }
    
    if(data.length > 0 && data[0].obj_id > 0){
      pool.query("insert into `shop_transactions` (`obj_oid`, `total_amount`, `user_id`, `user_type`, `purchase_date`) values (?,?,?,?,?)", [data[0].obj_id, data[0].price, req.body.user_id, req.body.user_type, new Date()], (err, data) => {
        if (err){
            console.log(err);
            throw(err);
        }
        res.status(200).send(data);
      });
    }
    else{
      missed.push("id does not exist in the database");
      res.status(400).send(missed);
    }
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


