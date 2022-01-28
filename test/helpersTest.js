const { assert } = require('chai');
const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.strictEqual(user, expectedUserID);
  });
    
   it('should return the right userID for the given email address', function(){
    const user = getUserByEmail("user@example.com", testUsers)
    assert.strictEqual(user, 'userRandomID');
   });

   it('should return undefined if a non-existant email address is input', function(){
    const user = getUserByEmail("user3@example.com", testUsers)
    assert.strictEqual(user, undefined);
   });

});
