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

  pool.query("SELECT * FROM `objects` where `obj_id` == ?", [req.params.id], (err, data) => {
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
app.get("/getArtsCol/",(req,res) => {
  console.log(req.query,req.params)
  pool.query("SELECT * FROM `objects` where `obj_class` = ?", [req.query.type], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };

    res.send(data);
  });

});

/*Api for Search by name for fetching collections 
Example: localhost:3000/searchName/
POST REQUEST
request body = {
  "name": "fpl"
}
*/
app.get("/searchName/",(req,res) => {
  pool.query("select * from `objects` where `obj_title` like ?", [`%${req.query.name}%`], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };

    res.send(data);
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
  pool.query("select * from objects where obj_title like ? or obj_medium like ? or obj_inscription like ?", [`%${req.query.key}%`,`%${req.query.key}%`,`%${req.query.key}%`], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };

    res.send(data);
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
  pool.query("select * from `objects` where `price` between ? and ?", [parseInt(req.query.from),parseInt(req.query.to)], (err, data) => {
    if (err){ 
        console.log(err);
        throw(err);
    };

    res.send(data);
  });

});

//add a new art
app.post("/addArt/",(req,res) => {
  console.log(req.body);
  pool.query("insert into `objects` (`obj_title`, `obj_beginyear`, `obj_endyear`, `obj_medium`, `obj_dimensions`, `obj_inscription`, `obj_attribution`, `obj_class`, `loc_site`, `loc_room`, `loc_description`, `img_url`, `price`) values (?,?,?,?,?,?,?,?,?,?,?,?,?)", [req.body[0].obj_title, req.body[0].obj_beginyear, req.body[0].obj_endyear, req.body[0].obj_medium, req.body[0].obj_dimensions,req.body[0].obj_inscription,req.body[0].obj_attribution,req.body[0].obj_class,req.body[0].loc_site,req.body[0].loc_room,req.body[0].loc_description,req.body[0].img_url,req.body[0].price], (err, data) => {
    if (err){
        console.log(err);
        throw(err);
    }
    res.send(data);
  });

} );



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
    return res.status(404).json({message: missed_fields});
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
