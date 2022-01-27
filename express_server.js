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
  
let isLoggedIn = function (cookies) {
  if (cookies === undefined) {
    return false;
  } else return true;
};

// POST /:shortURL
app.post("/urls/:url", (req, res) => {

  let userID = req.params.url;
  let newLongURL = req.body['longURL'];

    urlDatabase[userID] = {longURL: `http://www.${newLongURL}`, userID},
    console.log(urlDatabase);
    res.redirect(`/urls`);
    res.end()
});

// GET /urls
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user_id: req.cookies.user_id, users};
  res.render("urls_index", templateVars);
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
 
  let userID = req.cookies.user_id;
  if (isLoggedIn(userID) === true) {
    const templateVars = {
      user_id: req.cookies.user_id, users,
    };
    res.render("urls_new", templateVars);
  } else 
  res.redirect(`/login`);
  res.end();
});

// POST /urls
app.post("/urls", (req, res) => {

  let userID = req.cookies.user_id;
  if (isLoggedIn(userID) === true) {
    let keyArray = [];
    keyArray.push(generateRandomString(6));
    let newKey = keyArray[0];
    urlDatabase[newKey] = {longURL: `http://www.${req.body["longURL"]}`, userID},
    console.log(urlDatabase);
    res.redirect(`urls/${newKey}`);
  } else 
  res.write(`403: Forbidden`);
  res.end();
});



// GET /:shortURL
app.get("/urls/:url", (req, res) => {
  let userID = req.cookies.user_id;
  if (isLoggedIn(userID) === true) {
    const templateVars = { shortURL: req.params['url'], longURL: urlDatabase[`${req.params['url']}`]['longURL'], user_id: req.cookies.user_id, users};
   res.render("urls_show", templateVars);
  } else 
  res.write(`403: Forbidden`);
  res.end();
  return;
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

// POST FOR DELETING URLS
app.post("/urls/:shortURL/delete", (req, res) => {
  let deleteKey = req.params.shortURL;
  delete urlDatabase[`${deleteKey}`];
  res.redirect(`/urls`);
});



// GET /register
app.get("/register", (req, res) => {
  let userID = req.cookies.user_id;
  if (isLoggedIn(userID) === false) {
    res.render('registration')
  } else 
  res.redirect(`/urls`);
  res.end();
  return;
});

// POST /register
app.post("/register", (req, res) => {
  newUserID = generateRandomString(6);
  newUserEmail = req.body.email;
  newUserPassword = req.body.password;


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

  users[`${newUserID}`] = {
    id: newUserID,
    email: newUserEmail,
    password: newUserPassword,
  };
  
  res.cookie('user_id', newUserID);
  res.redirect('/urls');
});

// GET /login
app.get("/login", (req, res) => {
  let userID = req.cookies.user_id;
  if (isLoggedIn(userID) === false) {
    res.render('login')
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


  for (let user in users) {
    if (emailLookup(user) === loginEmail && users[`${user}`].password === loginPassword) {
      res.cookie('user_id', users[`${user}`].id);
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