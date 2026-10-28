const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(cookieParser());


const adminAuth = (req, res, next) => {

    const token = req.cookies.adminToken;

    if (!token) {

        req.flash('error', 'You have to login');
        return res.redirect('/nm/admin-login')
    }

    const verified = jwt.verify(token, process.env.Admin_Token_Password);

    req.adminId = verified._id;
   return next();
}

module.exports = adminAuth;