// simple module for connecting a Node.js application to a MongoDB database

const mongodb = require('mongodb');// introduces the "npm install mongodb" driver in this file, a library that provides a high-level 
// API to interact with MongoDB databases from Node.js applications

// class that allows you to make connections to MongoDB and issue commands
const MongoClient = mongodb.MongoClient;

let database;

async function connect() {

  // line tries to establish a connection to a MongoDB server, If the connection is successful, a MongoClient object is returned and assigned to the client constant
  const client = await MongoClient.connect('mongodb://127.0.0.1:27017'); 
  database = client.db('blog'); // connection to specific databse (blog) in that server
}

function getDb() {
  if (!database) {
    throw { message: 'Database connection not established!' };
  }
  return database;
}

module.exports = {
  connectToDatabase: connect,
  getDb: getDb
};