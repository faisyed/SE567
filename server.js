const express = require("express");
const mysql = require("mysql");
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { response } = require("express");
const { resolve } = require("path");
const axios = require('axios');
const nodemailer = require('nodemailer');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
var MySQLStore = require('express-mysql-session')(sessions);
const multer = require('multer');
var session = {};


var storage = multer.diskStorage({
  destination: function(req, file, cb) {
     cb(null, './src/images/new_art/');
  },
  filename: function (req, file, cb) {
     cb(null , file.originalname);
  }
});
var upload = multer({ storage: storage, limits : {fileSize : 10000000}, fileFilter:fileFilter }).single('art_image');

async function fileFilter (req, file, cb) {
  const filetypes = /jpeg|jpg|png/;
  const extname =  filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(cors());
const port = 3000;

//Connection to Mysql
const config = {
  host: "db-se-567.cx8txkcnxtfy.us-east-1.rds.amazonaws.com",
  port: 3306,
  database: "db_se_567",
  user: "admin",
  password: "database567"
}

var mailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: 'art.gallery.notifications@gmail.com',
      pass: 'aqxtcqmodcvtekbw'
  }
});


const pool = mysql.createPool(config);
var sessionStore = new MySQLStore({}, pool);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

pool.getConnection( (err, connection)=> {
  if (err) throw (err)
  console.log ("DB connected successful: " + connection.threadId)
})

// creating 1 hours from milliseconds
const oneHour = 1000 * 60 * 60;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyse567group4",
    saveUninitialized:true,
    store: sessionStore,
    cookie: { maxAge: oneHour },
    resave: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, './src')));


app.use(cookieParser());


app.get('/', (req, res) => {
  res.sendFile('./src/home.html', {root: __dirname});
});

app.get('/logout',(req,res) => {
  req.session.destroy();
  req.sessionStore.close();
  session.loggedin = false;
  session.user_id = null;
  session.user_type = null;

res.sendFile('./src/home.html', {root: __dirname});
});


/*************Group 4 start *************/
/*
API to get all art collections from database to display on UI
*/
app.get("/getArts/",(req,res) => {
  pool.query("SELECT * FROM `objects`", (err, data) => {
    if (err){ 
        console.error(err);
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
        console.error(err);
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
        console.error(err);
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
        console.error(err);
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
        console.error(err);
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
        console.error(err);
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


//Buy Art
app.post("/buyArt/", async (req,res) => {
  //validation
  let missed = [];

  if (req.query.id == null || req.query.id == undefined || req.query.id == "") {
      missed.push("id is required");
  }

  if (req.body[0].user_id == null || req.body[0].user_id == undefined || req.body[0].user_id == "") {
    missed.push("user_id is required");
  }

  if (req.body[0].user_type == null || req.body[0].user_type == undefined || req.body[0].user_type == "") {
    missed.push("user_type is required");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }

  pool.query("SELECT obj_id, price FROM `objects` where `obj_id` = ?", [parseInt(req.query.id)], (err,data) => {
    if(err){
      console.error(err);
      missed.push("id does not exist in the database");
      res.status(400).send(missed);

    }


    if(data.length > 0 && data[0].obj_id > 0){
      pool.query("insert into `shop_transactions` (`obj_oid`, `total_amount`, `user_id`, `user_type`, `purchase_date`) values (?,?,?,?,?)", [data[0].obj_id, data[0].price, req.body[0].user_id, req.body[0].user_type, new Date()], (err, data) => {
        if (err){
            console.error(err);
            res.status(400).send(missed);
        }
        res.status(200).send(data);
      });

      // delete from objects based on obj_id
      pool.query("delete from `objects` where `obj_id` = ?", [data[0].obj_id], (err, data) => { 
        if (err){
            console.error(err);
        }
      });
    }
    else{
      missed.push("id does not exist in the database");
      res.status(400).send(missed);
    }
  });

});


// @TODO Login to developer.paypal.com, create (or select an existing)
// developer application, and copy your client ID and secret here
const CLIENT_ID = "ATy14m-vcLvezTn1bLO9YDJtTe2dW-iGWntKl2rV9FGFcAB7G3OxoTBpihbH0cysw85Sqj8LOWppf4Mp";
const SECRET = "EOSvD1275Wx_TmJ382pp96U0dKrK1q9lhVwSK0TyiFOrOXTOpRjQ7HsxAfy0_WNQxZQgAsqX1URuLEzi";


async function getAccessToken() {
  const token = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");

  const { data } = await axios({
    url: "https://api.sandbox.paypal.com/v1/oauth2/token",
    method: "post",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${token}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    data: "grant_type=client_credentials"
  });

  return data;
}

async function getClientToken(accessToken) {
  const token = Buffer.from(accessToken).toString("base64");

  const { data } = await axios({
    url: "https://api.sandbox.paypal.com/v1/identity/generate-token",
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Accept-Language": "en_US"
    }
  });

  return data;
}

app.get("/loadPayPal", async (req, res) => {
  const { access_token } = await getAccessToken();
  const { client_token } = await getClientToken(access_token);

  let json = {
    "access_token": access_token,
    "client_token": client_token,
    "client_id": CLIENT_ID
  };

  res.status(200).send(json);
});


app.post("/create-order", async (req, res) => {
  if (req.query.pay == null || req.query.pay == undefined || req.query.pay == "") {
    res.status(400).send("Error");
  }


  try {
    const { access_token } = await getAccessToken();
    const { client_token } = await getClientToken(access_token);

    // For more details on /v2/checkout/orders,
    // see https://developer.paypal.com/docs/api/orders/v2/#orders_create
    const { data } = await axios({
      url: "https://api.sandbox.paypal.com/v2/checkout/orders",
      method: "post",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: req.query.pay
            }
          }
        ]
      }
    });

    res.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
});

app.post("/capture-order/:orderId", async (req, res) => {
  try {
    const { access_token } = await getAccessToken();
    const { client_token } = await getClientToken(access_token);

    const orderId = req.params.orderId;

    // For more details on /v2/checkout/orders,
    // see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
    const { data } = await axios({
      url: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`
      }
    });

    // https://developer.paypal.com/docs/api/orders/v2/#definition-processor_response
    res.json(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
});


app.get("/getMemberId/", async (req, res) => {

  let missed = [];

  if (req.query.first_name == null || req.query.first_name == undefined || req.query.first_name == "") {
      missed.push("First Name is required");
  }

  if (req.query.last_name == null || req.query.last_name == undefined || req.query.last_name == "") {
    missed.push("Last Name is required");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }

  pool.query("select mem_id from `members` where first_name=? and last_name=? and is_active=?", [req.query.first_name,req.query.last_name, "Y"], (err, data) => {
    if (err){
      console.error(err);
      res.status(400).send(err);
    }

    if (data.length > 0){
      res.status(200).send({id: data[0].mem_id});
    }
    else{
      console.error(err);
      res.status(400).send("Error obtaining member details");
    }
  });

});

app.get("/getEmployeeId/", async (req, res) => {

  let missed = [];

  if (req.query.first_name == null || req.query.first_name == undefined || req.query.first_name == "") {
      missed.push("First Name is required");
  }

  if (req.query.last_name == null || req.query.last_name == undefined || req.query.last_name == "") {
    missed.push("Last Name is required");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }

  pool.query("select emp_id from `employees` where first_name=? and last_name=? and is_active=?", [req.query.first_name,req.query.last_name, "Y"], (err, data) => {
    if (err){
      console.error(err);
      res.status(400).send(err);
    }

    if (data.length > 0){
      res.status(200).send({id: data[0].emp_id});
    }
    else{
      console.error(err);
      res.status(400).send("Error obtaining employee details");
    }
  });

});

app.post("/addVisitor/", async (req, res) => {
  let missed = [];

  if (req.body[0].first_name == null || req.body[0].first_name == undefined || req.body[0].first_name == "") {
      missed.push("First Name is required");
  }

  if (req.body[0].last_name == null || req.body[0].last_name == undefined || req.body[0].last_name == "") {
    missed.push("Last Name is required");
  }

  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == "") {
    missed.push("Email is required");
  }

  if (req.body[0].phoneNo == null || req.body[0].phoneNo == undefined || req.body[0].phoneNo == "") {
    missed.push("Phone Number is required");
  }

  if (missed.length > 0) {
      res.status(400).send(missed);
      return;
  }

  const visitor = await addVisitor(req.body[0].first_name, req.body[0].last_name, req.body[0].email, req.body[0].phoneNo);
  if (visitor){
    res.status(200).send({'id': visitor.visitor_id});
  }
  else{
    res.status(400).send(null);
  }

});



/*************Group 4 End *************/

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

getMemLoginDetails = (mem_id, user_type = 'M') => {
  return new Promise((resolve, reject) => {
    pool.query("select * from login where user_id = ? and user_type = ?",[mem_id, user_type], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data[0]);
    });
  });
}

getEmployeePersonalDetails = (emp_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select * from `employees` where `emp_id` = ?",[emp_id], (err, data) => {
      if (err){
        console.log(err);
        reject(err);
      }
      resolve(data[0]);
    });
  });
}

getUpComingEmployeeEvents = (emp_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select e.ev_name as name, upper(e.ev_type) as type, e.ev_date as event_date, e.ev_site as site, e.ev_room_no as room_no from events e join event_employee_map em on e.ev_id = em.ev_id where em.emp_id = ? and e.ev_date>=curdate() order by e.ev_date limit 5",[emp_id], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getUpComingMemberEvents = (mem_id, type) => {
  return new Promise((resolve, reject) => {
    pool.query("select e.ev_name as name, upper(e.ev_type) as type, e.ev_date as event_date, e.ev_site as site, e.ev_room_no as room_no from events e join ticket_transactions t on e.ev_id = t.ev_id where t.user_type=? and t.user_id=? and e.ev_type in (?,?,?) and e.ev_date>=curdate() order by e.ev_date limit 5", [type, mem_id, "show", "exhibition", "auction"], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getLastPurchasedTickets = (user_id,user_type) => {
  return new Promise((resolve, reject) => {
    pool.query("select 'Entry Ticket' as ticket_for, total_amount as amount, purchase_date from ticket_transactions where ticket_class='entry' union select e.ev_name as ticket_for, t.total_amount as amount, t.purchase_date as purchase_date from ticket_transactions t join events e on t.ev_id = e.ev_id where t.user_id = ? and t.user_type = ? order by purchase_date desc limit 5",[user_id,user_type], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getLastPurchasedArts = (user_id, user_type) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT o.obj_title as title, s.total_amount as amount, s.purchase_date as purchase_date from shop_transactions s join sold_objects o on s.shop_id=o.shop_id and s.obj_oid=o.obj_id where s.user_id = ? and s.user_type= ? order by s.purchase_date desc limit 5",[user_id,user_type], (err, data) => {
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

getTotalDonations = (mem_id) => {
  return new Promise((resolve, reject) => {
    pool.query("SELECT sum(amount) as total_donations FROM `master_transactions` where tran_type=? and user_id=?", ["donation",mem_id], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data[0]);
    });
  });
}

insertEvent = (details, type) => {
  return new Promise((resolve, reject) => {
    pool.query("INSERT INTO `events` (ev_name, ev_date, ev_description, ev_site, ev_room_no, ev_type, ev_price) VALUES (?,?,?,?,?,?,?)", [details.ev_name, details.ev_date, details.ev_description, details.ev_site, details.ev_room_no, type, details.ev_price], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

insertMember = (details) => {
  return new Promise((resolve, reject) =>{
    pool.query("INSERT INTO `members` (first_name, last_name, phone_no, email, address1, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [details.first_name, details.last_name, details.phone, details.email, details.address1, details.address2, details.city, details.state, details.zip], (err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

checkMemberExist = (fname, lname, email) => {
  return new Promise((resolve, reject) => {
    pool.query("select mem_id from `members` where first_name=? and last_name=? and email=? and is_active=?", [fname, lname, email, "Y"], (err, data) => {
      if (err){
        reject(err);
      }
      if (data.length > 0){
        resolve({"member_id": data[0].mem_id});
      } else{
        resolve();
      }
    });
  });
}

checkEmployeeExist = (fname, lname) => {
  pool.query("select emp_id from `employees` where first_name=? and last_name=? and is_active=?", [fname, lname, "Y"], (err, data) => {
    if (err){
      reject(err);
    }
    resolve({"employee_id": data[0].emp_id});
  });
}

makeDonation = (id, amount, type) => {
  return new Promise((resolve, reject) =>{
    pool.query("INSERT INTO `donations` (user_id, user_type, amount) VALUES (?,?,?)", [id, type, amount], (err, data) => {
    if (err){
      reject(err);
    }
    resolve(data);
  });
  });
}

addVisitor = (fname, lname, email, phone) => {
  return new Promise((resolve, reject) =>{
    pool.query("INSERT INTO `visitors` (first_name, last_name, email, phone_no) VALUES (?,?,?,?)", [fname, lname, email, phone], (err, data) => {
    if (err){
      reject(err);
    }
    resolve({"visitor_id": data.insertId});
  });
  });
}

getRenewalEmails = () => {
  return new Promise((resolve, reject) => {
    pool.query("select email_id,address from `renewal_email_list` where sent=?",['N'],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getCredentials = (first_name, last_name, email) => {
  return new Promise((resolve, reject) => {
    var found = false;
    pool.query("select l.username as username, l.password as password from `login` l join `members` m on l.user_id=m.mem_id where l.user_type=? and m.first_name=? and m.last_name=? and m.email=?",["M",first_name,last_name,email],(err, data) => {
      if (err){
        reject(err);
      } if (data.length > 0){
        found = true;
        resolve(data);
      }
    });
    if (!found){
      pool.query("select l.username as username, l.password as password from `login` l join `employees` e on l.user_id=e.emp_id where l.user_type=? and e.first_name=? and e.last_name=? and e.email_id=?",["E",first_name,last_name,email],(err, data) => {
        if (err){
          reject(err);
        }
        resolve(data);
      });
    }
  });

}

getSiteLocations = () => {
  return new Promise((resolve, reject) => {
    pool.query("select distinct loc_site from objects",(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getRoomNumbers = () => {
  return new Promise((resolve, reject) => {
    pool.query("select distinct loc_room from objects",(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getWorkers = () => {
  return new Promise((resolve, reject) => {
    pool.query("select emp_id,first_name,last_name from `employees` where role=? and is_active=?",["worker","Y"],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getObjClass = () => {
  return new Promise((resolve, reject) => {
    pool.query("select distinct obj_class from objects",(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getEvents = (type) => {
  return new Promise((resolve, reject) => {
    pool.query("select ev_id, ev_name from `events` where ev_type=?",[type],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

getCancelEmails = (ev_id) => {
  return new Promise((resolve, reject) => {
    pool.query("select email from `events` where ev_id=?",[ev_id],(err, data) => {
      if (err){
        reject(err);
      }
      resolve(data);
    });
  });
}

cancelEvent = (ev_id) => {
  return new Promise((resolve, reject) => {
    pool.query("delete from `events` where ev_id=?",[ev_id],(err, data) => {
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

app.get("/getSiteLocations", async (req, res) => {
  try{
    const siteLocations = await getSiteLocations();
    res.status(200).json(siteLocations);
  } catch (err){
    res.status(400);
  }
});

app.get("/getRoomNumbers", async (req, res) => {
  try{
    const roomNumbers = await getRoomNumbers();
    res.status(200).json(roomNumbers);
  } catch (err){
    res.status(400);
  }
});


// get obj_class from objects table
app.get("/getObjClass", async (req, res) => {
  try{
    const objClass = await getObjClass();
    res.status(200).json(objClass);
  } catch (err){
    res.status(400);
  }
});

//get employee id, first name, last name of role worker
app.get("/getWorkers", async (req, res) => {
  try{
    const workers = await getWorkers();
    res.status(200).json(workers);
  } catch (err){
    res.status(400);
  }
});

app.get("/getallevents/:type", async (req, res) => {
  try{
    const events = await getEvents(req.params.type);
    res.status(200).json(events);
  } catch (err){
    res.status(400);
  }
});

app.get("/getCancelEmails/:id", async (req, res) => {
  try{
    const emails = await getCancelEmails(req.params.id);
    res.status(200).json(emails);
  } catch (err){
    res.status(400);
  }
});

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
    return res.status(200).json({"message":"Member details not found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Member details not found"});
  }
});

app.get("/getemployeedetails/:id", async (req, res) => {
  try {
    const personal = await getEmployeePersonalDetails(parseInt(req.params.id));
    const login = await getMemLoginDetails(parseInt(req.params.id), 'E');
    if (personal && login) {
      const details = {
        "personal": personal,
        "login": login
      }
      return res.status(200).json(details);
    }
    return res.status(200).json({"message":"Employee details not found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Employee details not found with an error"});
  }
});

app.get("/getmanagerdetails/:id", async (req, res) => {
  try {
    const personal = await getEmployeePersonalDetails(parseInt(req.params.id));
    const login = await getMemLoginDetails(parseInt(req.params.id), 'C');
    if (personal && login) {
      const details = {
        "personal": personal,
        "login": login
      }
      return res.status(200).json(details);
    }
    return res.status(200).json({"message":"Employee details not found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Employee details not found with an error"});
  }
});

// get upcoming events for employee
app.get('/getupcomingemployeeevents/:id', async (req, res) => {
  try {
    const events = await getUpComingEmployeeEvents(parseInt(req.params.id));
    if (events){
      return res.status(200).json(events);
    }
    return res.status(200).json({"message":"No upcoming events"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Upcoming events not found"});
  }
});

// get upcoming events for member
app.get('/getupcomingevents/:id', async (req, res) => {
  try{
    let temp_user_type = session.user_type;
    if (temp_user_type == 'C'){
      temp_user_type = 'E';
    }
    const events = await getUpComingMemberEvents(parseInt(req.params.id), temp_user_type);
    if (events){
      return res.status(200).json(events);
    }
    return res.status(200).json({"message":"No upcoming events"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Upcoming events not found"});
  }
});

// get last 5 purchased tickets
app.get('/getlastpurchasedtickets/:id', async (req, res) => {
  try{
    const tickets = await getLastPurchasedTickets(parseInt(req.params.id), 'M');
    if (tickets){
      return res.status(200).json(tickets);
    }
    return res.status(200).json({"message":"No tickets purchased"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Tickets not found"});
  }
});

app.get('/getlastpurchasedticketsemployees/:id', async (req, res) => {
  try{
    const tickets = await getLastPurchasedTickets(parseInt(req.params.id), 'E');
    if (tickets){
      return res.status(200).json(tickets);
    }
    return res.status(200).json({"message":"No tickets purchased"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Tickets not found"});
  }
});

// get last 5 purchased arts
app.get('/getlastpurchasedarts/:id', async (req, res) => {
  try{
    const arts = await getLastPurchasedArts(parseInt(req.params.id), 'M');
    if (arts){
      return res.status(200).json(arts);
    }
    return res.status(200).json({"message":"No arts purchased"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Arts not found"});
  }
});

app.get('/getlastpurchasedartsemployees/:id', async (req, res) => {
  try{
    const arts = await getLastPurchasedArts(parseInt(req.params.id), 'E');
    if (arts){
      return res.status(200).json(arts);
    }
    return res.status(200).json({"message":"No arts purchased"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"Event not found"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"No auctions found"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"No exhibitions found"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"No shows found"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"No shows found"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"No exhibitions found"});
  }catch(err){
    console.error(err);
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
    return res.status(200).json({"message":"No auctions found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Auctions not found"});
  }
});

// get total donations for a member
app.get("/getDonations/:id", async (req,res) => {
  try{
    const donations = await getTotalDonations(parseInt(req.params.id));
    if (donations){
      return res.status(200).json({"total_donations":donations});
    }
    return res.status(200).json({"message":"No donations found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Donations not found"});
  }
});

app.get("/getRenewalEmails", async (req,res) => {
  try{
    const emails = await getRenewalEmails();
    if (emails){
      return res.status(200).json(emails);
    }
    return res.status(200).json({"message":"No emails found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Emails not found"});
  }
});


//==================================================================================================

/*
  Below section of code consists of all the necessary post api calls
*/
//==================================================================================================


app.get("/getCredentials/", async (req,res) => {
  try{
    var first_name = req.query.first_name;
    var last_name = req.query.last_name;
    var email = req.query.email;
    const credentials = await getCredentials(first_name,last_name, email);
    if (credentials){
      return res.status(200).json(credentials);
    }
    return res.status(300).json({"message":"Credentials not found"});
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Error when getting credentials"});
  }
});

// make a donation
app.post("/makeDonation/", async (req,res) => {
  try{
    const memberExist = await checkMemberExist(req.body[0].first_name,req.body[0].last_name,req.body[0].email);
    //extract member id from the result
    if (memberExist){
      const donation = await makeDonation(memberExist.member_id,req.body[0].amount, "M");
      if (donation){
        return res.status(200).json({"message":"Donation made successfully"});
      }
      return res.status(400).json({"message":"Donation not made"});
    }
    else{
      const visitor = await addVisitor(req.body[0].first_name,req.body[0].last_name,req.body[0].email,req.body[0].phone);
      if (visitor){
        const donation = await makeDonation(visitor.visitor_id,req.body[0].amount, "V");
        if (donation){
          return res.status(200).json({"message":"Donation made successfully"});
        }
        return res.status(400).json({"message":"Donation not made"});
      }
    }
  }catch(err){
    console.error(err);
    return res.status(400).json({"message":"Donation failed"});
  }
});

// buy entry ticket
app.post("/buyTickets/", async (req,res) => {
  var first_name = req.body[0].first_name;
  var last_name = req.body[0].last_name;
  var email = req.body[0].email;

  var phone = req.body[0].phone;
  var ev_date = req.body[0].ev_date;

  var adult_count = req.body[0].adult_count;
  var child_count = req.body[0].child_count;
  var senior_count = req.body[0].senior_count;
  var student_count = req.body[0].student_count;
  var other_count = req.body[0].other_count;

  var adult_price = req.body[0].adult_price;
  var senior_price = req.body[0].senior_price;
  var student_price = req.body[0].student_price;
  var other_price = req.body[0].other_price;

  var ticket_total = req.body[0].ticket_total;

  var event_id = req.body[0].event_id;
  if (event_id == "" || event_id == null){
    event_id = null;
  }
  var ticket_type = req.body[0].event_type;
  if (ticket_type == "" || ticket_type == null){
    ticket_type = "entry";
  }

  try{
    if (session.loggedin == true){
        let temp_user_type = session.user_type;
        if (temp_user_type == "C"){
          temp_user_type = "E";
        }
        pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, student_count, other_count, adult_price, senior_price, student_price, other_price, total_amount, user_id, user_type, event_date, ev_id, email) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [ ticket_type, child_count, adult_count, senior_count, student_count, other_count, adult_price, senior_price, student_price, adult_price, ticket_total, session.user_id, temp_user_type, ev_date, event_id, req.body[0].email], (err, data) => {
          if (err){
              return res.status(400).json({"message": "Ticket purchase failed"});
          }
          return res.status(200).json({"message":"Ticket purchase successful"});
        });
    }
    else{
      // create entry in visitors table
      var visitor_id = 0;
      pool.query("INSERT INTO `visitors` (first_name, last_name, email, phone_no) VALUES (?,?,?,?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].email, req.body[0].phone], (err, data) => {
        if (err){
            console.log(err);
            return res.status(400).json({"message":"Ticket purchase failed"});
        }
        visitor_id = data.insertId;
        pool.query("INSERT INTO `ticket_transactions` (ticket_class, child_count, adult_count, senior_count, student_count, other_count, adult_price, senior_price, student_price, other_price, total_amount, user_id, user_type, event_date, ev_id, email) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [ ticket_type, child_count, adult_count, senior_count, student_count, other_count, adult_price, senior_price, student_price, adult_price, ticket_total, visitor_id, "V", ev_date, event_id, req.body[0].email], (err, data) => {
          if (err){
              console.log(err);
              return res.status(400).json({"message":"Ticket purchase failed"});
          }
          return res.status(200).json({"message":"Ticket purchase successful"});
        });
      });
    }
  } catch(err){
    console.log(err);
    return res.status(400).json({"message":"Ticket purchase failed"});
  }
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
app.post('/createevent', async (req, res) => {
  let ev_type = req.body[0].ev_type;
  try{
    // insert show data into events table
    const event = await insertEvent(req.body[0],ev_type);
    for (var i = 0; i < req.body[0].assigned_employees.length; i++){
      await pool.query("INSERT INTO `event_employee_map` (ev_id, emp_id) VALUES (?,?)", [event.insertId, req.body[0].assigned_employees[i]]);
    }
    return res.status(200).json({"message":"Show created successfully"});
  }catch(err){
    return res.status(400).json({message: "Create show failed"});
  }
});


// update member details by id
app.post('/updatememberdetails/:id', (req, res) => {
  // get old member details
  var old_details = null;
  var user_type = req.body[0].user_type;
  if (user_type == "member"){
    pool.query("SELECT * FROM `members` WHERE mem_id = ?", [req.params.id], (err, data) => {
      if (err){
          return res.status(400).json({"message":"Member details retrieval failed"});
      }
      old_details=data[0];
    });
  }else if (user_type == "employee"){
    pool.query("SELECT * FROM `employees` WHERE emp_id = ?", [req.params.id], (err, data) => {
      if (err){
          return res.status(400).json({"message":"Employee details retrieval failed"});
      }
      old_details=data[0];
    });
  }
  var update_details = {};
  // check if phone_no is empty, undefined or null
  if (req.body[0].phone == null || req.body[0].phone == undefined || req.body[0].phone == ""){
    update_details["phone_no"]=old_details.phone_no;
  }else{
    update_details["phone_no"]=req.body[0].phone;
  }
  // check if email is empty, undefined or null
  if (req.body[0].email == null || req.body[0].email == undefined || req.body[0].email == ""){
    if(user_type == "member"){
      update_details["email"]=old_details.email;
    } else if (user_type == "employee"){
      update_details["email"]=old_details.email_id;
    }
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
  update_details["address2"]=req.body[0].address2;
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
  if (req.body[0].zip == null || req.body[0].zip == undefined || req.body[0].zip == ""){
    update_details["zipcode"]=old_details.zipcode;
  }else{
    update_details["zipcode"]=req.body[0].zip;
  }

  if (user_type == "member"){
    // update member personal details
    pool.query("UPDATE `members` SET phone_no = ?, email = ?, address1 = ?, address2 = ?, city = ?, state = ?, zipcode = ? WHERE mem_id = ?", [update_details["phone_no"], update_details["email"], update_details["address1"], update_details["address2"], update_details["city"], update_details["state"], update_details["zipcode"], req.params.id], (err, data) => {
      if (err){
          return res.status(400).json({"message":"Member details update failed"});
      }
      return res.status(200).json({"message":"Member details updated successfully"});
    });
  } else if(user_type == "employee"){
    // update employee personal details
    pool.query("UPDATE `employees` SET phone_no = ?, email_id = ?, address1 = ?, address2 = ?, city = ?, state = ?, zipcode = ? WHERE emp_id = ?", [update_details["phone_no"], update_details["email"], update_details["address1"], update_details["address2"], update_details["city"], update_details["state"], update_details["zipcode"], req.params.id], (err, data) => {
      if (err){
          return res.status(400).json({"message":"Employee details update failed"});
      }
      return res.status(200).json({"message":"Employee details updated successfully"});
    });
  }
});

// update member login details by id
app.post('/updatelogindetails/:id', (req, res) => {
  var update_details = {};
  update_details["username"]=req.body[0].username;
  update_details["password"]=req.body[0].password;
  let user_type = req.body[0].user_type;
  let type = "M";
  if (user_type == "employee"){
    type = "E";
  }
  pool.query("UPDATE `login` SET username = ?, password = ? WHERE user_id = ? and user_type = ?", [update_details["username"], update_details["password"], req.params.id, type], (err, data) => {
    if (err){
      console.log(err);
        return res.status(400).json({"message":"Member details update failed"});
    }
    return res.status(200).json({"message":"Member details updated successfully"});
  });
});

// register a new member
app.post('/registermember', async (req, res) => {
  try{
    const existMember = await pool.query("SELECT * FROM `login` WHERE username = ?", [req.body.username]);
    if (existMember.length > 0){
      return res.status(300).json({message: "Username already exists"});
    }
    const newMember = await insertMember(req.body[0]);
    const newLogin = await pool.query("INSERT INTO `login` (username, password, user_id, user_type) VALUES (?, ?, ?, ?)", [req.body[0].username, req.body[0].password, newMember.insertId, "M"]);
    const master_transaction = await pool.query("INSERT INTO `master_transactions` (tran_type, user_id, user_type, purchase_date, amount) VALUES (?, ?, ?, ?, ?)",["registration", newMember.insertId, "M", new Date(), 100]);
    return res.status(200);
  }catch(err){
    console.log(err);
      return res.status(400).json({"message":"Member registration failed"});
    }
});

// create employee
app.post('/createemployee', (req, res) => {

  // check if username already exists
  pool.query("SELECT * FROM `login` WHERE username = ?", [req.body[0].username], (err, data) => {
    if (err){
      console.log(err);
      return res.status(400).json({"message":"Error in checking username"});
    }
    if (data.length > 0){
      return res.status(300).json({"message":"Username already exists"});
    }
  });
  // insert into employees table
  pool.query("INSERT INTO `employees` (first_name, last_name, phone_no, email_id, address1, address2, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [req.body[0].first_name, req.body[0].last_name, req.body[0].phone_no, req.body[0].email, req.body[0].address1, req.body[0].address2, req.body[0].city, req.body[0].state, req.body[0].zipcode], (err, data) => {
    if (err){
      console.log(err);
      return res.status(400).json({"message":"Employee registration failed"});
    }
    var employee_id = data.insertId;
    // insert into login table
    pool.query("INSERT INTO `login` (username, password, user_type, user_id) VALUES (?, ?, ?, ?)", [req.body[0].username, req.body[0].password, "E", employee_id], (err, data) => {
      if (err){
        console.log(err);
        return res.status(400).json({"message":"Employee registration failed"});
      }
    });
    return res.status(200).json({"message":"Employee registration successful"});
  });
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
  let user_id = 0;
  let user_type = '';
  pool.query("select * from login where username = ? and password = ?",[req.body.username, req.body.password] , (err, data) => {
    if (err){
      return res.status(400).json({"message":"Login failed"});
    }
    if (data.length == 0){
      return res.status(400).json({"message":"invalid username or password"});
    }
    user_id = data[0].user_id;
    user_type = data[0].user_type;
    session.user_id = user_id;
    session.user_type = user_type;
    session.loggedin = true;
    res.sendFile('./src/home.html', {root: __dirname});
  });
});

app.get("/getSessionInfo", (req, res) => {
  if (session.loggedin){
    return res.status(200).json({"user_id":session.user_id, "user_type":session.user_type, "loggedin":session.loggedin});
  } else {
    return res.status(200).json({"loggedin":false});
  }
});

app.post("/updateEmailStatus" , async (req, res) => {
  // loop over request body and update email status
  for (var i = 0; i < req.body.length; i++){
    pool.query("update renewal_email_list set sent=? where email_id = ?",['Y', req.body[i].email_id], (err, data) => {
      if (err){
        return res.status(400).json({"message":"Email status update failed"});
      }
    });
  }
  res.status(200).json({"message":"Email status update successful"});
});

app.post("/sendEmails" , async (req, res) => {
  var email_type = req.body[0].email_type;
  if (email_type == "renewal"){
    var subject = "Membership Renewal Reminder";
    var body = "Dear Member, \n\nThis is a reminder that your membership is about to expire in 10 days. Please renew your membership to continue enjoying the benefits of being a member of the Art Gallery. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      bcc: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if (email_type == "register"){
    var subject = "Membership Registration Confirmation";
    var body = "Dear Member, \n\nThank you for registering for the Art Gallery. Your membership is now active. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if (email_type == "purchase_art"){
    var subject = "Artwork Purchase Confirmation";
    var body = "Dear Member, \n\nThank you for purchasing the art work. Your purchase is successfully processed. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if (email_type == "purchase_ticket"){
    var subject = "Ticket Purchase Confirmation";
    var body = "Dear Member, \n\nThank you for purchasing the ticket. Your purchase is successfully processed. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if (email_type == "cancel_event"){
    var subject = "Event Cancellation";
    var body = "Dear Member, \n\nThe event you have registered for has been cancelled. Please visit your portal to get more information. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      bcc: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if (email_type == "contact_us_reply"){
    var subject = "Contact Us Reply";
    var body = "Dear Member, \n\nThank you for contacting us. We have received your message and will get back to you shortly. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if (email_type == "credentials"){
    var subject = "Art Gallery Login Credentials";
    var body = "Dear Member, <br><br>Your <strong>username</strong> is <b>'" + req.body[0].username + "'</b> and <strong>password</strong> is <b>'" + req.body[0].password + "'</b>. <br><br>Thank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      html: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if(email_type == "donation"){
    var subject = "Donation Confirmation";
    var body = "Dear Member, \n\nThank you for your donation. Your donation is successfully processed. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if(email_type == "update_details"){
    var subject = "Update Details Confirmation";
    var body = "Dear Member, \n\nYour details have been successfully updated. \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  } else if(email_type == "enrolled"){
    var subject = "Enrolled as employee";
    var body = "Dear Member, \n\nYou have been enrolled as an employee at the Art Gallery. We are looking forward to meeting you upcoming Monday. \n\nYou can login to your portal using the following credentials:\nUsername:"+req.body[0].username+"\nPassword:"+req.body[0].password+" \n\nThank you.";
    var email_list = req.body[0].email_list;
    let mailDetails = {
      from: 'art.gallery.notifications@gmail.com',
      to: email_list,
      subject: subject,
      text: body
    };
    mailTransporter.sendMail(mailDetails, function(err, data) {
      if(err) {
          return res.status(400).json({"message":"Email sending failed"});
      } else {
          return res.status(200).json({"message":"Email sent successfully"});
      }
    });
  }
});

app.post("/art_upload", (req, res) => {
  upload(req, res, (err) => {
   if(err) {
    console.log(err)
    res.status(400).send("Something went wrong!");
   }
   res.status(200).json(res.req.file);
 });
});

app.post("/add_art",  async (req, res) => {
  let art_title = req.body[0].art_title;
  let art_beg = req.body[0].art_beg;
  let art_end = req.body[0].art_end;
  let art_medium = req.body[0].art_medium;
  let art_dim = req.body[0].art_dim;
  let art_ins = req.body[0].art_ins;
  let art_artist = req.body[0].art_artist;
  let art_type = req.body[0].art_type;
  let art_site = req.body[0].art_site;
  let art_room = req.body[0].art_room;
  let art_loc_desc = req.body[0].art_loc_desc;
  let art_img = req.body[0].art_image;
  let art_price = req.body[0].art_price;

  try {
    pool.query("insert into objects (obj_title,obj_beginyear,obj_endyear,obj_medium,obj_dimensions,obj_inscription,obj_attribution,obj_class,loc_site,loc_room,loc_description,img_url,price) values(?,?,?,?,?,?,?,?,?,?,?,?,?)", [art_title,art_beg,art_end,art_medium,art_dim,art_ins,art_artist,art_type,art_site,art_room,art_loc_desc,art_img,art_price], (err, result) => {
      if (err) {
        res.status(400).json({"message":"Artwork addition failed"});
      } else {
        res.status(200).json({"message":"Art added successfully"});
      }
    }
    );
  } catch (err) {
    res.status(400).json({"message":"Artwork addition failed"});
  }

});

app.post("/cancelevent",  async (req, res) => {
  let ev_id = req.body[0].ev_id;
  try {
    let resp = await cancelEvent(parseInt(ev_id));
    res.status(200).json({"message":"Event cancelled successfully"});
  } catch (err) {
    res.status(400).json({"message":"Event cancellation failed"});
  }
});
//==================================================================================================