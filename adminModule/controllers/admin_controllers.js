
const insert_product_model = require('../../adminModule/models/insert_product_model');
const { order } = require('../../userModule/controllers/userControllers');
const user_account_model = require('../../userModule/models/user_account_model');
const admin_account_model = require('../models/admin_account_model');
const order_model = require('../models/order_model');
const exceljs = require('exceljs');
const bcryptjs = require('bcryptjs');


const addNewProduct = async (req, res) => {

    const totalUnreadOrder = await order_model.find({ is_read: false }).countDocuments();

    res.render('../adminModule/Views/product_inserting_form', { totalUnreadOrder })

};

const addNewProductPost = async (req, res) => {

    try {

        const productData = req.body;

        if (req.file) {
            productData.product_image = req.file.filename;
        }
        const new_insert_product_model = insert_product_model(productData);
        await new_insert_product_model.save();
        req.flash('success', 'Product added successfully');
        return res.redirect('/admin-dashboard/products')
    }

    catch (err) {
        console.log('Product adding error', err);
        req.flash('error', 'Someting is wrong');
        return res.redirect('/admin-dashboard/products/add-new')
    }
}

const productList = async (req, res) => {
    try {
        const { search, category, stock_status } = req.query;

        const page = Number(req.query.page) || 1;
        const limit = 5;
        const skip = (page - 1) * limit;

        let query = {};

        if (search && search.trim() !== '') {
            query.product_name = {
                $regex: search.trim(),
                $options: 'i'
            };
        }

        if (category) {
            query.category = category;
        }

        if (stock_status) {
            query.stock_status = stock_status;
        }

        const totalProductDoc =
            await insert_product_model.countDocuments(query);

        const totalPage = Math.ceil(totalProductDoc / limit);

        const productList = await insert_product_model
            .find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)


        const totalUnreadOrder = await order_model.find({ is_read: false }).countDocuments();



        res.render('../adminModule/Views/product_list', {

            totalUnreadOrder,
            currentPage: page,
            totalPage,
            nextPage: page < totalPage ? page + 1 : null,
            previousPage: page > 1 ? page - 1 : null,
            search,
            category,
            stock_status,
            productList
        });

    } catch (error) {
        console.error('Product list error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const deleteProduct = async (req, res) => {


    try {

        await insert_product_model.findByIdAndDelete(req.params.productid);
        req.flash('success', 'Product deleted successfully');
        return res.redirect('/admin-dashboard/products')

    }

    catch (err) {

        console.log('Product deleteing error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin-dashboard/products')

    }

};

const editProduct = async (req, res) => {

    const productSourse = await insert_product_model.findById(req.params.productid)

    res.render('../adminModule/Views/edit_product_form', { productSourse })
};

const editProductPost = async (req, res) => {

    try {

        const editProductData = req.body;

        if (req.file) {

            editProductData.product_image = req.file.filename
        }


        await insert_product_model.findByIdAndUpdate(req.params.productid, editProductData);
        req.flash('success', 'Product update successfully');
        return res.redirect('/admin-dashboard/products')

    }

    catch (err) {
        const productSourse = await insert_product_model.findById(req.params.productid)
        console.log('edit product post error', err);
        req.flash('error', 'Something is wrong')
        return res.redirect(`/admin-dashbaord/products/edit/${productSourse._id}`)

    }

};

const orderList = async (req, res) => {


    await order_model.updateMany({ is_read: false }, { $set: { is_read: true } })


    const { search } = req.query;
    const page = Number(req.query.page) || 1;

    const limit = 10;
    const skip = (page - 1) * limit;

    const totalOrderDoc = await order_model.countDocuments();
    const totalPage = Math.ceil(totalOrderDoc / limit);


    let query = {}


    if (search) {
        query.$or = [
            { customer_name: { $regex: search, $options: 'i' } },
            { invoice_no: { $regex: search, $options: 'i' } },
            { order_status: { $regex: search, $options: 'i' } },
            { order_date: { $regex: search, $options: 'i' } },

        ];
    }

    const allOrder = await order_model.find(query).skip(skip).limit(limit).lean();

    const totalUnreadOrder = await order_model.find({ is_read: false }).countDocuments();


    res.render('../adminModule/Views/order_list', { totalUnreadOrder, totalPage, search, allOrder, currentPage: page, previousPage: page > 1 ? page - 1 : null, nextPage: page < totalPage ? page + 1 : null })
};

const viewOrder = async (req, res) => {

    const orderSourse = await order_model.findById(req.params.orderid)

    res.render('../adminModule/Views/view_order', { orderSourse })
};

const approveCancel = async (req, res) => {

    try {

        const orderSourse = await order_model.findById(req.params.orderid);

        const item = orderSourse.items.id(req.params.productid);

        const productSourse = await insert_product_model.findById(item.product_id);

        productSourse.stock_qty =
            productSourse.stock_qty + Number(item.qty);

        await productSourse.save();

        await order_model.findOneAndUpdate(
            {
                _id: req.params.orderid,
                'items._id': req.params.productid
            },
            {
                $pull: {
                    items: {
                        _id: req.params.productid
                    }
                }
            },
            {
                new: true
            }
        );

        req.flash('success', 'Cancel Request accepted');

        return res.redirect(
            `/admin-dashbaord/order/view/${orderSourse._id}`
        );

    } catch (err) {

        console.log('Approve cancel error:', err);

        req.flash('error', 'Something went wrong');

        return res.redirect('/admin-dashbaord/orders');

    }

};

const approvereturn = async (req, res) => {

    try {

        const orderSourse = await order_model.findById(req.params.orderid);
        const item = orderSourse.items.id(req.params.productid);

        const productSourse = await insert_product_model.findById(item.product_id);

        productSourse.stock_qty =
            productSourse.stock_qty + Number(item.qty);

        await productSourse.save()


        await order_model.findOneAndUpdate({
            _id: req.params.orderid,
            'items._id': req.params.productid
        },
            {
                $pull: {
                    items: {
                        _id: req.params.productid
                    }
                }
            },
            {
                new: true
            }
        );


        req.flash('success', 'Product return accepted');
        return res.redirect('/admin-dashboard/orders')

    }

    catch (err) {
        console.log('Return approve error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin-dashboard/orders')
    }

}

const makeDeliver = async (req, res) => {

    try {

        const orderSourse = await order_model.findById(req.params.orderid);
        orderSourse.order_status = 'Order Delivered';

        orderSourse.items.forEach((i) => {

            i.item_status = 'Item Delivered'

        });

        await orderSourse.save();
        req.flash('success', 'Order delivered successfully');
        return res.redirect('/admin-dashboard/orders')

    }

    catch (err) {
        console.log('deliver status generating error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin-dashboard/orders')
    }

};

const adminDsahboard = async (req, res) => {

    // Date ranges (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().split('T')[0];

    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeek = lastWeekDate.toISOString().split('T')[0];

    const lastMonthDate = new Date();
    lastMonthDate.setDate(lastMonthDate.getDate() - 30);
    const lastMonth = lastMonthDate.toISOString().split('T')[0];


    // Total products and users
    const totalProducts = await insert_product_model.countDocuments();
    const totalUser = await user_account_model.countDocuments();


    // Today's total orders
    const todayTotalOrder = await order_model.countDocuments({
        order_date: today
    });


    // Today's delivered orders
    const todayOrders = await order_model.find({
        order_date: today,
        order_status: 'Order Delivered'
    }).select('items.item_profit items.item_amount');


    // Today's profit
    const todayProfit = todayOrders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => {
            return sum + (Number(item.item_profit) || 0);
        }, 0);
    }, 0);


    // Today's revenue
    const todayRevenue = todayOrders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => {
            return sum + (Number(item.item_amount) || 0);
        }, 0);
    }, 0);



    // Last 7 days orders (excluding today)
    const totalLastWeekorders = await order_model.countDocuments({
        order_date: {
            $gte: lastWeek,
            $lt: today
        }
    });

    // Last 7 days (excluding today)
    const lastWeekOrders = await order_model.find({
        order_date: {
            $gte: lastWeek,
            $lt: today
        },
        order_status: 'Order Delivered'
    }).select('items.item_profit items.item_amount');



    const lastWeekProfit = lastWeekOrders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => {
            return sum + (Number(item.item_profit) || 0);
        }, 0);
    }, 0);


    const lastWeekRevenue = lastWeekOrders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => {
            return sum + (Number(item.item_amount) || 0);
        }, 0);
    }, 0);


    // Last 30 days (excluding today)

    const totallastMonthOrders = await order_model.find({
        order_date: { $gte: lastMonth, $lt: today }
    }).countDocuments();



    // Last 30 days (excluding today)
    const lastMonthOrders = await order_model.find({
        order_date: {
            $gte: lastMonth,
            $lt: today
        },
        order_status: 'Order Delivered'
    }).select('items.item_profit items.item_amount');


    const lastMonthProfit = lastMonthOrders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => {
            return sum + (Number(item.item_profit) || 0);
        }, 0);
    }, 0);


    const lastMonthRevenue = lastMonthOrders.reduce((total, order) => {
        return total + order.items.reduce((sum, item) => {
            return sum + (Number(item.item_amount) || 0);
        }, 0);
    }, 0);


    const totalUnreadOrder = await order_model.find({ is_read: false }).countDocuments();



    res.render('../adminModule/Views/dashboard', {

        totalUnreadOrder,
        todayRevenue,
        todayProfit,

        totalLastWeekorders,
        lastWeekRevenue,
        lastWeekProfit,

        totallastMonthOrders,
        lastMonthRevenue,
        lastMonthProfit,

        totalUser,
        todayTotalOrder,
        totalProducts
    });

};

const doenloadStockBalance = async (req, res) => {

    try {

        const stockList = await insert_product_model.find().lean();

        const workBook = new exceljs.Workbook();
        const workSheet = workBook.addWorksheet('Stock Balance');

        workSheet.addRow(['Product Name', 'Category', 'Stock Qty']);

        stockList.forEach((sl) => {
            workSheet.addRow([
                sl.product_name,
                sl.category,
                sl.stock_qty
            ]);
        });

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=stock_balance.xlsx'
        );

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        await workBook.xlsx.write(res);
        res.end();

    } catch (err) {

        console.log('Stock Balance Generating error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin-dashboard');

    }

};

const downloadUserList = async (req, res) => {

    try {

        const userList = await user_account_model.find().lean();

        const workBook = new exceljs.Workbook();
        const workSheet = workBook.addWorksheet('User List');

        workSheet.addRow(['Name', 'Mobile', 'Email']);

        userList.forEach((ul) => {
            workSheet.addRow([
                ul.name,
                ul.mobile,
                ul.email
            ]);
        });

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=user_list.xlsx'
        );

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        await workBook.xlsx.write(res);
        res.end();


    }

    catch (err) {

        console.log('User list Generating error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin-dashboard');

    }

};

const downloadSalesReport = async (req, res) => {

    try {

        const { start_date, end_date } = req.query;
        if (!start_date || !end_date) {

            req.flash('error', 'Please select both dates')
            return res.redirect('/admin-dashboard')
        }

        const startDate = new Date(new Date(start_date).toISOString().split('T')[0]);
        const endDate = new Date(new Date(end_date).toISOString().split('T')[0]);

        if (
            isNaN(startDate.getTime()) ||
            isNaN(endDate.getTime()) ||
            startDate > endDate
        ) {
            return res.status(400).send('Invalid date range');
        }

        const allOrder = await order_model.find({
            order_status: 'Order Delivered',
            order_date: {
                $gte: start_date,
                $lte: end_date
            }
        }).lean();


        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Invoice No', key: 'invoice_no', width: 20 },
            { header: 'Customer', key: 'customer_name', width: 25 },
            { header: 'Mobile', key: 'mobile', width: 15 },
            { header: 'Order Date', key: 'order_date', width: 20 },
            { header: 'Total Amount', key: 'total_amount', width: 18 }
        ];

        allOrder.forEach(order => {
            worksheet.addRow({
                invoice_no: order.invoice_no,
                customer_name: order.customer_name,
                mobile: order.mobile,
                order_date: order.order_date
                    ? new Date(order.order_date).toLocaleDateString('en-IN')
                    : '',
                total_amount: order.total_amount
            });
        });

        worksheet.getRow(1).font = { bold: true };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=sales-report.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();

    }

    catch (err) {

        console.log(err);
        res.status(500).send('Unable to download sales report');
    }

};

const adminRegister = (req, res) => {

    res.render('../adminModule/Views/admin_signup')
};

const adminRegisterPost = async (req, res) => {

    try {

        const adminSignupData = req.body;

        if (!adminSignupData.email) {
            req.flash('error', 'Email is required');
            return res.redirect('/admin/auth/register')
        };

        if (!adminSignupData.mobile) {
            req.flash('error', 'Mobile no is required');
            return res.redirect('/admin/auth/register')
        };

        if (!adminSignupData.password) {
            req.flash('error', 'Please enter Password');
            return res.redirect('/admin/auth/register')
        };

        if (!adminSignupData.name) {
            req.flash('error', 'Please enter Admin name');
            return res.redirect('/admin/auth/register')
        };


        const mobilePattern = /^[6-9]\d{9}$/;

        if (!mobilePattern.test(adminSignupData.mobile)) {
            req.flash('error', 'Invalid mobile no');
            return res.redirect('/admin/auth/register')
        };

        const adminEmail = await admin_account_model.findOne({ email: adminSignupData.email });

        if (adminEmail) {
            req.flash('error', 'Email already exist');
            return res.redirect('/admin/auth/register')
        };

        const adminMobile = await admin_account_model.findOne({ mobile: adminSignupData.mobile });

        if (adminMobile) {
            req.flash('error', 'Mobile already exist');
            return res.redirect('/admin/auth/register')
        };

        const new_admin_account_model = admin_account_model(adminSignupData);
        await new_admin_account_model.save();

        console.log(adminSignupData)

        req.flash('success', 'Account created successfully');
        return res.redirect('/admin/auth/register')

    }

    catch (err) {
        console.log('Admin Signup post error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin/auth/register')
    }

};

const adminLogin = (req, res) => {

    res.render('../adminModule/Views/admin_login')
};

const adminLoginPost = async (req, res) => {

    try {

        const { email, password } = req.body;

        const adminEmail = await admin_account_model.findOne({ email: email });

        if (adminEmail) {

            const matchPassword = await bcryptjs.compare(password, adminEmail.password);

            if (matchPassword) {


                const token = await adminEmail.generateAdminToken();

                res.cookie('adminToken', token), {

                    httpOnly: true,
                    secure: true,
                    maxAge: 365 * 24 * 60 * 60 * 1000,
                }

                return res.redirect('/admin-dashboard')

                res.send(`Hey ${adminEmail.name}! You are welcome`)
            }

            else {
                req.flash('error', 'Incorrcet Email or Password');
                return res.redirect('/admin/auth/login')
            }

        }

        else {
            req.flash('error', 'You have not account');
            return res.redirect('/admin/auth/login')
        }


    }
    catch (err) {
        console.log('Admin login error', err);
        req.flash('error', 'Something is wrong');
        return res.redirect('/admin/auth/login')
    }

}



module.exports = { adminLoginPost, adminLogin, adminRegisterPost, adminRegister, downloadSalesReport, approvereturn, downloadUserList, doenloadStockBalance, adminDsahboard, makeDeliver, approveCancel, viewOrder, orderList, editProductPost, editProduct, deleteProduct, productList, addNewProduct, addNewProductPost };