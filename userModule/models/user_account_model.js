const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const JWT = require('jsonwebtoken');
require('dotenv').config();
const userAccountSchema = mongoose.Schema({

    name: {

        type: String,
        trim: true
    },

    mobile: {

        type: String,
        trim: true
    },

    email: {

        type: String,
        trim: true
    },

    password: {

        type: String,
        trim: true
    },

    token: [{

        tokens: {

            type: String
        }
    }],

    cart: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: 'insert_product_model'
    }],

    order: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: "order_model"
    }]
});


userAccountSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcryptjs.hash(this.password, 10);
    }
    next();
});


userAccountSchema.methods.generateUserToken = async function () {

    const tokens = JWT.sign({ _id: this._id.toString() }, process.env.User_Token_Password, { expiresIn: '365d' })
    this.token = this.token.concat({ tokens: tokens });
    await this.save();

    return tokens;
}

const user_account_model = mongoose.model('user_account_model', userAccountSchema);
module.exports = user_account_model;