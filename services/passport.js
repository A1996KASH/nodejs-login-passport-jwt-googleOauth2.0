const passport = require('passport')
const localStrategy = require('passport-local').Strategy;
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const UserModel = require('../api/users/model')

exports.googleAuth =async (req, res, next) => 
passport.authenticate('google', {session: false, scope:  ['openid', 'profile', 'email']})(req, res, next)

exports.password = async (req, res, next) =>
passport.authenticate('login', { session: false }, (err, user, info) => {
    if (err || !user) {
        const error = new Error('An error occurred.');
        return next(error);
      }
  req.logIn(user, { session: false }, (err) => {
    if (err) return res.status(401).end()
    next()
  })
})(req, res, next)

passport.use('login', new localStrategy({
        usernameField: 'email',
        passwordField: 'password'
      }, async (email, password, done) => {
        try {
          const user = await UserModel.findOne({ email }).select('+password')
          if (!user) {
            return done(null, false, { message: 'User not found' })
          }
          const validate = await user.matchPassword(password);
      
          if (!validate) {
            return done(null, false, { message: 'Wrong Password' })
          }
          return done(null, user, { message: 'Logged in Successfully' })
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.use(new GoogleStrategy({
    clientID:     process.env.clientID,
    clientSecret: process.env.clientSecret,
    callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
    passReqToCallback   : true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    UserModel.findOne({ email: profile.email }, function (err, user) {
      return done(err, user);
    });
    try {
        const user = await UserModel.findOne({ email: profile.email }).select('+password')
        if (!user) {
          // return done(null, false, { message: 'User not found' })
          const user = await UserModel.create()
        }
        const validate = await user.matchPassword(password);
    
        if (!validate) {
          return done(null, false, { message: 'Wrong Password' })
        }
        return done(null, user, { message: 'Logged in Successfully' })
      } catch (error) {
        return done(error);
      }
  }
));