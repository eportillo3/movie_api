const express = require("express");
bodyParser = require("body-parser");
morgan = require("morgan");
mongoose = require("mongoose");
Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect(process.env.CONNECTION_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();

app.use(morgan("common"));
app.use(express.static("public"));
app.use(bodyParser.json());

const cors = require("cors");
app.use(cors());

const passport = require("passport");
require("./passport");

let auth = require("./auth")(app); //this line must be added after bodyParser function

let allowedOrigins = ["http://localhost:8080", "http://localhost:1234"];

const { check, validationResult } = require("express-validator");

/**
 * API endpoint to the homepage
 */
app.get("/", (req, res) => {
  res.send("Welcome to MyFlix!");
});

/**
 * API endpoint to get all movies
 */
app.get(
  "/movies",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.find()
      .then((movies) => {
        res.status(201).json(movies);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * API endpoint to get a movie by title
 */
app.get(
  "/movies/:Title",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.findOne({
      Title: req.params.Title,
    })
      .then((movie) => {
        res.status(201).json(movie);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * API endpoint to get genre by title
 */
app.get(
  "/movies/Genres/:Title",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.findOne({
      Title: req.params.Title,
    })
      .then((movie) => {
        res.status(201).json(movie.Genre.Name + ". " + movie.Genre.Description);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * API endpoint to get director by name
 */
app.get(
  "/movies/Directors/:Name",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Movies.findOne({
      "Director.Name": req.params.Name,
    })
      .then((movie) => {
        res.status(201).json(movie.Director.Name + ": " + movie.Director.Bio);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * API endpoint to create a new user
 */
app.post(
  "/users",
  [
    check("Username", "Username is required").isLength({
      min: 5,
    }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({
      Username: req.body.Username,
    })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + "already exists");
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((error) => {
              console.error(error);
              res.status(500).send("Error: " + error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send("Error: " + error);
      });
  }
);

/**
 * API endpoint to get all user
 */
app.get(
  "/users",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.find()
      .then((users) => {
        res.status(201).json(users);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * API endpoint to get user by username
 */
app.get(
  "/users/:Username",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOne({
      Username: req.params.Username,
    })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * API endpoint to update user information's
 */
app.put(
  "/users/:Username",
  [
    check("Username", "Username is required").isLength({
      min: 5,
    }),
    check(
      "Username",
      "Username contains non-alphanumeric characters — not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid.").isEmail(),
  ],
  (req, res) => {
    // Checks validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({
        errors: errors.array(),
      });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);

    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      {
        new: true,
      },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.status(201).json(updatedUser);
        }
      }
    );
  }
);

/**
 * API endpoint to add favorite movies to a user
 */
app.post(
  "/users/:Username/Movies/:MovieID",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $push: {
          FavoriteMovies: req.params.MovieID,
        },
      },
      {
        new: true,
      },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * API endpoint to delete favorite movies from a user
 */
app.delete(
  "/users/:Username/Movies/:MovieID",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndUpdate(
      {
        Username: req.params.Username,
      },
      {
        $pull: {
          FavoriteMovies: req.params.MovieID,
        },
      },
      {
        new: true,
      },
      (err, updatedUser) => {
        if (err) {
          console.error(err);
          res.status(500).send("Error: " + err);
        } else {
          res.json(updatedUser);
        }
      }
    );
  }
);

/**
 * API endpoint to delete a user from the database by username
 */
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", {
    session: false,
  }),
  (req, res) => {
    Users.findOneAndRemove({
      Username: req.params.Username,
    })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + " was not found.");
        } else {
          res.status(200).send(req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Error: " + err);
      });
  }
);

/**
 * Function to listen for request
 */
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on Port " + port);
});
