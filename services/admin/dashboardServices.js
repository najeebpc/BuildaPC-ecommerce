const Order = require('../../model/orderSchema');
const Product = require('../../model/productSchema');
const User = require('../../model/userSchema');

const getDashboardStats = async()=>{
    const deliveredFilter = {orderStatus:'delivered'};
    const [
        revenueResult,
        totalOrders,
        totalUsers,
        newOrdersToday
 ] = await Promise.all([
        Order.aggregate([
            {$match:deliveredFilter},
            {
                $group:{
                    _id:null,
                    totalRevenue:{$sum:'$totalAmount'}
                }
            }
        ]),
        Order.countDocuments(deliveredFilter),
        User.countDocuments(),
        Order.countDocuments({
            createdAt:{
                $gte:new Date(new Date().setHours(0,0,0,0)),
                $lt:new Date(new Date().setHours(24,0,0,0))
            }
        })

    ]);
    return {
        totalRevenue:revenueResult?.[0]?.totalRevenue??0,
        totalOrders,
        totalUsers,
        newOrdersToday
    }
};
const getTopSellingProducts = async () => {
    return Order.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $unwind: '$items' },
        {
            $group: {
                _id: '$items.productId',
                productName: { $first: '$items.productName' },
                quantitySold: { $sum: '$items.quantity' },
                revenue: {
                    $sum: {
                        $multiply: ['$items.price', '$items.quantity']
                    }
                }
            }
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 10 }
    ]);
};

const getTopSellingCategories = async () => {
    return Order.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $unwind: '$items' },
        {
            $lookup: {
                from: Product.collection.name,
                localField: 'items.productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        { $unwind: '$product' },
        {
            $group: {
                _id: '$product.categoryId',
                quantitySold: { $sum: '$items.quantity' },
                revenue: {
                    $sum: {
                        $multiply: ['$items.price', '$items.quantity']
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        {
            $unwind: {
                path: '$category',
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project: {
                _id: 1,
                categoryName: '$category.name',
                quantitySold: 1,
                revenue: 1
            }
        },
        { $sort: { quantitySold: -1, revenue: -1 } },
        { $limit: 10 }
    ]);
};
const getSalesChartData = async (period = 'monthly', year, month) => {
    const now = new Date();

    year = Number(year) || now.getFullYear();
    month = Number(month) || now.getMonth() + 1;
    let startDate;
    let endDate;
    let groupFormat;
    if (period === 'daily') {

        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 1);
        groupFormat = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
        };
    } else if (period === 'yearly') {
        startDate = new Date(2000, 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        groupFormat = { year: { $year: '$createdAt' } };
    } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year + 1, 0, 1);
        groupFormat = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
        };
    }
    const sales = await Order.aggregate([
        {
            $match: {
                orderStatus: 'delivered',
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: groupFormat,
                totalSales: { $sum: '$totalAmount' },
                orderCount: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    return sales;
};
module.exports = {
    getDashboardStats,
    getTopSellingProducts,
    getTopSellingCategories,
    getSalesChartData
}