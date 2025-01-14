const express = require("express");
const passport = require('passport');
const router = express.Router();
const User = require("../models/User");
const mailer = require("../config/nodemailer.config")

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


router.get("/login", (req, res, next) => {
  res.render("auth/login", {
    "message": req.flash("error")
  });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", (req, res, next) => {

  res.render("auth/signup");
});

router.post("/signup", (req, res, next) => {

  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  if (!username || !password || !email) {
    res.render("auth/signup", {
      message: "Indicate username and password"
    });
    return;
  }

  User.findOne({
    username
  }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", {
        message: "The username already exists"
      });
      return;
    }

    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let token = ""

    for (let i = 0; i < 25; i++) {
      // console.log(characters)
      token += characters[Math.floor(Math.random() * characters.length)]
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass,
      email,
      confirmationCode: token
    });

    newUser.save()

      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        res.render("auth/signup", {
          message: "Something went wrong"
        });
      })


    router.get('/confirm', (res, req) => res.render("auth/confirmation"))

    const message = `Welcome to HELL ${username} your confirmation link is http://localhost:3000/auth/confirm/${token}`

    mailer.sendMail({
        from: '"Ironhacker Email 👻" <tucusitasi@gmail.com>',
        to: email,
        subject: "Email de confirmacion",
        text: message,
        html: `<b>${message}</b>`
      })
      .then(info => res.render('email-sent', {
        email,
        subject,
        message,
        info
      }))
      .catch(error => console.log(error));
  })

});


router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;