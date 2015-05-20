express = require('express')
passport = require('passport')
GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var GOOGLE_CLIENT_SECRET = "--- CLIENT SECRET ----";
var GOOGLE_CLIENT_ID = "--- CLIENT ID ----";
var CALLBACK_URL = "http://localhost:3000/auth/google/return"

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL
    },
    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            return done(null, profile);
        });
    }
));

app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
session = require('express-session');
path = require('path');
logger = require('logger');
cookieParser = require('cookie-parser');
bodyParser = require('body-parser');
passport = require('passport');

app.use(cookieParser())
app.use(session({secret: 'keyboard cat', resave: true, saveUninitialized: true}));
app.use(passport.initialize())
app.use(passport.session())

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    return_to_encoded = encodeURIComponent(req.query.return_to ? req.query.return_to : req.url)
    res.render('index', {user: req.user, return_to: return_to_encoded});
});

app.get('/account', ensureLoggedIn('/'), function (req, res) {
    res.render('account', {user: req.user});
});

app.get('/auth/google',
    function (req, res, next) {
        req.session.return_to = req.query.return_to;
        passport.authenticate('google', {scope: ['openid email']})(req, res, next);
    },
    function (req, res) {
    });

app.get('/auth/google/return',
    passport.authenticate('google', {failureRedirect: '/'}),
    function (req, res) {
        return_to = req.session.return_to;
        delete req.session.return_to;
        res.redirect(return_to);
    });

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

function ensureLoggedIn(options) {
    if (typeof options == 'string') {
        options = {redirectTo: options}
    }
    options = options || {};

    var url = options.redirectTo || '/';

    return function (req, res, next) {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return_to = appendQueryString(url, {return_to: req.originalUrl})
            return res.redirect(return_to);
        }
        next();
    }
}

function appendQueryString(originalUrl, new_params) {
    url = require('url')
    url_parts = url.parse(originalUrl, true, false)
    for (var paramName in new_params) {
        url_parts.query[paramName] = new_params[paramName]
    }
    return url.format(url_parts)
}

module.exports = app