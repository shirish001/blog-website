const express = require("express");

const mongodb = require("mongodb"); // "npm install mongodb" driver

const db = require("../data/database");


const ObjectId = mongodb.ObjectId; //extracting the ObjectId class from the mongodb object, convert string representations of MongoDB
// document IDs back into an ObjectId instance, bc we cannot query with the auto string id format

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  const posts = await db
    .getDb()
    .collection("posts")
    .find({})
    .project({ title: 1, summary: 1, "author.name": 1 })
    .toArray();

  res.render("posts-list", { postsKey: posts });
});

router.get("/new-post", async function (req, res) {
  // access database then collection "authors" in it, fetch all docu in it in array format
  const authors = await db.getDb().collection("authors").find().toArray();
  res.render("create-post", { authorsKey: authors }); // pass the authors array on the rendered "create-post" ejs file
});

// for the form in create-post ejs file
router.post("/posts", async function (req, res) {
  const authorId = new ObjectId(req.body.author); // id in submitted form in string format converted to ObjectId

  // querying the "authors" collection in the "blog" database for a document with an _id field that matches authorId
  const author = await db //**
    .getDb()
    .collection("authors")
    .findOne({ _id: authorId });

  // new js object that includes details from the form submission
  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    author: {
      id: authorId,
      name: author.name, //**
      email: author.email, //**
    },
  };

  // This line is inserting the new post into the "posts" collection in the database.
  // "posts" collection will be created on the go when we insert the first document
  const result = await db.getDb().collection("posts").insertOne(newPost);
  console.log(result);
  res.redirect("/posts");
});


// The :id part of the path /posts/:id is indeed a placeholder for a parameter. In Express.js, when you define a route with parameters like this,
//  you can capture values that are part of the URL. These captured values are accessible through the req.params object within your route handler function

router.get("/posts/:id", async function (req, res, next) {
  // accessing the specific document for each specific id path from posts collection by matching document id= router id
  let postId = req.params.id;

  // manually handling the error if anything goes wrong in the async func execution bc then we will not move forward
  // and the site will crash
  try {
    postId = new ObjectId(postId);
  } catch (error) {
    return res.status(404).render("404");
    // return next(error);
  }

  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) }, { summary: 0 });

  if (!post) {
    return res.status(404).render("404");
  }
  // creates a new property on the post object called humanReadableDate,
  // which is a string representation of the post's date in a human-readable format
  post.humanReadableDate = post.date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  post.date = post.date.toISOString(); //converts the post's date to an ISO strin

  res.render("post-detail", { post: post });
});

//accessing the posts which need to be edited
router.get("/posts/:id/edit", async function (req, res) {
  const postId = req.params.id;
  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: new ObjectId(postId) }, { title: 1, summary: 1, body: 1 });

  if (!post) {
    return res.status(404).render("404");
  }

  res.render("update-post", { post: post });
});

// editing post routing
router.post("/posts/:id/edit", async function (req, res) {
  const postId = new ObjectId(req.params.id); //mongodb not flexible enough for converting string id into object here
  const result = await db
    .getDb()
    .collection("posts")
    .updateOne(
      { _id: postId },
      {
        $set: {
          title: req.body.title,
          summary: req.body.summary,
          body: req.body.content, // content bc textarea identifier for value is "name" attribute
          // date: new Date()
        },
      }
    );

  res.redirect("/posts");
});

router.post("/posts/:id/delete", async function (req, res) {
  const postId = new ObjectId(req.params.id);
  const result = await db
    .getDb()
    .collection("posts")
    .deleteOne({ _id: postId });
  res.redirect("/posts");
});

module.exports = router;
