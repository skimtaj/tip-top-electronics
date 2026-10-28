const mongoose = require('mongoose');
const productSchema = mongoose.Schema({

    product_name: {

        type: String,
        trim: true

    },

    product_image: {

        type: String,
        trim: true
    },

    category: {

        type: String,
        trim: true
    },

    purchase_price: {
        type: Number,
        trim: true
    },

    mrp: {

        type: Number,
        trim: true
    },

    sale_price: {

        type: Number,
        trim: true
    },

    stock_qty: {

        type: Number,
        trim: true

    },

    stock_status: {

        type: String,
        trim: true

    },

    short_description: {

        type: String,
        trim: true
    },

    order_status: {

        type: String,
        trim: true
    }


});

productSchema.index({
    product_name: 1,
    category: 1
})


const insert_product_model = mongoose.model('insert_product_model', productSchema);
module.exports = insert_product_model;