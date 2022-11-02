const express = require('express'); 
const path = require('path');
const mysql = require("mysql");
const bcrypt = require("bcrypt")
const app = express();              
const port = 3000;

const config = {
    host: "db-se-567.cx8txkcnxtfy.us-east-1.rds.amazonaws.com",
    port: 3306,
    database: "db_se_567",
    user: "admin",
    password: "database567"
  }
  
const pool = mysql.createPool(config);

pool.getConnection( (err, connection)=> {
    if (err) throw (err)
    console.log ("DB connected successful: " + connection.threadId)
 })

app.use(express.static(path.join(__dirname)));
app.use(express.json());

app.get('/', (req, res) => {        
    res.sendFile('./home-classic.html', {root: __dirname});
});

app.listen(port, () => {            
    console.log(`Now listening on port ${port}`); 
});


//CREATE USER
app.post("/createUser", async (req,res) => {
    res.sendFile('./my-account.html', {root: __dirname});
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
    res.sendFile('/my-account.html', {root: __dirname});
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