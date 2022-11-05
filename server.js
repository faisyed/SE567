const express = require("express");
const mysql = require("mysql");
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require("bcrypt");
const { response } = require("express");

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

//get all members
app.get("/getAllMem/",(req,res) => {
  pool.query("SELECT * FROM `members`", (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//get member with id
app.get("/getMem/:id",(req,res) => {
  pool.query("SELECT * FROM `members` where mem_id=?", [req.params.id], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );


//insert new member
app.post("/register/",(req,res) => {
  console.log(req.body);
  pool.query("INSERT INTO `members` (first_name, last_name, phone_no, email, address1,address2,city,state,zipcode) VALUES (?,?,?,?,?,?,?,?,?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].phone_no, req.body[0].email, req.body[0].address1, req.body[0].address2,req.body[0].city ,req.body[0].state ,req.body[0].zipcode], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

//insert new member
app.put("/updateMem/:id",(req,res) => {
  console.log(req.body);
  pool.query("UPDATE `members` SET first_name=?, last_name=?, phone_no=?, email=?, address1=?,address2=?,city=?,state=?,zipcode=? WHERE mem_id=? ", [req.body[0].first_name, req.body[0].last_name, req.body[0].phone_no, req.body[0].email, req.body[0].address1, req.body[0].address2,req.body[0].city ,req.body[0].state ,req.body[0].zipcode,req.params.id], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );

// make a donation
app.post("/makeDonation/",(req,res) => {
  let missed_fields = [];
  // check if first name is empty, undefined or null
  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == ""){
    missed_fields.push("Enter first name");
  }
  // check if last name is empty, undefined or null
  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == ""){
    missed_fields.push("Enter last name");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missed_fields.push("Enter email");
  }
  // check if phone is empty, undefined or null
  if (req.body[0].phone == null || req.body[0].phone == undefined || req.body[0].phone == ""){
    missed_fields.push("Enter phone");
  }
  // check if amount is empty, undefined or null
  if (req.body[0].amount == null || req.body[0].amount == undefined || req.body[0].amount == ""){
    missed_fields.push("Enter amount");
  }
  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // check if user exists as a member
  pool.query("select mem_id from `members` where first_name=? and last_name=? and is_active=?", [req.body[0].first_name, req.body[0].last_name, "Y"], (err, data) => {
    // if user is a member, insert donation into donations table
    if (data.length > 0){
      pool.query("INSERT INTO `donations` (user_id, user_type, amount) VALUES (?,?,?)", [data[0].mem_id, "M", req.body[0].amount], (err, data) => {
        if (err){
            return res.status(400).json({"message": "Donation failed"});
        }
        return res.status(200).json({"message":"Donation successful"});
      });
    }
    // if user is not a member, insert donation into donations table
    else{
      // create entry in visitors table
      var visitor_id = 0;
      pool.query("INSERT INTO `visitors` (first_name, last_name, email, phone_no) VALUES (?,?,?,?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].email, req.body[0].phone], (err, data) => {
        if (err){
            return res.status(400).json({"message":"Donation failed"});
        }
        visitor_id = data.insertId;
        pool.query("INSERT INTO `donations` (user_id, user_type, amount) VALUES (?,?,?)", [visitor_id, "V", req.body[0].amount], (err, data) => {
          if (err){
              return res.status(400).json({"message":"Donation failed"});
          }
          return res.status(200).json({"message":"Donation successful"});
        });
      });
    }
  });
} );

// get total donations for a member
app.get("/getDonations/:id",(req,res) => {
  pool.query("SELECT sum(amount) as total_donations FROM `master_transactions` where tran_type=? and user_id=?", ["donation",req.params.id], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Error in getting donations"});
    }
    return res.status(200).json({"message":"Donations fetched successfully", "data": data});
  });
});

// buy entry ticket
app.post("/buyEntryTicket/",(req,res) => {
  let missed_fields = [];
  // check if first name is empty, undefined or null
  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == ""){
    missed_fields.push("Enter first name");
  }
  // check if last name is empty, undefined or null
  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == ""){
    missed_fields.push("Enter last name");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missed_fields.push("Enter email");
  }
  // check if phone is empty, undefined or null
  if (req.body[0].phone == null || req.body[0].phone == undefined || req.body[0].phone == ""){
    missed_fields.push("Enter phone");
  }

  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // check if child_count is empty, undefined or null
  if (req.body[0].child_count == null || req.body[0].child_count == undefined || req.body[0].child_count == ""){
    req.body[0].child_count = 0;
  }
  // check if adult_count is empty, undefined or null
  if (req.body[0].adult_count == null || req.body[0].adult_count == undefined || req.body[0].adult_count == ""){
    req.body[0].adult_count = 0;
  }
  // check if senior_count is empty, undefined or null
  if (req.body[0].senior_count == null || req.body[0].senior_count == undefined || req.body[0].senior_count == ""){
    req.body[0].senior_count = 0;
  }
  // check if child_price is empty, undefined or null
  if (req.body[0].child_price == null || req.body[0].child_price == undefined || req.body[0].child_price == ""){
    req.body[0].child_price = 0;
  }
  // check if adult_price is empty, undefined or null
  if (req.body[0].adult_price == null || req.body[0].adult_price == undefined || req.body[0].adult_price == ""){
    req.body[0].adult_price = 0;
  }
  // check if senior_price is empty, undefined or null
  if (req.body[0].senior_price == null || req.body[0].senior_price == undefined || req.body[0].senior_price == ""){
    req.body[0].senior_price = 0;
  }

  // calculate total amount
  var total_amount = req.body[0].child_count*req.body[0].child_price + req.body[0].adult_count*req.body[0].adult_price+req.body[0].senior_count*req.body[0].senior_price;
  var ticket_type = "entry";
  // check if user exists as a member
  pool.query("select mem_id from `members` where first_name=? and last_name=? and is_active=?", [req.body[0].first_name, req.body[0].last_name, "Y"], (err, data) => {
    // if user is a member, insert ticket into tickets table
    if (data.length > 0){
      pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, child_price, adult_price, senior_price, total_amount, user_id, user_type) VALUES (?,?,?,?,?,?,?,?,?,?)", [ ticket_type, req.body[0].child_count, req.body[0].adult_count, req.body[0].senior_count, req.body[0].child_price, req.body[0].adult_price, req.body[0].senior_price, total_amount, data[0].mem_id, "M"], (err, data) => {
        if (err){
            return res.status(400).json({"message": "Ticket purchase failed"});
        }
        return res.status(200).json({"message":"Ticket purchase successful"});
      });
    }
    // if user is not a member, insert ticket into tickets table
    else{
      // create entry in visitors table
      var visitor_id = 0;
      pool.query("INSERT INTO `visitors` (first_name, last_name, email, phone_no) VALUES (?,?,?,?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].email, req.body[0].phone], (err, data) => {
        if (err){
            return res.status(400).json({"message":"Ticket purchase failed"});
        }
        visitor_id = data.insertId;
        pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, child_price, adult_price, senior_price, total_amount, user_id, user_type) VALUES (?,?,?,?,?,?,?,?,?,?)", [ ticket_type, req.body[0].child_count, req.body[0].adult_count, req.body[0].senior_count, req.body[0].child_price, req.body[0].adult_price, req.body[0].senior_price, total_amount, visitor_id, "V"], (err, data) => {
          if (err){
              return res.status(400).json({"message":"Ticket purchase failed"});
          }
          return res.status(200).json({"message":"Ticket purchase successful"});
        });
      });
    }
  });
});

// buy show ticket
app.post("/buyShowTicket/",(req,res) => {
  let missed_fields = [];
  // check if first name is empty, undefined or null
  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == ""){
    missed_fields.push("Enter first name");
  }
  // check if last name is empty, undefined or null
  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == ""){
    missed_fields.push("Enter last name");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missed_fields.push("Enter email");
  }
  // check if phone is empty, undefined or null
  if (req.body[0].phone == null || req.body[0].phone == undefined || req.body[0].phone == ""){
    missed_fields.push("Enter phone");
  }

  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // check if child_count is empty, undefined or null
  if (req.body[0].child_count == null || req.body[0].child_count == undefined || req.body[0].child_count == ""){
    req.body[0].child_count = 0;
  }
  // check if adult_count is empty, undefined or null
  if (req.body[0].adult_count == null || req.body[0].adult_count == undefined || req.body[0].adult_count == ""){
    req.body[0].adult_count = 0;
  }
  // check if senior_count is empty, undefined or null
  if (req.body[0].senior_count == null || req.body[0].senior_count == undefined || req.body[0].senior_count == ""){
    req.body[0].senior_count = 0;
  }
  // check if child_price is empty, undefined or null
  if (req.body[0].child_price == null || req.body[0].child_price == undefined || req.body[0].child_price == ""){
    req.body[0].child_price = 0;
  }
  // check if adult_price is empty, undefined or null
  if (req.body[0].adult_price == null || req.body[0].adult_price == undefined || req.body[0].adult_price == ""){
    req.body[0].adult_price = 0;
  }
  // check if senior_price is empty, undefined or null
  if (req.body[0].senior_price == null || req.body[0].senior_price == undefined || req.body[0].senior_price == ""){
    req.body[0].senior_price = 0;
  }

  // calculate total amount
  var total_amount = req.body[0].child_count*req.body[0].child_price + req.body[0].adult_count*req.body[0].adult_price+req.body[0].senior_count*req.body[0].senior_price;
  var ticket_type = "show";
  // check if user exists as a member
  pool.query("select mem_id from `members` where first_name=? and last_name=? and is_active=?", [req.body[0].first_name, req.body[0].last_name, "Y"], (err, data) => {
    // if user is a member, insert ticket into tickets table
    if (data.length > 0){
      pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, child_price, adult_price, senior_price, total_amount, user_id, user_type) VALUES (?,?,?,?,?,?,?,?,?,?)", [ ticket_type, req.body[0].child_count, req.body[0].adult_count, req.body[0].senior_count, req.body[0].child_price, req.body[0].adult_price, req.body[0].senior_price, total_amount, data[0].mem_id, "M"], (err, data) => {
        if (err){
            return res.status(400).json({"message": "Ticket purchase failed"});
        }
        return res.status(200).json({"message":"Ticket purchase successful"});
      });
    }
    // if user is not a member, insert ticket into tickets table
    else{
      // create entry in visitors table
      var visitor_id = 0;
      pool.query("INSERT INTO `visitors` (first_name, last_name, email, phone_no) VALUES (?,?,?,?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].email, req.body[0].phone], (err, data) => {
        if (err){
            return res.status(400).json({"message":"Ticket purchase failed"});
        }
        visitor_id = data.insertId;
        pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, child_price, adult_price, senior_price, total_amount, user_id, user_type) VALUES (?,?,?,?,?,?,?,?,?,?)", [ ticket_type, req.body[0].child_count, req.body[0].adult_count, req.body[0].senior_count, req.body[0].child_price, req.body[0].adult_price, req.body[0].senior_price, total_amount, visitor_id, "V"], (err, data) => {
          if (err){
              return res.status(400).json({"message":"Ticket purchase failed"});
          }
          return res.status(200).json({"message":"Ticket purchase successful"});
        });
      });
    }
  });
});

// buy exhibition ticket
app.post("/buyExhibitionTicket/",(req,res) => {
  // check if all required fields are present
  let missed_fields = [];
  // check if first name is empty, undefined or null
  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == ""){
    missed_fields.push("Enter first name");
  }
  // check if last name is empty, undefined or null
  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == ""){
    missed_fields.push("Enter last name");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missed_fields.push("Enter email");
  }
  // check if phone is empty, undefined or null
  if (req.body[0].phone == null || req.body[0].phone == undefined || req.body[0].phone == ""){
    missed_fields.push("Enter phone");
  }

  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // check if child_count is empty, undefined or null
  if (req.body[0].child_count == null || req.body[0].child_count == undefined || req.body[0].child_count == ""){
    req.body[0].child_count = 0;
  }
  // check if adult_count is empty, undefined or null
  if (req.body[0].adult_count == null || req.body[0].adult_count == undefined || req.body[0].adult_count == ""){
    req.body[0].adult_count = 0;
  }
  // check if senior_count is empty, undefined or null
  if (req.body[0].senior_count == null || req.body[0].senior_count == undefined || req.body[0].senior_count == ""){
    req.body[0].senior_count = 0;
  }
  // check if child_price is empty, undefined or null
  if (req.body[0].child_price == null || req.body[0].child_price == undefined || req.body[0].child_price == ""){
    req.body[0].child_price = 0;
  }
  // check if adult_price is empty, undefined or null
  if (req.body[0].adult_price == null || req.body[0].adult_price == undefined || req.body[0].adult_price == ""){
    req.body[0].adult_price = 0;
  }
  // check if senior_price is empty, undefined or null
  if (req.body[0].senior_price == null || req.body[0].senior_price == undefined || req.body[0].senior_price == ""){
    req.body[0].senior_price = 0;
  }
  // calculate total amount
  var total_amount = req.body[0].child_count*req.body[0].child_price + req.body[0].adult_count*req.body[0].adult_price+req.body[0].senior_count*req.body[0].senior_price;
  var ticket_type = "exhibition";
  // check if user exists as a member
  pool.query("select mem_id from `members` where first_name=? and last_name=? and is_active=?", [req.body[0].first_name, req.body[0].last_name, "Y"], (err, data) => {
    // if user is a member, insert ticket into tickets table
    if (data.length > 0){
      pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, child_price, adult_price, senior_price, total_amount, user_id, user_type) VALUES (?,?,?,?,?,?,?,?,?,?)", [ ticket_type, req.body[0].child_count, req.body[0].adult_count, req.body[0].senior_count, req.body[0].child_price, req.body[0].adult_price, req.body[0].senior_price, total_amount, data[0].mem_id, "M"], (err, data) => {
        if (err){
            return res.status(400).json({"message": "Ticket purchase failed"});
        }
        return res.status(200).json({"message":"Ticket purchase successful"});
      });
    }
    // if user is not a member, insert ticket into tickets table
    else{
      // create entry in visitors table
      var visitor_id = 0;
      pool.query("INSERT INTO `visitors` (first_name, last_name, email, phone_no) VALUES (?,?,?,?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].email, req.body[0].phone], (err, data) => {
        if (err){
            return res.status(400).json({"message":"Ticket purchase failed"});
        }
        visitor_id = data.insertId;
        pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, child_price, adult_price, senior_price, total_amount, user_id, user_type) VALUES (?,?,?,?,?,?,?,?,?,?)", [ ticket_type, req.body[0].child_count, req.body[0].adult_count, req.body[0].senior_count, req.body[0].child_price, req.body[0].adult_price, req.body[0].senior_price, total_amount, visitor_id, "V"], (err, data) => {
          if (err){
              return res.status(400).json({"message":"Ticket purchase failed"});
          }
          return res.status(200).json({"message":"Ticket purchase successful"});
        });
      });
    }
  });
});

// post request to save contact us form data
app.post('/contactus', (req, res) => {
  // check if all required fields are present
  let missed_fields = [];
  // check if name is empty, undefined or null
  if (req.body[0].name == null || req.body[0].name == undefined || req.body[0].name == ""){
    missed_fields.push("Enter name");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missed_fields.push("Enter email");
  }
  // check if subject is empty, undefined or null
  if (req.body[0].subject == null || req.body[0].subject == undefined || req.body[0].subject == ""){
    missed_fields.push("Enter subject");
  }
  // check if description is empty, undefined or null
  if (req.body[0].description == null || req.body[0].description == undefined || req.body[0].description == ""){
    missed_fields.push("Enter description");
  }
  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // insert contact us form data into contact_us table
  pool.query("INSERT INTO `contact_us` (name, email, subject, description) VALUES (?,?,?,?)", [req.body[0].name, req.body[0].email, req.body[0].subject, req.body[0].description], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Contact us form submission failed"});
    }
    return res.status(200).json({"message":"Contact us form submission successful"});
  });
});