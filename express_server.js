const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let keyArray = [];
  keyArray.push(generateRandomString());
  let newKey = keyArray[0];

  // console.log('logging newKey after pushing random string', newKey);
  urlDatabase[newKey] = `http://www.${req.body["longURL"]}`,
  
  // console.log(urlDatabase)
  res.redirect(`urls/${newKey}`);         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  // console.log(urlDatabase)
  // console.log(req.params);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  // console.log('logging req.params', req.params)
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //console.log('*** > logging req.params for incoming delete request', req.params)
  let deleteKey = req.params.shortURL;
  // console.log('logging delete key after variable declaration', deleteKey)
  // console.log(urlDatabase[`${deleteKey}`])
  // console.log('logging pre-delete', urlDatabase);
   delete urlDatabase[`${deleteKey}`];
  //console.log('logging post-delete', urlDatabase);

  res.redirect(`/urls`)
});

app.post("/urls/:id", (req, res) =>{
  //  console.log(req.params.id);
  // console.log(req.body);
  let key = req.params.id;
  let newLongURL = req.body.longURL;
  console.log('logging new long URL', newLongURL);
  console.log('logging key', key);

  console.log('log urlDatabase before update', urlDatabase)
  
  urlDatabase[`${key}`] = 'http://www.' + newLongURL;
  console.log('log urlDatabase after update', urlDatabase)

  res.redirect(`/urls`)
});


app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});