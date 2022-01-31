// Requirements
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');


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

// DRY FUNCTIONS/REQUIRES --------------------------------------------------------------------------------------------------------

const { getUserByEmail, generateRandomString, emailLookup, isLoggedIn, urlsForUser } = require('./helpers.js');

// HTTP REQUESTs -------------------------------------------------------------------------------------------------------------

// GET /
app.get('/', (req, res)=>{
  res.redirect(`/login`);
  res.end();
});


// POST /:shortURL
app.post("/urls/:url", (req, res) => {
  const userID = req.session.user_id;
  const urlKey = req.params.url;
  const newLongURL = req.body['longURL'];

  if (newLongURL.includes('http') || newLongURL.includes('https')) {
    urlDatabase[urlKey] = {longURL: `${newLongURL}`, userID};
  } else {
    urlDatabase[urlKey] = {longURL: `http://www.${newLongURL}`, userID};
  }

  res.redirect(`/urls`);
  res.end();
});


// GET /urls
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = { urls: urlsForUser(userID, urlDatabase), user_id: req.session.user_id, users};

  // checking if a user is logged in, if not it will show a view that tells them a relevant error code and links to register/login
  if (isLoggedIn(userID, users) === true) {
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_noshow", templateVars);
  }
});


// GET /urls/new
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  
  if (isLoggedIn(userID, users) === true) {
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
  const userID = req.session.user_id;
  
  if (isLoggedIn(userID, users) === true) {
    const newKey = generateRandomString(6);
    if (req.body.longURL.includes('http://') || req.body.longURL.includes('https://')) {

      urlDatabase[newKey] = {longURL: `${req.body["longURL"]}`, userID},
      res.redirect(`urls/${newKey}`);

    } else {
      urlDatabase[newKey] = {longURL: `http://www.${req.body["longURL"]}`, userID},
      res.redirect(`urls/${newKey}`);
    }
  } else
    res.write(`403: Forbidden`);
  res.end();
});


// GET /urls/:shortURL
app.get("/urls/:url", (req, res) => {
  const userKey = req.session.user_id;
  const shortURL = req.params.url;

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

    if (isLoggedIn(userKey, users) === true && urlDatabase[`${shortURL}`].userID === userKey) {
      res.render("urls_show", templateVars);
    } else {
      res.render("urls_shortnoshow", templateVars);
    }
  }
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
  const deleteKey = req.params.shortURL;

  //checking if the user_id is the same as the userID for that shortURL, if not it won't allow the POST request to delete from the database and return a 401 error
  if (req.session.user_id === urlDatabase[deleteKey].userID) {
    delete urlDatabase[`${deleteKey}`];
    res.redirect(`/urls`);
  } else {
    res.status(401);
    res.statusMessage = 'Unauthorized';
    res.end('Error Status 401: You do not have permission to delete this URL.');
  }
});


// GET /register
app.get("/register", (req, res) => {

  const userID = req.body;
  const templateVars = { urls: urlsForUser(userID, urlDatabase), user_id: req.session.user_id, users};
  if (isLoggedIn(userID, users) === false) {
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
  }

  //checking if user already exists in database, if they exist returns error 400
  for (const user in users) {
    const userID = user;
    if (newUserEmail === emailLookup(userID, users)) {
      res.write('<h1>Error 400: Bad Request</h1><h2>User already exists</h2>');
      res.end();
      return;
    }
  }

  req.session.user_id = generateRandomString(6);
  const userID = req.session.user_id;

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
  const userID = req.session.user_id;
  const templateVars = { urls: urlsForUser(userID), user_id: req.session.user_id, users};
 
  if (isLoggedIn(userID, users) === false) {
    res.render('login', templateVars);
  } else
    res.redirect(`/urls`);
  res.end();
  return;
});


// POST /login
app.post("/login", (req, res) => {
  const loginEmail = req.body.email;
  const loginPassword = req.body.password;
  const userID = req.session.user_id;

  // checking if a user trying to access /login page is logged in already, if they are, will skip to res.redirect('/urls')
  if (isLoggedIn(userID, users) === false) {

    //looping through users and comparing database vs. inputted info of BOTH email and password to ensure both match
    for (const user in users) {
      if (emailLookup(user, users) === loginEmail && bcrypt.compareSync(loginPassword ,users[`${user}`].password)) {
        req.session.user_id = users[`${user}`].id;
      }
    }
    res.redirect(`/urls`);
  }
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