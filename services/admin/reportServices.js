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

      return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === Number(value.slice(0, 4)) &&
        date.getMonth() + 1 === Number(value.slice(5, 7)) &&
        date.getDate() === Number(value.slice(8, 10))
      );
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

const getSalesReport = async (startDate, endDate, page = 1, limit = 10) => {
  const matchStage = {
    orderStatus: 'delivered',
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  // Calculate summary for all matching orders
  const summaryResult = await Order.aggregate([
    { $match: matchStage },

    {
      $addFields: {
        activeItems: {
          $filter: {
            input: { $ifNull: ['$items', []] },
            as: 'item',
            cond: { $ne: ['$$item.itemStatus', 'cancelled'] },
          },
        },
      },
    },

    {
      $addFields: {
        itemsCount: {
          $sum: {
            $map: {
              input: '$activeItems',
              as: 'item',
              in: '$$item.quantity',
            },
          },
        },

        productDiscount: {
          $sum: {
            $map: {
              input: '$activeItems',
              as: 'item',
              in: {
                $multiply: [
                  { $ifNull: ['$$item.discountAmount', 0] },
                  { $ifNull: ['$$item.quantity', 0] },
                ],
              },
            },
          },
        },

        refundAmount: {
          $sum: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $cond: [
                  { $eq: ['$$item.returnStatus', 'received'] },
                  { $ifNull: ['$$item.refundAmount', 0] },
                  0,
                ],
              },
            },
          },
        },
      },
    },

    {
      $addFields: {
        totalDiscount: {
          $add: ['$productDiscount', { $ifNull: ['$couponDiscount', 0] }],
        },

        // totalAmount is already adjusted when a return is received
        netSales: { $ifNull: ['$totalAmount', 0] },
      },
    },

    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: '$netSales' },
        totalSubtotal: { $sum: { $ifNull: ['$subtotal', 0] } },
        totalCouponDiscount: { $sum: { $ifNull: ['$couponDiscount', 0] } },
        totalProductDiscount: { $sum: '$productDiscount' },
        totalDiscount: { $sum: '$totalDiscount' },
        totalRefund: { $sum: '$refundAmount' },
        totalItemsSold: { $sum: '$itemsCount' },
      },
    },
  ]);

  const report = summaryResult[0] || {
    totalOrders: 0,
    totalSales: 0,
    totalSubtotal: 0,
    totalCouponDiscount: 0,
    totalProductDiscount: 0,
    totalDiscount: 0,
    totalRefund: 0,
    totalItemsSold: 0,
  };

  // Calculate pagination
  const totalPages = Math.ceil(report.totalOrders / limit);

  page = Math.max(1, Math.min(page, totalPages || 1));

  const skip = (page - 1) * limit;

  // Fetch only the orders for the current page
  const orders = await Order.find(matchStage)
    .select(
      `
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
        `,
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Calculate details for the displayed orders
  orders.forEach((order) => {
    const activeItems = order.items.filter((item) => item.itemStatus !== 'cancelled');

    order.customerName = order.shippingAddress?.fullName || 'N/A';

    order.itemsCount = activeItems.reduce((total, item) => total + item.quantity, 0);

    order.productDiscount = activeItems.reduce(
      (total, item) => total + (item.discountAmount || 0) * item.quantity,
      0,
    );

    order.totalDiscount = Number((order.productDiscount + (order.couponDiscount || 0)).toFixed(2));

    order.refundAmount = order.items.reduce(
      (total, item) => total + (item.returnStatus === 'received' ? item.refundAmount || 0 : 0),
      0,
    );

    order.netSales = Number((order.totalAmount || 0).toFixed(2));
  });
  [
    'totalSales',
    'totalSubtotal',
    'totalCouponDiscount',
    'totalProductDiscount',
    'totalDiscount',
    'totalRefund',
  ].forEach((key) => {
    report[key] = Number(report[key].toFixed(2));
  });

  return {
    ...report,
    orders,
    currentPage: page,
    totalPages,
    limit,
  };
};
const generateSalesPDF = async (report, from, to) => {
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 35,
  });

  doc.fontSize(20).text('BuildaPC - Sales Report', {
    align: 'center',
  });

  doc.moveDown();
  doc
    .fontSize(10)
    .text(`Period: ${from.toLocaleDateString('en-IN')} - ${to.toLocaleDateString('en-IN')}`, {
      align: 'center',
    });

  doc.moveDown();
  doc
    .fontSize(11)
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
    { title: 'Total Amount', x: 545, width: 100 },
  ];

  const drawHeader = () => {
    const y = doc.y;
    doc.font('Helvetica-Bold').fontSize(9);

    columns.forEach((column) => {
      doc.text(column.title, column.x, y, {
        width: column.width,
        lineBreak: false,
      });
    });

    doc
      .moveTo(35, y + 16)
      .lineTo(757, y + 16)
      .stroke();
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
      (order.totalAmount || 0).toFixed(2),
    ];

    doc.fontSize(8);

    values.forEach((value, index) => {
      doc.text(String(value), columns[index].x, y, {
        width: columns[index].width,
        lineBreak: false,
        ellipsis: true,
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
    `${from.toLocaleDateString('en-IN')} - ${to.toLocaleDateString('en-IN')}`,
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
    'Total Amount',
  ]);

  report.orders.forEach((order) => {
    worksheet.addRow([
      order.orderId,
      new Date(order.createdAt).toLocaleDateString('en-IN'),
      order.paymentMethod,
      order.subtotal || 0,
      order.couponDiscount || 0,
      order.totalAmount || 0,
    ]);
  });

  worksheet.columns = [
    { width: 22 },
    { width: 18 },
    { width: 20 },
    { width: 24 },
    { width: 20 },
    { width: 18 },
  ];

  worksheet.getRow(9).font = { bold: true };
  worksheet.getRow(9).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8ECF8' },
    };
  });
  return workbook.xlsx.writeBuffer();
};
module.exports = {
  getReportDates,
  getSalesReport,
  generateSalesExcel,
  generateSalesPDF,
};
