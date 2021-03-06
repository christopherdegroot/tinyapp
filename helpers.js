//function to get a user by their email address
const getUserByEmail = function(email, database) {
  for (let key in database) {
    if (database[`${key}`].email === email) {
      return (database[`${key}`].id)
    };
  };
};

//function to generate random string
const generateRandomString = function(length) {
  let result = '';
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

//function to lookup a user's email through their user ID
const emailLookup = function(user_id, database) {
  const userID = user_id;
  const email = database[`${userID}`].email;
  return email;
};

//function to check if a user is logged in
const isLoggedIn = function(userID, database) {
  if (database.hasOwnProperty(userID)) {
    return true;
  } else return false;
};

//function to check what urls in the global database a user has (uses user id as a parameter)
const urlsForUser = function(id, urlDatabase) {
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


module.exports = { getUserByEmail, getUserByEmail, generateRandomString, emailLookup, isLoggedIn, urlsForUser }