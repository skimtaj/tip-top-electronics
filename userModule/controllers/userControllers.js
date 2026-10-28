
const bcryptjs = require("bcryptjs");
const insert_product_model = require("../../adminModule/models/insert_product_model");
const user_account_model = require("../models/user_account_model");
const order_model = require("../../adminModule/models/order_model");



const homePage = async (req, res) => {
    try {
        const { search } = req.query;

        let searchProducts = [];

        if (search && search.trim() !== '') {
            searchProducts = await insert_product_model.find({
                $or: [
                    {
                        product_name: {
                            $regex: search.trim(),
                            $options: 'i'
                        }
                    },
                    {
                        category: {
                            $regex: search.trim(),
                            $options: 'i'
                        }
                    }
                ]
            });
        }


        if (search && search.trim() !== '' && searchProducts.length === 0) {
            return res.render('../userModule/Views/not_found_page', {
                search
            });
        }

        if (searchProducts.length >= 1) {

            res.render('../userModule/Views/search_result_product', { searchProducts });

        }

        const allProducts = await insert_product_model.find().sort({ _id: -1 }).limit(6).lean();


        res.render('../userModule/Views/home', { allProducts, search });


    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }


};

const viewProductDetails = async (req, res) => {

    try {

        const productSourse = await insert_product_model.findById(req.params.productid)

        res.render('../userModule/Views/product_details', { productSourse })

    }

    catch (err) {
        const productSourse = await insert_product_model.findById(req.params.productid)
        req.flash('error', ' Something is wrong');
        return res.redirect(`/products/view-details/${productSourse._id}`)

    }

}

const userRegister = async (req, res) => {

    try {

        const userdata = req.body;

        const existEmail = await user_account_model.findOne({ email: userdata.email });

        if (existEmail) {

            req.flash('error', 'Email already exist');
            return res.redirect('/')
        };

        const existMobile = await user_account_model.findOne({ mobile: userdata.mobile });

        if (existMobile) {
            req.flash('error', 'Mobile already exist');
            return res.redirect('/')
        };

        const new_user_account_model = user_account_model(userdata);
        await new_user_account_model.save();

        const token = await new_user_account_model.generateUserToken();


        res.cookie('userToken', token), {
            httpOnly: true,
            secure: true,
            maxAge: 365 * 24 * 60 * 60 * 1000,
        }

        req.flash('success', 'Account created');
        return res.redirect('/')

    }

    catch (err) {

        console.log('User signup error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/')
    }

};

const userLoginPost = async (req, res) => {

    try {

        const userLoginDetails = req.body;
        const userEmail = await user_account_model.findOne({ email: userLoginDetails.email });

        if (userEmail) {

            const matchPassword = await bcryptjs.compare(userLoginDetails.password, userEmail.password);

            if (matchPassword) {

                const token = await userEmail.generateUserToken();

                res.cookie('userToken', token), {
                    ttpOnly: true,
                    secure: true,
                    maxAge: 365 * 24 * 60 * 60 * 1000,
                }

                req.flash('success', `Thank you ${userEmail.name}`)
                return res.redirect('/')
            }

            else {
                req.flash('error', 'Incorrect Email or Password');
                return res.redirect('/')
            }

        }

        else {

            req.flash('error', 'Acoount details incorrect');
            return res.redirect('/')
        }



    }

    catch (err) {

        console.log('User login error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/')

    }
}

const addTocard = async (req, res) => {

    try {

        const productSourse = await insert_product_model.findById(req.params.productid);
        const userSourse = await user_account_model.findById(req.userId).populate('cart');

        userSourse.cart.push(productSourse._id);
        await userSourse.save();

        req.flash('success', 'Added successfully');
        return res.redirect('/')

    }

    catch (err) {
        console.log('Add to card error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/')
    }

}

const cart = async (req, res) => {

    try {

        const userSourse = await user_account_model.findById(req.userId).populate('cart')
        res.render('../userModule/Views/cart_page', { userSourse })
    }

    catch (err) {

        req.flash('error', 'Something is wrong');
        return res.redirect('/')

    }
};

const removeCart = async (req, res) => {

    const productSourse = await insert_product_model.findById(req.params.productid);
    const userSourse = await user_account_model.findById(req.userId).populate('cart');

    userSourse.cart.pull(productSourse._id);
    await userSourse.save();

    req.flash('success', 'Item removed from card');
    return res.redirect('/')
}


const orderPost = async (req, res) => {

    try {

        const orderData = req.body;

        for (const i of orderData.items) {

            const productSourse = await insert_product_model.findOne({
                product_name: i.item_name,
                product_image: i.product_image
            });

            if (!productSourse) {
                req.flash('error', 'Product not found');
                return res.redirect('/user/carts');
            }

            if (Number(i.qty) > productSourse.stock_qty) {

                req.flash(
                    'error',
                    `Not enough stock available. Only ${productSourse.stock_qty} items are available`
                );

                return res.redirect('/user/carts');
            }

            productSourse.stock_qty -= Number(i.qty);

            await productSourse.save();

            if (productSourse.stock_qty >= 5) {
                productSourse.stock_status = 'In Stock'
            }

            else if (productSourse.stock_qty >= 3) {
                productSourse.stock_status = 'Low Stock'
            }

            else if (productSourse.stock_qty === 0) {
                productSourse.stock_status = 'Out of Stock'
            };

            await productSourse.save();

            i.item_profit = Number(i.item_amount) - productSourse.purchase_price * Number(i.qty)

        }

        const today = new Date();
        const currentYear = today.getFullYear();

        const totalOrder = await order_model.countDocuments();

        orderData.invoice_no =
            `TTE-${currentYear}-${String(totalOrder + 1).padStart(5, '0')}`;

        const new_order_model = await order_model.create(orderData);

        const userSourse = await user_account_model.findById(req.userId);

        if (!userSourse) {
            throw new Error('User not found');
        }

        userSourse.order.push(new_order_model._id);

        await userSourse.save();


        console.log(new_order_model)

        req.flash('success', 'Order placed successfully');

        return res.redirect('/user/carts');

    }


    catch (err) {

        console.log('Order post error:', err);

        req.flash('error', 'Something went wrong');

        return res.redirect('/user/carts');

    }

};


const mobileCategory = async (req, res) => {

    try {
        const mobileCategory = await insert_product_model.find({ category: 'Mobile' }).lean()
        res.render('../userModule/Views/mobile_category_product', { mobileCategory })
    }

    catch (err) {

        req.flash('error', 'Something is wrong');
        return res.redirect('/')
    }
};

const acCategory = async (req, res) => {

    try {
        const acCategory = await insert_product_model.find({ category: 'AC' }).lean()
        res.render('../userModule/Views/ac_category_product', { acCategory })
    }

    catch (err) {
        req.flash('error', 'Something is wrong');
        return res.redirect('/')
    }
};

const fridgeCategory = async (req, res) => {

    try {

        const fridgeCategory = await insert_product_model.find({ category: 'Fridge' }).lean()
        res.render('../userModule/Views/fridge_category_product', { fridgeCategory })

    }

    catch (err) {
        req.flash('error', 'Something is wrong');
        return res.redirect('/')
    }
}

const mobileAcceseriesCategory = async (req, res) => {

    try {

        const mobileAcceseriesCategory = await insert_product_model.find({ category: 'Mobile Acceseries' }).lean();
        res.render('../userModule/Views/mobile_acceseries_product', { mobileAcceseriesCategory })
    }

    catch (err) {
        req.flash('error', 'Something is wrong');
        return res.redirect('/')
    }
}

const order = async (req, res) => {

    const userSourse = await user_account_model.findById(req.userId).populate('order')

    res.render('../userModule/Views/order_page', { userSourse })
}

const cancelOrderReq = async (req, res) => {

    try {


        await order_model.findOneAndUpdate(
            {
                _id: req.params.orderid,
                'items._id': req.params.productid
            },
            {
                $set: {
                    order_status: 'Cancel Request',
                    'items.$.item_status': 'Cancel Request'
                }
            }
        );

        req.flash('success', 'Cancel request send successfully');
        return res.redirect('/user/order')

    }

    catch (err) {

        console.log('Order Cancelling error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/user/order')
    }

};

const returnOrderReq = async (req, res) => {

    await order_model.findOneAndUpdate(
        {
            _id: req.params.orderid,
            'items._id': req.params.productid
        },
        {
            $set: {
                order_status: 'Return Request',
                'items.$.item_status': 'return Request'
            }
        }
    );

    req.flash('success', 'Return request send successfully');
    return res.redirect('/user/order')

};







module.exports = { returnOrderReq, cancelOrderReq, order, mobileAcceseriesCategory, fridgeCategory, acCategory, mobileCategory, orderPost, removeCart, cart, addTocard, userLoginPost, userRegister, viewProductDetails, homePage }