const jwtSecret = "your_jwt_secret";

const jwt = require("jsonwebtoken"),
  passport = require("passport");

require("./passport");

/**
 * Function to generate authentication token with expiration and algorithm settings
 * @param {string} user
 * @returns JWTToken
 */
let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // username being encoded in jwt
    expiresIn: "7d", // specifies token expiration in days
    algorithm: "HS256", // algorithm used to sign or encode the values of the jwt
  });
};

/**
 * API endpoint which authenticates a user after entering login credentials
 */
module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: "Something is not right",
          user: user,
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        return res.json({ user, token });
      });
    })(req, res);
  });
};
