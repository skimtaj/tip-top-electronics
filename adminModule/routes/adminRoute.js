const express = require('express');
const route = express.Router();
const multer = require('multer');
const path = require('path');
const adminRatelimit = require('../../adminRateLimit/admin_rate_limit');
const adminAuth = require('../../middleware/admin_auth')


route.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const sharp = require('sharp');
const fs = require('fs');

const compressImage = async (req, res, next) => {
    try {
        if (!req.file) return next();

        const filePath = req.file.path;
        const tempPath = filePath + '.tmp';

        await sharp(filePath)
            .rotate()
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .webp({ quality: 75 })
            .toFile(tempPath);

        fs.renameSync(tempPath, filePath);

        next();

    } catch (error) {
        next(error);
    }
};

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



const { adminLoginPost, adminLogin, adminRegisterPost, adminRegister, downloadSalesReport, approvereturn, downloadUserList, doenloadStockBalance, adminDsahboard, makeDeliver, approveCancel, viewOrder, orderList, editProductPost, editProduct, deleteProduct, productList, addNewProduct, addNewProductPost } = require('../controllers/admin_controllers')




route.get('/admin-dashboard', adminAuth, adminDsahboard);

route.get('/admin/auth/register', adminRegister);
route.post('/admin/auth/register', adminRatelimit, adminRegisterPost);

route.get('/admin/auth/login', adminLogin);
route.post('/admin/auth/login', adminLoginPost)



route.get('/admin-dashboard/products/add-new', adminAuth, addNewProduct);
route.post('/admin-dashboard/products/add-new', upload.single('product_image'), compressImage, addNewProductPost);

route.get('/admin-dashboard/products', adminAuth, productList);

route.get('/delete-product/:productid', deleteProduct);

route.get('/admin-dashbaord/products/edit/:productid', editProduct);

route.post('/admin-dashbaord/products/edit/:productid', upload.single('product_image'), editProductPost);


route.get('/admin-dashboard/orders', adminAuth, orderList);

route.get('/admin-dashbaord/order/view/:orderid', adminAuth, viewOrder);

route.get('/admin-dashboard/orders/:orderid/items/:productid/approve-cancellation', adminAuth, approveCancel);

route.get('/admin-dashboard/orders/:orderid/items/:productid/approve-return', adminAuth, approvereturn);

route.get('/admin-dashboard/orders/:orderid/deliver', adminAuth, makeDeliver);

route.get('/download-stock-balance', adminAuth, doenloadStockBalance);
route.get('/download-user-list', downloadUserList);

route.get('/download-sale-report', downloadSalesReport);



module.exports = route;