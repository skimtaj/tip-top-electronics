const mongoose = require('mongoose');
const orderSchema = mongoose.Schema({


    is_read: {

        type: Boolean,
        default: false
    },

    invoice_no: {

        type: String,
    },

    customer_name: {

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

    full_address: {

        type: String,
        trim: true
    },

    total_amount: {

        type: Number,
        trim: true
    },

    order_date: {

        type: String,
        trim: true
    },

    order_status: {

        type: String,
        default: 'In Progress',
        trim: true
    },

    items: [{

        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'insert_product_model'
        },

        item_status: {

            type: String,
            default: 'In Progress',
            trim: true
        },

        item_profit: {

            type: Number,
            trim: true
        },

        product_image: {

            type: String
        },

        item_name: {

            type: String,
            trim: true
        },

        price: {

            type: Number,
            trim: true
        },

        qty: {

            type: Number,
            trim: true
        },

        item_amount: {

            type: Number,
            trim: true
        }
    }]


});

const order_model = mongoose.model('order_model', orderSchema);

module.exports = order_model;