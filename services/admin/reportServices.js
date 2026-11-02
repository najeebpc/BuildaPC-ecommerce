const Order = require('../../model/orderSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const getReportDates = (query) => {
    const { period = 'daily', startDate, endDate } = query;
    const today = new Date();

    let from;
    let to;

    if (period === 'custom') {
        const isValidDate = (value) => {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
                return false;
            }

            const date = new Date(`${value}T00:00:00`);

            return !Number.isNaN(date.getTime()) &&
                date.getFullYear() === Number(value.slice(0, 4)) &&
                date.getMonth() + 1 === Number(value.slice(5, 7)) &&
                date.getDate() === Number(value.slice(8, 10));
        };

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            throw new Error('Please select valid start and end dates.');
        }

        if (startDate > endDate) {
            throw new Error('End date must be on or after the start date.');
        }

        from = new Date(`${startDate}T00:00:00`);
        to = new Date(`${endDate}T23:59:59.999`);
    } else {
        from = new Date(today);
        to = new Date(today);

        if (period === 'weekly') {
            from.setDate(from.getDate() - 6);
        } else if (period === 'yearly') {
            from = new Date(today.getFullYear(), 0, 1);
        } else if (period !== 'daily') {
            throw new Error('Invalid report period.');
        }

        from.setHours(0, 0, 0, 0);
        to.setHours(23, 59, 59, 999);
    }

    return { from, to, period };
};

const getSalesReport = async (startDate, endDate) => {

    const orders = await Order.find({
        orderStatus: 'delivered',
        createdAt: {
            $gte: startDate,
            $lte: endDate
        }
    })
    .select(`
        orderId
        userId
        createdAt
        shippingAddress.fullName
        items
        subtotal
        couponDiscount
        totalAmount
        paymentMethod
        paymentStatus
        orderStatus
    `)
    .sort({ createdAt: -1 })
    .lean();
    orders.forEach(order => {

        const activeItems = order.items.filter(
            item => item.itemStatus !== 'cancelled'
        );
        order.customerName =
            order.shippingAddress?.fullName || 'N/A';

        order.itemsCount = activeItems.reduce(
            (total, item) => total + item.quantity,
            0
        );
        order.productDiscount = activeItems.reduce(
            (total, item) =>
                total + (item.discountAmount || 0) * item.quantity,
            0
        );
        order.totalDiscount = Number(
            (order.productDiscount + (order.couponDiscount || 0)).toFixed(2)
        );
        order.refundAmount = order.items.reduce(
            (total, item) =>
                total + (
                    item.returnStatus === 'received'
                        ? (item.refundAmount || 0)
                        : 0
                ),
            0
        );
        order.netSales = Number(
            (order.totalAmount - order.refundAmount).toFixed(2)
        );
    });

    const report = orders.reduce((result, order) => {
        result.totalOrders += 1;
        result.totalSales += order.netSales;
        result.totalSubtotal += order.subtotal || 0;
        result.totalCouponDiscount += order.couponDiscount || 0;
        result.totalProductDiscount += order.productDiscount || 0;
        result.totalDiscount += order.totalDiscount || 0;
        result.totalRefund += order.refundAmount || 0;
        result.totalItemsSold += order.itemsCount || 0;
        return result;

    }, {
        totalOrders: 0,
        totalSales: 0,
        totalSubtotal: 0,
        totalCouponDiscount: 0,
        totalProductDiscount: 0,
        totalDiscount: 0,
        totalRefund: 0,
        totalItemsSold: 0
    });
    report.totalSales = Number(report.totalSales.toFixed(2));
    report.totalSubtotal = Number(report.totalSubtotal.toFixed(2));
    report.totalCouponDiscount = Number(report.totalCouponDiscount.toFixed(2));
    report.totalProductDiscount = Number(report.totalProductDiscount.toFixed(2));
    report.totalDiscount = Number(report.totalDiscount.toFixed(2));
    report.totalRefund = Number(report.totalRefund.toFixed(2));

    return {
        ...report,
        orders
    };
};
const generateSalesPDF = async (report, from, to) => {
    const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 35
    });

    doc.fontSize(20).text('BuildaPC - Sales Report', {
        align: 'center'
    });

    doc.moveDown();
    doc.fontSize(10).text(
        `Period: ${from.toLocaleDateString('en-IN')} - ${to.toLocaleDateString('en-IN')}`,
        { align: 'center' }
    );

    doc.moveDown();
    doc.fontSize(11)
        .text(`Delivered Orders: ${report.totalOrders}`)
        .text(`Total Sales: Rs. ${report.totalSales.toFixed(2)}`)
        .text(`Subtotal After Offers: Rs. ${report.totalSubtotal.toFixed(2)}`)
        .text(`Coupon Discounts: Rs. ${report.totalCouponDiscount.toFixed(2)}`);

    doc.moveDown();

    const columns = [
        { title: 'Order ID', x: 35, width: 115 },
        { title: 'Date', x: 155, width: 85 },
        { title: 'Payment', x: 245, width: 75 },
        { title: 'Subtotal', x: 325, width: 100 },
        { title: 'Coupon Discount', x: 430, width: 110 },
        { title: 'Total Amount', x: 545, width: 100 }
    ];

    const drawHeader = () => {
        const y = doc.y;
        doc.font('Helvetica-Bold').fontSize(9);

        columns.forEach(column => {
            doc.text(column.title, column.x, y, {
                width: column.width,
                lineBreak: false
            });
        });

        doc.moveTo(35, y + 16).lineTo(757, y + 16).stroke();
        doc.y = y + 23;
        doc.font('Helvetica');
    };

    drawHeader();

    for (const order of report.orders) {
        if (doc.y > 510) {
            doc.addPage();
            drawHeader();
        }

        const y = doc.y;
        const values = [
            order.orderId || '-',
            new Date(order.createdAt).toLocaleDateString('en-IN'),
            (order.paymentMethod || '-').toUpperCase(),
            (order.subtotal || 0).toFixed(2),
            (order.couponDiscount || 0).toFixed(2),
            (order.totalAmount || 0).toFixed(2)
        ];

        doc.fontSize(8);

        values.forEach((value, index) => {
            doc.text(String(value), columns[index].x, y, {
                width: columns[index].width,
                lineBreak: false,
                ellipsis: true
            });
        });

        doc.y = y + 18;
    }

    doc.end();
    return doc;
};

const generateSalesExcel = async (report, from, to) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.addRow(['BuildaPC - Sales Report']);
    worksheet.addRow([
        'Period',
        `${from.toLocaleDateString('en-IN')} - ${to.toLocaleDateString('en-IN')}`
    ]);
    worksheet.addRow([]);
    worksheet.addRow(['Delivered Orders', report.totalOrders]);
    worksheet.addRow(['Total Sales', report.totalSales]);
    worksheet.addRow(['Subtotal After Offers', report.totalSubtotal]);
    worksheet.addRow(['Coupon Discounts', report.totalCouponDiscount]);
    worksheet.addRow([]);

    worksheet.addRow([
        'Order ID',
        'Date',
        'Payment Method',
        'Subtotal After Offers',
        'Coupon Discount',
        'Total Amount'
    ]);

    report.orders.forEach(order => {
        worksheet.addRow([
            order.orderId,
            new Date(order.createdAt).toLocaleDateString('en-IN'),
            order.paymentMethod,
            order.subtotal || 0,
            order.couponDiscount || 0,
            order.totalAmount || 0
        ]);
    });

    worksheet.columns = [
        { width: 22 },
        { width: 18 },
        { width: 20 },
        { width: 24 },
        { width: 20 },
        { width: 18 }
    ];

    worksheet.getRow(9).font = { bold: true };
    worksheet.getRow(9).eachCell(cell => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8ECF8' }
        };
    });
    return workbook.xlsx.writeBuffer();
};
module.exports = {
    getReportDates,
    getSalesReport,
    generateSalesExcel,
    generateSalesPDF
};