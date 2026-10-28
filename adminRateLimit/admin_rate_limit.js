
const rateLimit = require('express-rate-limit');

const adminRatelimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 requests

    handler: (req, res) => {
        req.flash('error', 'Too many requests. Please try again after 15 minutes.');
        return res.redirect('/admin/auth/register');
    }
});


module.exports = adminRatelimit;
