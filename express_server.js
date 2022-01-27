const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Verstappen'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");



// DATA
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
// no longer needed with cookie encryption?
let generateRandomString = function(length) {
  let result = '';
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

let emailLookup = function(user_id) {
  let userID = user_id;
  let email = users[`${userID}`].email;
  return email;
};
  
let isLoggedIn = function(cookies) {
  if (cookies === undefined) {
    return false;
  } else return true;
};

let urlsForUser= function(id) {
  let filteredUrlDatabase = {};
  for (let key in urlDatabase) {
    // console.log(urlDatabase[`${key}`].userID);
    if (urlDatabase[`${key}`].userID === id) {
    filteredUrlDatabase[`${key}`] = {
      longURL: urlDatabase[`${key}`].longURL,
      userID: urlDatabase[`${key}`].userID
  };
    
    };
  };
  return filteredUrlDatabase;
};


// POST /:shortURL
app.post("/urls/:url", (req, res) => {

  let userID = req.session.user_id;
  // console.log('logging userID', userID);
  let urlKey = req.params.url;
  // console.log('logging urlKey', urlKey);
  let newLongURL = req.body['longURL'];

  urlDatabase[urlKey] = {longURL: `http://www.${newLongURL}`, userID},
  // console.log('urlDatabase updated:', urlDatabase);
  res.redirect(`/urls`);
  res.end();
});

// GET /urls
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = { urls: urlsForUser(userID), user_id: req.session.user_id, users}
  if (isLoggedIn(userID) === true) {
    res.render("urls_index", templateVars);
  } else {
  // let templateVars = { urls: urlsForUser(userID)};
     res.render("urls_noshow", templateVars);
    //res.write('<body><h1>Please <a href="/login">log in</a> to see saved urls. You may need to <a href="/register">register</a> before you can log in. </h1></body>');
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
  console.log('logging userID in post/urls', userID);
  if (isLoggedIn(userID) === true) {
    let keyArray = [];
    keyArray.push(userID);
    let newKey = keyArray[0];
    urlDatabase[newKey] = {longURL: `http://www.${req.body["longURL"]}`, userID},
    
    res.redirect(`urls/${newKey}`);
  } else
    res.write(`403: Forbidden`);
  res.end();
});



// GET /:shortURL
app.get("/urls/:url", (req, res) => {
  let userKey = req.session.user_id;
  let userObj = users[userKey];
  let shortURL = req.params.url;
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
});

// GET /u/:shortURL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[`${req.params.shortURL}`] === undefined) {
    res.write('404: Not Found');
    res.end();
    return;
  } else {
    const longURL = urlDatabase[`${req.params['shortURL']}`]['longURL'];
    res.redirect(longURL);
  }
});

// POST /:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  let deleteKey = req.params.shortURL;
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
  let userID = req.session.user_id;
  if (isLoggedIn(userID) === false) {
    res.render('registration');
  } else
    res.redirect(`/urls`);
  res.end();
  return;
});

// POST /register
app.post("/register", (req, res) => {


  // console.log('logging users in POST/register', users)
  // console.log('logging userID in POST /register', userID);
  newUserEmail = req.body.email;
  newUserPassword = bcrypt.hashSync(req.body.password, 10);
  // console.log(newUserPassword);
 

  if (newUserEmail === '' || newUserPassword === '') {
    res.write('Error 400');
    res.end();
    return;
  }


  for (let user in users) {
    let userID = user;
    if (newUserEmail === emailLookup(userID)) {
      res.write('Error 400');
      res.end();
      return;
    }
  }

  req.session.user_id = generateRandomString(6);
  userID = req.session.user_id;

  users[`${userID}`] = {
    id: userID,
    email: newUserEmail,
    password: newUserPassword,
  };

  // console.log('LOGGING USERS AFTER ASSIGNMENT IN POST/REGISTER', users);
  // console.log('LOGGING REQ.SESSION.USER_ID', req.session.user_id);
  // console.log('LOGGING userID', userID);



  res.redirect('/urls');
});

// GET /login
app.get("/login", (req, res) => {
  let userID = req.session.user_id;
  if (isLoggedIn(userID) === false) {
    res.render('login');
  } else
    res.redirect(`/urls`);
  res.end();
  return;
});


// POST /login
app.post("/login", (req, res) => {
  let loginEmail = req.body.email;
  let loginPassword = req.body.password;
  // console.log('logging loginPassword generated from login request', loginPassword);
  // console.log('logging users to see user info for login request', users);

  // if foundCounter is increased by 1 then username and password were matched in loop.
  let foundCounter = 0;


  for (let user in users) {
    // console.log('logging for lookup loop', users[`${user}`].password);
    // console.log("trying to log the bcrypt compare", bcrypt.compareSync(loginPassword ,users[`${user}`].password));
    if (emailLookup(user) === loginEmail && bcrypt.compareSync(loginPassword ,users[`${user}`].password)) {
      console.log('the check is PASSING');
      req.session.user_id = users[`${user}`].id;
      //res.cookie('user_id', users[`${user}`].id);
      foundCounter ++;
    }
  }


  if (foundCounter !== 1) {
    res.write('403: Forbidden');
    res.end();
    return;
  }
  
  res.redirect(`/urls`);
});

// POST /logout
app.post("/logout", (req, res) => {
  console.log(req.session.user_id);
  let userID = req.session.user_id;
  console.log(userID);
  req.session = null;

  // res.clearCookie(`${userID}`);
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