const express = require('express');
const app = express();
require('dotenv').config();
const db = require('./DB');
const path = require('path');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');

const flash = require('connect-flash');
const session = require('express-session');
require('dotenv').config();

app.use(session({
  secret: process.env.session,
  resave: false,
  saveUninitialized: true,
}));

app.use(flash());

app.use((req, res, next) => { res.locals.messages = req.flash(); next(); });
const bodyParser = require('body-parser');

app.use(bodyParser.json());

const userRoutes = require('./userModule/routes/userRoute');
const adminRoute = require('./adminModule/routes/adminRoute')

app.use(userRoutes);
app.use(adminRoute);

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log('Server is conected')
})


