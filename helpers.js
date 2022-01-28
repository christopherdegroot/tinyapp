const getUserByEmail = function(email, database) {
  for (let key in database) {
    // console.log(database[`${key}`].email)
    if (database[`${key}`].email === email) {
      return (database[`${key}`].id)
    };
  };
};

module.exports = { getUserByEmail }