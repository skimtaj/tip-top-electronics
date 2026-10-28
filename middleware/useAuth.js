const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const JWT = require('jsonwebtoken');
require('dotenv').config();

app.use(cookieParser());

const userAuth = (req, res, next) => {

    const token = req.cookies.userToken;
    if (!token) {
        req.flash('error', 'Please log in your account ');
        return res.redirect('/')
    };

    const verified = JWT.verify(token, process.env.User_Token_Password);
    req.userId = verified._id;
    return next()
};

module.exports = userAuth