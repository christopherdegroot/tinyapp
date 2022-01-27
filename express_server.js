const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");



// DATA
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// DRY FUNCTIONS
let generateRandomString = function() {
  let result = '';
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

let emailLookup = function(user_id) {
    let userID = user_id;
    let email = users[`${userID}`].email;
    return email;
 };
  

// HOME PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

// URLS.JSON OF DATABASE
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// URLS PAGE
app.get("/urls", (req, res) => {
  // console.log(req.cookies.user_id)
  // console.log(users[`${req.cookies.user_id}`].email);
  const templateVars = { urls: urlDatabase, user_id: req.cookies.user_id, users};
  res.render("urls_index", templateVars);
});

// CREATE A NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: req.cookies.user_id, users,
  };

  res.render("urls_new", templateVars);
});

// POST FOR NEW URL
app.post("/urls", (req, res) => {
  let keyArray = [];
  keyArray.push(generateRandomString());
  let newKey = keyArray[0];
  urlDatabase[newKey] = `http://www.${req.body["longURL"]}`,
  res.redirect(`urls/${newKey}`);
});

// PAGE FOR A SHORT URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user_id: req.cookies.user_id};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// POST FOR DELETING URLS
app.post("/urls/:shortURL/delete", (req, res) => {
  let deleteKey = req.params.shortURL;
  delete urlDatabase[`${deleteKey}`];
  res.redirect(`/urls`);
});

// POST FOR EDITING URLS
app.post("/urls/:id", (req, res) =>{
  let key = req.params.id;
  let newLongURL = req.body.longURL;
  urlDatabase[`${key}`] = 'http://www.' + newLongURL;
  res.redirect(`/urls`);
});

// GET REGISTER PAGE
app.get("/register", (req, res) => {
  res.render('registration')
});

// POST /REGISTER 
app.post("/register", (req, res) => {
  newUserID = generateRandomString(6);
  newUserEmail = req.body.email;
  newUserPassword = req.body.password;


  if (newUserEmail === '' || newUserPassword === '') {
    res.write('Error 400');
    res.end();
    return;
  };

   for (let user in users) {
     let userID = user;
     if (newUserEmail === emailLookup(userID)) {
       res.write('Error 400');
       res.end();
       return;
     };
  };

  users[`${newUserID}`] = {
    id: newUserID,
    email: newUserEmail,
    password: newUserPassword,
  }
  
  res.cookie('user_id', newUserID);
  //  console.log(users);

  res.redirect('/urls')
});

// LOGIN GET
app.get("/login", (req, res) => {
  res.render('login')
});


// LOGIN POST
app.post("/login", (req, res) => {

  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  console.log('login email', loginEmail);
  console.log('login password', loginPassword);

  for (let user in users) {
    if (emailLookup(user) === loginEmail && users[`${user}`].password === loginPassword) {
      res.cookie('user_id', users[`${user}`].id);
    };
  };
  
  res.redirect(`/urls`);
});

// LOGOUT POST
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`/urls`);
});

// 404 page
app.get("*", (req, res) => {
  res.send("<html><body><b>404: Not Found</b></body></html>\n");
});


// LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});