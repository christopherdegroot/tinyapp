const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

let generateRandomString = function() {
  let result = '';
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i <= 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// DATA
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase, username: req.cookies.username};
  res.render("urls_index", templateVars);
});

// CREATE A NEW URL PAGE
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies.username,
  };

  res.render("urls_new", templateVars);
});

// POST FOR NEW URL
app.post("/urls", (req, res) => {
  //console.log(req.body);
  let keyArray = [];
  keyArray.push(generateRandomString());
  let newKey = keyArray[0];
  urlDatabase[newKey] = `http://www.${req.body["longURL"]}`,
  res.redirect(`urls/${newKey}`);
});

// PAGE FOR A SHORT URL
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies.username };
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

// LOGIN POST
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect(`/urls`);
});

// LOGOUT POST
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(`/urls`);
});

// HELLO PAGE
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


// LISTEN
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});