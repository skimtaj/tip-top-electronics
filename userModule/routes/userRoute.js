const express = require('express');
const route = express.Router();
const userAuth = require('../../middleware/useAuth');
const path = require('path');
const multer = require('multer')

route.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const storage = multer.diskStorage({
    limits: { fileSize: 10000000 },
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },

    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
})

const upload = multer({ storage: storage })


const { returnOrderReq, cancelOrderReq, order, mobileAcceseriesCategory, fridgeCategory, acCategory, mobileCategory, orderPost, removeCart, cart, addTocard, userLoginPost, userRegister, viewProductDetails, homePage } = require('../../userModule/controllers/userControllers')


route.get('/', homePage);


route.get('/products/view-details/:productid', viewProductDetails);

route.post('/auth/register', userRegister);
route.post('/auth/login', userLoginPost);

route.get('/add-to-cart/:productid', userAuth, addTocard);

route.get('/user/carts', userAuth, cart);
route.get('/user/order', userAuth, order);


route.get('/user/remove-card/:productid', userAuth, removeCart)

route.post('/user/orders', userAuth, upload.single('product_image'), orderPost);




route.get('/mobile-category', mobileCategory);
route.get('/ac-category', acCategory);

route.get('/fridge-category', fridgeCategory);

route.get('/mobile-acceseries-category', mobileAcceseriesCategory);

route.get('/order-cancel/:productid/:orderid', userAuth, cancelOrderReq);
route.get('/order-return/:productid/:orderid', userAuth, returnOrderReq)


module.exports = route; 