const express = require("express");
const mysql = require("mysql");
const path = require('path');
const bodyParser = require('body-parser');
const { response } = require("express");
const { resolve } = require("path");

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





/*************Group 4 start *************/
/*
API to get all art collections from database to display on UI
*/
app.get("/getArts/",(req,res) => {
  pool.query("SELECT * FROM `objects`", (err, data) => {
    if (err){ 
        console.log(err);
        res.status(400).send("Backend Issue. Please reload the page");
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

    res.status(200).send(result);
  });

});

/*
API to get a paritcular art details from database where id is sent as URL parameter
Example: localhost:3000/getArt?id=10
GET REQUEST
*/
app.get("/getArt/",(req,res) => {
  //validation
  let missed = [];
  
  if (req.query.id == null || req.query.id == undefined || req.query.id == "" || !Number.isInteger(parseInt(req.query.id))) {
    missed.push("Invalid id!");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }
  
  pool.query("SELECT * FROM `objects` where `obj_id` = ?", [parseInt(req.query.id)], (err, data) => {
    if (err){ 
        console.log(err);
        res.status(400).send("Failed fetching the Art details");
    };

    res.status(200).send(data);
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
        res.status(400).send("Fetching Arts by type failed");
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

      res.status(200).send(result);
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
        res.status(400).send("Fetching arts by keyword failed");
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

      res.status(200).send(result);
  });

});

/*Api for Search by Name for fetching collections
Example: localhost:3000/searchName/

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
        res.status(400).send("Fetching arts by Author name failed");
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

      res.status(200).send(result);
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
        res.status(400).send("Fetching arts by price failed");
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

      res.status(200).send(result);

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
        res.status(400).send("Failed adding new Art");
    }
    res.status(200).send(data);
  });

} );

//Buy Art
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

    }

    if(data.length > 0 && data[0].obj_id > 0){
      pool.query("insert into `shop_transactions` (`obj_oid`, `total_amount`, `user_id`, `user_type`, `purchase_date`) values (?,?,?,?,?)", [data[0].obj_id, data[0].price, req.body.user_id, req.body.user_type, new Date()], (err, data) => {
        if (err){
            console.log(err);
            res.status(400).send(missed);
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
/*************Group 4 End *************/

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

// create show
app.post('/createshow', (req, res) => {
  // check if all required fields are present
  let missed_fields = [];
  // check if ev_name is empty, undefined or null
  if (req.body[0].ev_name == null || req.body[0].ev_name == undefined || req.body[0].ev_name == ""){
    missed_fields.push("Enter show name");
  }
  // check if ev_date is empty, undefined or null
  if (req.body[0].ev_date == null || req.body[0].ev_date == undefined || req.body[0].ev_date == ""){
    missed_fields.push("Enter show date");
  }
  // check if ev_description is empty, undefined or null
  if (req.body[0].ev_description == null || req.body[0].ev_description == undefined || req.body[0].ev_description == ""){
    missed_fields.push("Enter show description");
  }
  // check if ev_site is empty, undefined or null
  if (req.body[0].ev_site == null || req.body[0].ev_site == undefined || req.body[0].ev_site == ""){
    missed_fields.push("Enter show site");
  }
  // check if ev_room_no is empty, undefined or null
  if (req.body[0].ev_room_no == null || req.body[0].ev_room_no == undefined || req.body[0].ev_room_no == ""){
    missed_fields.push("Enter show room number");
  }
  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // insert show data into events table
  pool.query("INSERT INTO `events` (ev_name, ev_date, ev_description, ev_site, ev_room_no, ev_type) VALUES (?,?,?,?,?,?)", [req.body[0].ev_name, req.body[0].ev_date, req.body[0].ev_description, req.body[0].ev_site, req.body[0].ev_room_no, "show"], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Show creation failed"});
    }
    return res.status(200).json({"message":"Show created successfully"});
  });
});

// create exhibition
app.post('/createexhibition', (req, res) => {
  // check if all required fields are present
  let missed_fields = [];
  // check if ev_name is empty, undefined or null
  if (req.body[0].ev_name == null || req.body[0].ev_name == undefined || req.body[0].ev_name == ""){
    missed_fields.push("Enter exhibition name");
  }
  // check if ev_date is empty, undefined or null
  if (req.body[0].ev_date == null || req.body[0].ev_date == undefined || req.body[0].ev_date == ""){
    missed_fields.push("Enter exhibition date");
  }
  // check if ev_description is empty, undefined or null
  if (req.body[0].ev_description == null || req.body[0].ev_description == undefined || req.body[0].ev_description == ""){
    missed_fields.push("Enter exhibition description");
  }
  // check if ev_site is empty, undefined or null
  if (req.body[0].ev_site == null || req.body[0].ev_site == undefined || req.body[0].ev_site == ""){
    missed_fields.push("Enter exhibition site");
  }
  // check if ev_room_no is empty, undefined or null
  if (req.body[0].ev_room_no == null || req.body[0].ev_room_no == undefined || req.body[0].ev_room_no == ""){
    missed_fields.push("Enter exhibition room number");
  }
  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // insert exhibition data into events table
  pool.query("INSERT INTO `events` (ev_name, ev_date, ev_description, ev_site, ev_room_no, ev_type) VALUES (?,?,?,?,?,?)", [req.body[0].ev_name, req.body[0].ev_date, req.body[0].ev_description, req.body[0].ev_site, req.body[0].ev_room_no, "exhibition"], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Exhibition creation failed"});
    }
    return res.status(200).json({"message":"Exhibition created successfully"});
  });
});

// create auction
app.post('/createauction', (req, res) => {
  // check if all required fields are present
  let missed_fields = [];
  // check if ev_name is empty, undefined or null
  if (req.body[0].ev_name == null || req.body[0].ev_name == undefined || req.body[0].ev_name == ""){
    missed_fields.push("Enter auction name");
  }
  // check if ev_date is empty, undefined or null
  if (req.body[0].ev_date == null || req.body[0].ev_date == undefined || req.body[0].ev_date == ""){
    missed_fields.push("Enter auction date");
  }
  // check if ev_description is empty, undefined or null
  if (req.body[0].ev_description == null || req.body[0].ev_description == undefined || req.body[0].ev_description == ""){
    missed_fields.push("Enter auction description");
  }
  // check if ev_site is empty, undefined or null
  if (req.body[0].ev_site == null || req.body[0].ev_site == undefined || req.body[0].ev_site == ""){
    missed_fields.push("Enter auction site");
  }
  // check if ev_room_no is empty, undefined or null
  if (req.body[0].ev_room_no == null || req.body[0].ev_room_no == undefined || req.body[0].ev_room_no == ""){
    missed_fields.push("Enter auction room number");
  }
  if (missed_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // insert auction data into events table
  pool.query("INSERT INTO `events` (ev_name, ev_date, ev_description, ev_site, ev_room_no, ev_type) VALUES (?,?,?,?,?,?)", [req.body[0].ev_name, req.body[0].ev_date, req.body[0].ev_description, req.body[0].ev_site, req.body[0].ev_room_no, "auction"], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Auction creation failed"});
    }
    return res.status(200).json({"message":"Auction created successfully"});
  });
});

// update member details by id
app.post('/updatememberdetails/:id', (req, res) => {
  // get old member details
  var old_details = null;
  pool.query("SELECT * FROM `members` WHERE mem_id = ?", [req.params.id], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Member details retrieval failed"});
    }
    old_details=data[0];
  });
  // get old login details
  var old_login = null;
  pool.query("SELECT username, password from login where user_id = ? and user_type = ?",[req.params.id, "M"], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Member details retrieval failed"});
    }
    old_login=data[0];
  });
  var update_details = {};
  // check if phone_no is empty, undefined or null
  if (req.body[0].phone_no == null || req.body[0].phone_no == undefined || req.body[0].phone_no == ""){
    update_details["phone_no"]=old_details.phone_no;
  }else{
    update_details["phone_no"]=req.body[0].phone_no;
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    update_details["email"]=old_details.email;
  }else{
    update_details["email"]=req.body[0].email;
  }
  // check if address1 is empty, undefined or null
  if (req.body[0].address1 == null || req.body[0].address1 == undefined || req.body[0].address1 == ""){
    update_details["address1"]=old_details.address1;
  }else{
    update_details["address1"]=req.body[0].address1;
  }
  // check if address2 is empty, undefined or null
  if (req.body[0].address2 == null || req.body[0].address2 == undefined || req.body[0].address2 == ""){
    update_details["address2"]=old_details.address2;
  }else{
    update_details["address2"]=req.body[0].address2;
  }
  // check if city is empty, undefined or null
  if (req.body[0].city == null || req.body[0].city == undefined || req.body[0].city == ""){
    update_details["city"]=old_details.city;
  }else{
    update_details["city"]=req.body[0].city;
  }
  // check if state is empty, undefined or null
  if (req.body[0].state == null || req.body[0].state == undefined || req.body[0].state == ""){
    update_details["state"]=old_details.state;
  }else{
    update_details["state"]=req.body[0].state;
  }
  // check if zipcode is empty, undefined or null
  if (req.body[0].zipcode == null || req.body[0].zipcode == undefined || req.body[0].zipcode == ""){
    update_details["zipcode"]=old_details.zipcode;
  }else{
    update_details["zipcode"]=req.body[0].zipcode;
  }
  // check if username is empty, undefined or null
  if (req.body[0].username == null || req.body[0].username == undefined || req.body[0].username == ""){
    update_details["username"]=old_login.username;
  }else{
    update_details["username"]=req.body[0].username;
  }
  // check if password is empty, undefined or null
  if (req.body[0].password == null || req.body[0].password == undefined || req.body[0].password == ""){
    update_details["password"]=old_login.password;
  }else{
    update_details["password"]=req.body[0].password;
  }
  // update member personal details
  pool.query("UPDATE `members` SET phone_no = ?, email = ?, address1 = ?, address2 = ?, city = ?, state = ?, zipcode = ? WHERE mem_id = ?", [update_details["phone_no"], update_details["email"], update_details["address1"], update_details["address2"], update_details["city"], update_details["state"], update_details["zipcode"], req.params.id], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Member details update failed"});
    }
  });
  // update member login details
  pool.query("UPDATE `login` SET username = ?, password = ? WHERE user_id = ? and user_type = ?", [update_details["username"], update_details["password"], req.params.id, "M"], (err, data) => {
    if (err){
        return res.status(400).json({"message":"Member details update failed"});
    }
  });
  return res.status(200).json({"message":"Member details updated successfully"});
});

// register member
app.post('/registermember', (req, res) => {
  // check missing fields
  let missing_fields = [];
  // check if first name is empty, undefined or null
  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == ""){
    missing_fields.push("first_name");
  }
  // check if last name is empty, undefined or null
  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == ""){
    missing_fields.push("last_name");
  }
  // check if phone number is empty, undefined or null
  if (req.body[0].phone_no == null || req.body[0].phone_no == undefined || req.body[0].phone_no == ""){
    missing_fields.push("phone_no");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missing_fields.push("email");
  }
  // check if address1 is empty, undefined or null
  if (req.body[0].address1 == null || req.body[0].address1 == undefined || req.body[0].address1 == ""){
    missing_fields.push("address1");
  }
  // check if city is empty, undefined or null
  if (req.body[0].city == null || req.body[0].city == undefined || req.body[0].city == ""){
    missing_fields.push("city");
  }
  // check if state is empty, undefined or null
  if (req.body[0].state == null || req.body[0].state == undefined || req.body[0].state == ""){
    missing_fields.push("state");
  }
  // check if zipcode is empty, undefined or null
  if (req.body[0].zipcode == null || req.body[0].zipcode == undefined || req.body[0].zipcode == ""){
    missing_fields.push("zipcode");
  }
  // check if username is empty, undefined or null
  if (req.body[0].username == null || req.body[0].username == undefined || req.body[0].username == ""){
    missing_fields.push("username");
  }
  // check if password is empty, undefined or null
  if (req.body[0].password == null || req.body[0].password == undefined || req.body[0].password == ""){
    missing_fields.push("password");
  }
  if (missing_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // check if username already exists
  pool.query("SELECT * FROM `login` WHERE username = ?", [req.body[0].username], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Username already exists"});
    }
  });
  // insert into members table
  pool.query("INSERT INTO `members` (first_name, last_name, phone_no, email, address1, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].phone_no, req.body[0].email, req.body[0].address1, req.body[0].address2, req.body[0].city, req.body[0].state, req.body[0].zipcode], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Member registration failed"});
    }
    var member_id = data.insertId;
    // insert into login table
    pool.query("INSERT INTO `login` (username, password, user_type, user_id) VALUES (?, ?, ?, ?)", [req.body[0].username, req.body[0].password, "M", member_id], (err, data) => {
      if (err){
        return res.status(400).json({"message":"Member registration failed"});
      }
    });
  });
  // insert into master_transactions table
  pool.query("insert into master_transactions (tran_type, user_id, user_type, purchase_date, amount) values (?,?,?,?,?)", ["membership", member_id, "M", new Date(), req.body[0].amount], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Member registration failed"});
    }
  });
  return res.status(200).json({"message":"Member registration successful"});
});

// create employee
app.post('/createemployee', (req, res) => {
  // check missing fields
  let missing_fields = [];
  // check if first name is empty, undefined or null
  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == ""){
    missing_fields.push("first_name");
  }
  // check if last name is empty, undefined or null
  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == ""){
    missing_fields.push("last_name");
  }
  // check if phone number is empty, undefined or null
  if (req.body[0].phone_no == null || req.body[0].phone_no == undefined || req.body[0].phone_no == ""){
    missing_fields.push("phone_no");
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    missing_fields.push("email");
  }
  // check if address1 is empty, undefined or null
  if (req.body[0].address1 == null || req.body[0].address1 == undefined || req.body[0].address1 == ""){
    missing_fields.push("address1");
  }
  // check if city is empty, undefined or null
  if (req.body[0].city == null || req.body[0].city == undefined || req.body[0].city == ""){
    missing_fields.push("city");
  }
  // check if state is empty, undefined or null
  if (req.body[0].state == null || req.body[0].state == undefined || req.body[0].state == ""){
    missing_fields.push("state");
  }
  // check if zipcode is empty, undefined or null
  if (req.body[0].zipcode == null || req.body[0].zipcode == undefined || req.body[0].zipcode == ""){
    missing_fields.push("zipcode");
  }
  // check if username is empty, undefined or null
  if (req.body[0].username == null || req.body[0].username == undefined || req.body[0].username == ""){
    missing_fields.push("username");
  }
  // check if password is empty, undefined or null
  if (req.body[0].password == null || req.body[0].password == undefined || req.body[0].password == ""){
    missing_fields.push("password");
  }
  if (missing_fields.length > 0){
    return res.status(400).json({message: missed_fields});
  }
  // check if username already exists
  pool.query("SELECT * FROM `login` WHERE username = ?", [req.body[0].username], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Username already exists"});
    }
  });
  // insert into employees table
  pool.query("INSERT INTO `employees` (first_name, last_name, phone_no, email, address1, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].phone_no, req.body[0].email, req.body[0].address1, req.body[0].address2, req.body[0].city, req.body[0].state, req.body[0].zipcode], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Employee registration failed"});
    }
    var employee_id = data.insertId;
    // insert into login table
    pool.query("INSERT INTO `login` (username, password, user_type, user_id) VALUES (?, ?, ?, ?)", [req.body[0].username, req.body[0].password, "E", employee_id], (err, data) => {
      if (err){
        return res.status(400).json({"message":"Employee registration failed"});
      }
    });
  });
  return res.status(200).json({"message":"Employee registration successful"});
});

// update employee details by id
app.post('/updateemployee/:id', (req, res) => {
  // get old employee details
  var old_details = null;
  pool.query("SELECT * FROM `employees` WHERE employee_id = ?", [req.params.id], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Employee details update failed"});
    }
    old_details = data[0];
  });
  // get old login details
  var old_login_details = null;
  pool.query("SELECT * FROM `login` WHERE user_id = ? AND user_type = ?", [req.params.id, "E"], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Employee details update failed"});
    }
    old_login_details = data[0];
  });
  var update_details = {};
  // check if phone number is empty, undefined or null
  if (req.body[0].phone_no == null || req.body[0].phone_no == undefined || req.body[0].phone_no == ""){
    update_details["phone_no"] = old_details.phone_no;
  } else {
    update_details["phone_no"] = req.body[0].phone_no;
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    update_details["email"] = old_details.email;
  } else {
    update_details["email"] = req.body[0].email;
  }
  // check if address1 is empty, undefined or null
  if (req.body[0].address1 == null || req.body[0].address1 == undefined || req.body[0].address1 == ""){
    update_details["address1"] = old_details.address1;
  } else {
    update_details["address1"] = req.body[0].address1;
  }
  // check if address2 is empty, undefined or null
  if (req.body[0].address2 == null || req.body[0].address2 == undefined || req.body[0].address2 == ""){
    update_details["address2"] = old_details.address2;
  } else {
    update_details["address2"] = req.body[0].address2;
  }
  // check if city is empty, undefined or null
  if (req.body[0].city == null || req.body[0].city == undefined || req.body[0].city == ""){
    update_details["city"] = old_details.city;
  } else {
    update_details["city"] = req.body[0].city;
  }
  // check if state is empty, undefined or null
  if (req.body[0].state == null || req.body[0].state == undefined || req.body[0].state == ""){
    update_details["state"] = old_details.state;
  } else {
    update_details["state"] = req.body[0].state;
  }
  // check if zipcode is empty, undefined or null
  if (req.body[0].zipcode == null || req.body[0].zipcode == undefined || req.body[0].zipcode == ""){
    update_details["zipcode"] = old_details.zipcode;
  } else {
    update_details["zipcode"] = req.body[0].zipcode;
  }
  // check if username is empty, undefined or null
  if (req.body[0].username == null || req.body[0].username == undefined || req.body[0].username == ""){
    update_details["username"] = old_login_details.username;
  } else {
    update_details["username"] = req.body[0].username;
  }
  // check if password is empty, undefined or null
  if (req.body[0].password == null || req.body[0].password == undefined || req.body[0].password == ""){
    update_details["password"] = old_login_details.password;
  } else {
    update_details["password"] = req.body[0].password;
  }
  // update employees table
  pool.query("UPDATE `employees` SET phone_no = ?, email = ?, address1 = ?, address2 = ?, city = ?, state = ?, zipcode = ? WHERE employee_id = ?", [update_details.phone_no, update_details.email, update_details.address1, update_details.address2, update_details.city, update_details.state, update_details.zipcode, req.params.id], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Employee details update failed"});
    }
  });
  // update login table
  pool.query("UPDATE `login` SET username = ?, password = ? WHERE user_id = ? AND user_type = ?", [update_details.username, update_details.password, req.params.id, "E"], (err, data) => {
    if (err){
      return res.status(400).json({"message":"Employee details update failed"});
    }
  });
  return res.status(200).json({"message":"Employee details update successful"});
});

// check login validation
app.post('/checklogin', (req, res) => {
  pool.query("select * from login where username = ? and password = ?",[req.body.username, req.body.password] , (err, data) => {
    if (err){
      return res.status(400).json({"message":"Login failed"});
    }
    if (data.length == 0){
      return res.status(400).json({"message":"invalid username or password"});
    }
    if (data[0].user_type == "E"){
      pool.query("select * from employees where emp_id = ? and is_active = ?",[data[0].user_id, "Y"], (err, data) => {
        if (err){
          return res.status(400).json({"message":"Login failed"});
        }
        if (data.length == 0){
          return res.status(400).json({"message":"account not active"});
        }
        return res.status(200).json(data);
      });
    } else {
      pool.query("select * from members where mem_id = ? and is_active = ?",[data[0].user_id, "Y"], (err, data) => {
        if (err){
          return res.status(400).json({"message":"Login failed"});
        }
        if (data.length == 0){
          return res.status(400).json({"message":"account not active"});
        }
        return res.status(200).json(data);
      });
    }
  });
});

/*
  Below section of code consists of all the necessary helper functions
*/
//====================================================================================================
getMemPersonalDetails = (mem_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select * from members where mem_id = ?",[mem_id], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data[0]);
    });
  });
}

getMemLoginDetails = (mem_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select * from login where user_id = ? and user_type = ?",[mem_id, "M"], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data[0]);
    });
  });
}

getUpComingEmployeeEvents = (emp_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select e.ev_name as name, e.ev_date as event_date, e.ev_site as site, e.ev_room_no as room_no from db_se_567.events e join db_se_567.event_employee_map em on e.ev_id = em.ev_id where em.ev_id = ? and e.ev_date>=curdate() order by e.ev_date limit 5",[emp_id], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getUpComingMemberEvents = (mem_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select e.ev_name as name, upper(e.ev_type) as type, e.ev_date as event_date, e.ev_site as site, e.ev_room_no as room_no from db_se_567.events e join db_se_567.ticket_transactions t on e.ev_id = t.ev_id where t.user_type=? and t.user_id=? and e.ev_type in (?,?,?) and e.ev_date>=curdate() order by e.ev_date limit 5", ["M", mem_id, "show", "exhibition", "auction"], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getLastPurchasedTickets = (mem_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select case e.ev_name when null then 'Entry Ticket' else e.ev_name end as ticket_for, t.total_amount as amount, t.purchase_date as purchase_date from db_se_567.ticket_transactions t join db_se_567.events e on t.ev_id = e.ev_id where t.user_id = ? and t.user_type = ? order by t.purchase_date desc limit=5",[mem_id,"M"], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getLastPurchasedArts = (mem_id) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT select o.obj_title as title, s.total_amount as amount, s.purchase_date as purchase_date from db_se_567.shop_transactions s join db_se_567.sold_objects o on s.shop_id=o.shop_id and s.obj_oid=o.obj_id where s.user_id = ? and s.user_type= ? order by s.purchase_date desc limit=5",[mem_id,"M"], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getEventDetails = (ev_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_id=?",[ev_id],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data[0]);
    });
  });
}

getCurrentAuctions = () => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_date >= curdate() and ev_type=?",["auction"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getCurrentExhibitions = () => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_date >= curdate() and ev_type=?",["exhibition"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getCurrentShows = () => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_date >= curdate() and ev_type=?",["show"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getPastShows = () => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_date < curdate() and ev_type=?",["show"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getPastExhibitions = () => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_date < curdate() and ev_type=?",["exhibition"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getPastAuctions = () => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `events` where ev_date < curdate() and ev_type=?",["auction"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

//====================================================================================================

/*
  Below section of code consists of all the necessary get api calls
*/
//==================================================================================================
app.get("/getmemberdetails/:id", async (req, res) => {
  try {
    const personal = await getMemPersonalDetails(parseInt(req.params.id));
    const login = await getMemLoginDetails(parseInt(req.params.id));
    if (personal && login) {
      const details = {
        "personal": personal,
        "login": login
      }
      return res.status(200).json(details);
    }
    return res.status(400).json({"message":"Member details not found"});
  }catch(err){
    return res.status(400).json({"message":"Member details not found"});
  }
});

// get upcoming events for employee
app.get('/getupcomingemployeeevents/:id', async (req, res) => {
  try {
    const events = await getUpComingEmployeeEvents(parseInt(req.params.id));
    if (events){
      return res.status(200).json(events);
    }
    return res.status(400).json({"message":"No upcoming events"});
  }catch(err){
    return res.status(400).json({"message":"Upcoming events not found"});
  }
});

// get upcoming events for member
app.get('/getupcomingevents/:id', async (req, res) => {
  try{
    const events = await getUpComingMemberEvents(parseInt(req.params.id));
    if (events){
      return res.status(200).json(events);
    }
    return res.status(400).json({"message":"No upcoming events"});
  }catch(err){
    return res.status(400).json({"message":"Upcoming events not found"});
  }
});

// get last 5 purchased tickets
app.get('/getlastpurchasedtickets/:id', async (req, res) => {
  try{
    const tickets = await getLastPurchasedTickets(parseInt(req.params.id));
    if (tickets){
      return res.status(200).json(tickets);
    }
    return res.status(400).json({"message":"No tickets purchased"});
  }catch(err){
    return res.status(400).json({"message":"Tickets not found"});
  }
});

// get last 5 purchased arts
app.get('/getlastpurchasedarts/:id', async (req, res) => {
  try{
    const arts = await getLastPurchasedArts(parseInt(req.params.id));
    if (arts){
      return res.status(200).json(arts);
    }
    return res.status(400).json({"message":"No arts purchased"});
  }catch(err){
    return res.status(400).json({"message":"Arts not found"});
  }
});

// get event details by id
app.get('/eventdetails/:id', async (req, res) => {
  try{
    const event = await getEventDetails(parseInt(req.params.id));
    if (event){
      return res.status(200).json(event);
    }
    return res.status(400).json({"message":"Event not found"});
  }catch(err){
    return res.status(400).json({"message":"Event not found"});
  }
});

// get current or upcoming auctions
app.get('/currentauctions', async (req, res) => {
  try{
    const auctions = await getCurrentAuctions();
    if (auctions){
      return res.status(200).json(auctions);
    }
    return res.status(400).json({"message":"No auctions found"});
  }catch(err){
    return res.status(400).json({"message":"Auctions not found"});
  }
});

//get cuurent or upcoming exhibitions
app.get('/currentexhibitions', async (req, res) => {
  try{
    const exhibitions = await getCurrentExhibitions();
    if (exhibitions){
      return res.status(200).json(exhibitions);
    }
    return res.status(400).json({"message":"No exhibitions found"});
  }catch(err){
    return res.status(400).json({"message":"Exhibitions not found"});
  }
});

// get current or upcoming shows
app.get('/currentshows', async (req, res) => {
  try{
    const shows = await getCurrentShows();
    if (shows){
      return res.status(200).json(shows);
    }
    return res.status(400).json({"message":"No shows found"});
  }catch(err){
    return res.status(400).json({"message":"Shows not found"});
  }
});

// get past shows
app.get('/pastshows', async (req, res) => {
  try{
    const shows = await getPastShows();
    if (shows){
      return res.status(200).json(shows);
    }
    return res.status(400).json({"message":"No shows found"});
  }catch(err){
    return res.status(400).json({"message":"Shows not found"});
  }
});

// get past exhibitions
app.get('/pastexhibitions', async (req, res) => {
  try{
    const exhibitions = await getPastExhibitions();
    if (exhibitions){
      return res.status(200).json(exhibitions);
    }
    return res.status(400).json({"message":"No exhibitions found"});
  }catch(err){
    return res.status(400).json({"message":"Exhibitions not found"});
  }
});

// get past auctions
app.get('/pastauctions', async (req, res) => {
  try{
    const auctions = await getPastAuctions();
    if (auctions){
      return res.status(200).json(auctions);
    }
    return res.status(400).json({"message":"No auctions found"});
  }catch(err){
    return res.status(400).json({"message":"Auctions not found"});
  }
});

//==================================================================================================

/*
  Below section of code consists of all the necessary post api calls
*/
//==================================================================================================


//==================================================================================================