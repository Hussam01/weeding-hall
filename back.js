if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}

var mysql = require('mysql'); 
var express = require("express");
var bodyParser = require("body-parser");
var nodemailer = require('nodemailer');
var app = express();
const bcrypt = require('bcrypt');
const flash = require('express-flash');
const session = require('express-session');
var testText = 'template test'
const passport = require('passport');
const methodOverride = require('method-override');
const initializePassport = require('./passport-config.js');
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);



app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized:false

}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// date reversing function to view date in format of (dd-mm-yyyy)
function convertDigitIn(str){
  return str.split('-').reverse().join('-');
}
//end


//auth-section-start
const users= [] // it will be replacedd with DB request

app.delete('/logout', (req,res) => {
  req.logOut()
  res.redirect('/login')
})

function checkAuthenticated(req,res, next){
  if(req.isAuthenticated()){
    return next()
  }

  res.redirect('login');
}

function checkNotAuthenticated(req,res, next){
  if(req.isAuthenticated()){
    return res.redirect('/admin');
  }

  next();
}


app.get('/login', checkNotAuthenticated, (req,res) =>{
  res.render('login.ejs', {name: 'Kyle'})
})

app.get('/register', checkNotAuthenticated, (req,res) =>{
  res.render('register.ejs', {name: 'Kyle'})
})

app.post('/register', async (req,res)=>{
  try{
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    users.push({
      id: Date.now().toString(),// this one is automated in DB
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    })
    res.redirect('/login')
  } catch{
    res.redirect('/rgister')
  }
  console.log(users);
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/admin',  // change 1 
  failureRedirect: 'login',
  failureFlash: true
}))
//auth-section-end







// Email Function Start
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hussamdaoud0001@gmail.com',
    pass: 'roxas1323'
  }
});



function getConnection(){
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    dateStrings: 'date',
    password: "maximo13",
    database: "mydb2"
  });
}

var connection = getConnection();
app.post('/res', (req,res) =>{
  console.log('you are trying to reserve a day');
  console.log('the name of the reserver is ' + req.body.name);
  var name = req.body.name;
  var email = req.body.email;
  var tel = req.body.phone;
  var date = req.body.date;
  const queryString = "INSERT INTO  customers3 (name, email, tel, date) VALUES (?,?,?,?)";
  getConnection().query(queryString, [name, email, tel, date], (err, results, fields) =>{
    if (err){
      console.log("Failed to make reservation please try again" + err);
      res.sendStatus(500);
      return
    }

    console.log(' you successfuly made a reservation with id: ' + results.insertId);
    //=======
    connection.query('SELECT * FROM `customers3`', function (err, results, fields) {
      if (err){
        console.log("Failed to make reservation please try again" + err);
        res.sendStatus(500);
        return
      }
    });
    // email to client
    var mailOptions1 = {
      from: 'hussamdaoud0001@gmail.com', // change to site official emil
      to: email,
      subject: 'Al Zumorrod Hall Reservation Confiremed',
      text: `Thank you ${name} for reserving our hall on ${convertDigitIn(date)} we hope you enjoy our services`
    };

    //email to admin
    var mailOptions2 = {
      from: 'hussamdaoud0001@gmail.com', // change to site official emil
      to: 'max.hussam1323@gmail.com',
      subject: 'A New Reservation Confiremed',
      text: `Hello admin a new customer Mr. ${name} has made a reservation on ${convertDigitIn(date)} and the data is successfully logged`
    };

    var mailOptions = [mailOptions1,mailOptions2];

    for(var i=0; i< 2; i++){
    transporter.sendMail(mailOptions[i], function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  }
    //email function end
    res.end('reservation done');
  });
})


app.get('/admin',checkAuthenticated, function(req,res){
      connection.query('SELECT * FROM `customers3`', function (err, results, fields) {
        if (err){
          console.log("Failed to get the data from the DB" + err);
          res.sendStatus(500);
          return
        }

      res.render('admin', {clients: results});
    })
    console.log('ready!');
    // fields will contain information about the returned results fields (if any)
});

app.get('/user-add', function(req,res,){
    res.render('user-add');
});

app.post('/user-add', function(req,res){
    let data = {name: req.body.name, email: req.body.email, tel: req.body.phone, date: req.body.date }
    let sql = "INSERT INTO customers3 SET ?";
    let query = connection.query(sql, data,(err, results) =>{
      if(err){
        console.log("error happened");
      } 
    });
    res.redirect('/admin');   
});

app.get('/user-edit/:userId',(req, res) => {
  const userId = req.params.userId;
  let sql = `Select * from customers3 where id = ${userId}`;
  let query = connection.query(sql,(err, result) => {
      if(err) throw err;
      res.render('user-edit', {
          title : 'CRUD Operation using NodeJS / ExpressJS / MySQL',
          clients : result[0]
      });
  });
});

app.post('/update', function(req,res){
  const userId = req.body.id;
  let sql = "UPDATE customers3 SET name='"+req.body.name+"',  email='"+req.body.email+"',  tel='"+req.body.phone+"', date='"+req.body.date+"' WHERE id ="+userId;
  connection.query(sql,(err, results) =>{
    if(err){
      console.log("error happened");
    } 
    res.redirect('/admin');
  });
  
  
});

//delete
app.get('/delete/:userId',(req, res) => {
  const userId = req.params.userId;
  let sql = `DELETE FROM customers3 WHERE id = ${userId}`;
  let query = connection.query(sql,(err, result) => {
      if(err) throw err;
      //===
      app.get('/admin', function(req,res){
        res.render('admin', {clients: results});
      })
      //==
      res.redirect('/admin');
      });
  });

  app.listen(3000, function () {
    console.log('server running on port 3000');
  });




  