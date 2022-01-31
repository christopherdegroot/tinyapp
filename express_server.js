// Requirements
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const { getUserByEmail } = require('./helpers.js');

//app.use
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Verstappen', 'Hamilton', 'Leclerc'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//app.set
app.set("view engine", "ejs");

// DATA ---------------------------------------------------------------------------------------------------------------------

//URL database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

//user database
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

// DRY FUNCTIONS -------------------------------------------------------------------------------------------------------------

//function to generate random string
let generateRandomString = function(length) {
  let result = '';
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

//function to lookup a user's email through their user ID
let emailLookup = function(user_id) {
  let userID = user_id;
  let email = users[`${userID}`].email;
  return email;
};

//function to check if a user is logged in
let isLoggedIn = function(userID) {
  if (users.hasOwnProperty(userID)) {
    return true;
  } else return false;
};

//function to check what urls in the global database a user has (uses user id as a parameter)
let urlsForUser = function(id) {
  let filteredUrlDatabase = {};
  for (let key in urlDatabase) {
    if (urlDatabase[`${key}`].userID === id) {
      filteredUrlDatabase[`${key}`] = {
        longURL: urlDatabase[`${key}`].longURL,
        userID: urlDatabase[`${key}`].userID
      };
    };
  };
  return filteredUrlDatabase;
};

// HTTP REQUESTs -------------------------------------------------------------------------------------------------------------

// GET /
app.get('/', (req, res)=>{
  res.redirect(`/login`);
  res.end();
});


// POST /:shortURL
app.post("/urls/:url", (req, res) => {
  let userID = req.session.user_id;
  let urlKey = req.params.url;
  let newLongURL = req.body['longURL'];
  urlDatabase[urlKey] = {longURL: `http://www.${newLongURL}`, userID},

  res.redirect(`/urls`);
  res.end();
});


// GET /urls
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = { urls: urlsForUser(userID), user_id: req.session.user_id, users};

  // checking if a user is logged in, if not it will show a view that tells them a relevant error code and links to register/login
  if (isLoggedIn(userID) === true) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_noshow", templateVars);
  };
});


// GET /urls/new
app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;
  
  if (isLoggedIn(userID) === true) {
    const templateVars = {
      user_id: req.session.user_id, users,
    };
    res.render("urls_new", templateVars);
  } else
    res.redirect(`/login`);
  res.end();
});


// POST /urls
app.post("/urls", (req, res) => {
  let userID = req.session.user_id;
  
  if (isLoggedIn(userID) === true) {
 
    let newKey = generateRandomString(6);
    urlDatabase[newKey] = {longURL: `http://www.${req.body["longURL"]}`, userID},
    
    res.redirect(`urls/${newKey}`);
  } else
    res.write(`403: Forbidden`);
  res.end();
});


// GET /urls/:shortURL
app.get("/urls/:url", (req, res) => {
  let userKey = req.session.user_id;
  let shortURL = req.params.url;

  //checking if link exists in database
  if (urlDatabase[`${shortURL}`] === undefined) {
    res.write('<h1>Error 404: Not Found</h1><h2>Link does not exist</h2>');
    res.end();
    return;
  } else {
 
    const templateVars = {
      shortURL: req.params['url'],
      longURL: urlDatabase[`${req.params['url']}`]['longURL'],
      user_id: req.session.user_id,
      users,
    };

    if (isLoggedIn(userKey) === true && urlDatabase[`${shortURL}`].userID === userKey) {
      res.render("urls_show", templateVars);
    } else {
      res.render("urls_shortnoshow", templateVars);
    };
  };
});


// GET /u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  //checks first if the url exists in database, returns 404 error if not found
  if (urlDatabase[`${req.params.shortURL}`] === undefined) {
    res.write('<h1>Error 404: URL not found</h1>');
    res.end();
    return;
  } else {
    //redirects to the longURL
    const longURL = urlDatabase[`${req.params['shortURL']}`]['longURL'];
    res.redirect(longURL);
  }
});

// POST /:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  let deleteKey = req.params.shortURL;

  //checking if the user_id is the same as the userID for that shortURL, if not it won't allow the POST request to delete from the database and return a 401 error
  if (req.session.user_id === urlDatabase[deleteKey].userID) {
    delete urlDatabase[`${deleteKey}`];
    res.redirect(`/urls`);
  } else {
    res.status(401);
    res.statusMessage = 'Unauthorized';
    res.end('Error Status 401: You do not have permission to delete this URL.');
  };
});



// GET /register
app.get("/register", (req, res) => {

  let userID = req.body;
  let templateVars = { urls: urlsForUser(userID), user_id: req.session.user_id, users};
  if (isLoggedIn(userID) === false) {
    res.render('registration', templateVars);
  } else
    res.redirect(`/urls`);
  res.end();
  return;
});

// POST /register
app.post("/register", (req, res) => {
  const newUserEmail = req.body.email;
  const newUserPassword = bcrypt.hashSync(req.body.password, 10);

  // checking if form is empty, if it is returns error 400
  if (req.body.email === '' || req.body.password === '') {
    res.write('<h1>Error 400: Bad Request</h1><h2>Empty Request</h2>');
    res.end();
    return;
  };

  //checking if user already exists in database
  for (let user in users) {
    let userID = user;
    if (newUserEmail === emailLookup(userID)) {
      res.write('<h1>Error 400: Bad Request</h1><h2>User already exists</h2>');
      res.end();
      return;
    };
  };

  req.session.user_id = generateRandomString(6);
  userID = req.session.user_id;

  //updates users database with the new user info from the forms, this will only execute if the above two if statements failed (a good thing!)
  users[`${userID}`] = {
    id: userID,
    email: newUserEmail,
    password: newUserPassword,
  };

  res.redirect('/urls');
});

// GET /login
app.get("/login", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = { urls: urlsForUser(userID), user_id: req.session.user_id, users};
 
  if (isLoggedIn(userID) === false) {
    res.render('login', templateVars);
  } else
    res.redirect(`/urls`);
  res.end();
  return;
});


// POST /login
app.post("/login", (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;

  // if foundCounter is increased by 1 then username and password were matched in loop.
  let foundCounter = 0;

  //looping through users and comparing database vs. inputted info of BOTH email and password to ensure both match
  for (let user in users) {
    if (emailLookup(user) === loginEmail && bcrypt.compareSync(loginPassword ,users[`${user}`].password)) {
      req.session.user_id = users[`${user}`].id;
      foundCounter ++;
    };
  };
  // if foundcounter never incremented (that is, went to 1) then will return error 403 code since no match was found in database
  if (foundCounter !== 1) {
    res.write('<h1>403: Invalid login</h1>');
    res.end();
    return;
  };
  res.redirect(`/urls`);
});


// POST /logout
app.post("/logout", (req, res) => {

  //clears cookies when logging out and redirects to /urls
  req.session = null;
  res.redirect(`/urls`);
});


// 404 page ('wildcard' page if a url is entered that doesn't exist elsewhere, will return a 404: not found error)
app.get("*", (req, res) => {
  res.send("<html><body><h1>404: Page Not Found</h1></body></html>\n");
});


// LISTEN ------------------------------------------------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});