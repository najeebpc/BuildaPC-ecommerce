const PDFDocument = require('pdfkit');
const Order = require('../../model/orderSchema');

const generateInvoice = async (userId, orderId, res) => {
  const order = await Order.findOne({
    userId,
    orderId,
  }).lean();

  if (!order) {
    throw new Error('Order not found');
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);

  doc.pipe(res);

  const formatPrice = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const activeItems = order.items.filter((item) => item.itemStatus !== 'cancelled');

  const totalOfferDiscount = activeItems.reduce((total, item) => {
    return total + Number(item.discountAmount || 0) * Number(item.quantity || 0);
  }, 0);

  const originalSubtotal = Number((Number(order.subtotal || 0) + totalOfferDiscount).toFixed(2));

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#111827').text('BuildaPC');

  doc.fontSize(10).font('Helvetica').fillColor('#666666').text('PC Components & Accessories');

  doc.moveDown(1);

  doc.fontSize(20).font('Helvetica-Bold').fillColor('#000000').text('INVOICE', {
    align: 'right',
  });

  doc.fontSize(10).font('Helvetica').text(`Invoice #: ${order.orderId}`, {
    align: 'right',
  });

  doc.text(
    `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    {
      align: 'right',
    },
  );

  doc.moveDown(1.5);

  doc.strokeColor('#dddddd').moveTo(50, doc.y).lineTo(545, doc.y).stroke();

  doc.moveDown(1.5);

  const addressTop = doc.y;

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text('Shipping Address');

  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica-Bold').text(order.shippingAddress.fullName);
  doc.font('Helvetica').text(order.shippingAddress.addressLine1);
  if (order.shippingAddress.addressLine2) {
    doc.text(order.shippingAddress.addressLine2);
  }
  doc.text(
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
  );
  doc.text(`Phone: ${order.shippingAddress.phone}`);
  doc.y = addressTop;

  doc.fontSize(12).font('Helvetica-Bold').text('Payment Information', 320);

  doc.moveDown(0.5);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(
      `Payment Method: ${
        order.paymentMethod === 'cod'
          ? 'Cash on Delivery'
          : order.paymentMethod === 'wallet'
            ? 'Wallet'
            : 'Online Payment'
      }`,
      320,
    );

  doc.text(`Payment Status: ${order.paymentStatus}`, 320);
  doc.text(`Order Status: ${order.orderStatus}`, 320);

  doc.y = Math.max(doc.y, addressTop + 110);

  doc.moveDown(1);

  doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Order Summary');

  doc.moveDown(0.8);
  const tableTop = doc.y;
  doc.fontSize(9).font('Helvetica-Bold').text('#', 50, tableTop);
  doc.text('Product Details', 80, tableTop);
  doc.text('Qty', 370, tableTop, {
    width: 35,
    align: 'center',
  });
  doc.text('Amount', 440, tableTop, {
    width: 105,
    align: 'right',
  });
  doc
    .strokeColor('#cccccc')
    .moveTo(50, tableTop + 18)
    .lineTo(545, tableTop + 18)
    .stroke();

  let currentY = tableTop + 28;
  activeItems.forEach((item, index) => {
    const quantity = Number(item.quantity || 0);
    const finalPrice = Number(item.price || 0);
    const offerDiscount = Number(item.discountAmount || 0);
    const originalPrice = Number(item.originalPrice ?? finalPrice + offerDiscount);
    const itemTotal = Number((finalPrice * quantity).toFixed(2));
    const totalItemOfferDiscount = Number((offerDiscount * quantity).toFixed(2));
    const productName = item.productName || 'Product';
    const variantText =
      item.variantAttributes && item.variantAttributes.length > 0
        ? item.variantAttributes
            .map((attribute) => `${attribute.name}: ${attribute.value}`)
            .join(', ')
        : '';
    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#333333')
      .text(`${index + 1}`, 50, currentY);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text(productName, 80, currentY, {
      width: 275,
    });
    let detailY = doc.y + 3;
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Original Price: ${formatPrice(originalPrice)}`, 80, detailY);
    detailY = doc.y + 2;
    if (offerDiscount > 0) {
      doc
        .fontSize(8)
        .fillColor('#555555')
        .text(`Offer Discount: -${formatPrice(offerDiscount)} per unit`, 80, detailY);
      detailY = doc.y + 2;
    }
    doc
      .fontSize(8)
      .fillColor('#555555')
      .text(`Price After Offer: ${formatPrice(finalPrice)}`, 80, detailY);
    detailY = doc.y + 2;
    if (variantText) {
      doc.fontSize(8).fillColor('#666666').text(variantText, 80, detailY, {
        width: 275,
      });
      detailY = doc.y + 2;
    }
    doc.fontSize(9).fillColor('#333333').text(quantity.toString(), 370, currentY, {
      width: 35,
      align: 'center',
    });
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#111827')
      .text(formatPrice(itemTotal), 440, currentY, {
        width: 105,
        align: 'right',
      });
    currentY = Math.max(doc.y, detailY) + 12;
    doc.strokeColor('#eeeeee').moveTo(50, currentY).lineTo(545, currentY).stroke();

    currentY += 10;
  });
  currentY += 10;

  const billingLabelX = 340;
  const billingAmountX = 440;
  const billingAmountWidth = 105;

  const addBillingRow = (label, amount, options = {}) => {
    doc
      .fontSize(options.bold ? 10 : 9)
      .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(options.color || '#555555')
      .text(label, billingLabelX, currentY);

    doc
      .fontSize(options.bold ? 10 : 9)
      .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fillColor(options.color || '#000000')
      .text(amount, billingAmountX, currentY, {
        width: billingAmountWidth,
        align: 'right',
      });
    currentY += options.spacing || 18;
  };
  addBillingRow('Original Subtotal', formatPrice(originalSubtotal));
  if (totalOfferDiscount > 0) {
    addBillingRow('Offer Savings', `-${formatPrice(totalOfferDiscount)}`, {
      color: '#555555',
    });
  }
  addBillingRow('Subtotal After Offers', formatPrice(order.subtotal));
  if (Number(order.couponDiscount) > 0) {
    addBillingRow(
      `Coupon (${order.couponCode || 'Applied'})`,
      `-${formatPrice(order.couponDiscount)}`,
      {
        color: '#555555',
      },
    );
  }
  addBillingRow('Shipping', 'Free');
  addBillingRow('Inclusive of all taxes', '');
  currentY += 5;

  addBillingRow(
    'Payment Method',
    order.paymentMethod === 'cod'
      ? 'Cash on Delivery'
      : order.paymentMethod === 'wallet'
        ? 'Wallet'
        : 'Online Payment',
  );
  currentY += 5;
  doc.strokeColor('#cccccc').moveTo(billingLabelX, currentY).lineTo(545, currentY).stroke();

  currentY += 12;

  addBillingRow('Total Paid / Payable', formatPrice(order.totalAmount), {
    bold: true,
    color: '#111827',
    spacing: 25,
  });
  if (currentY > 730) {
    doc.addPage();
  }
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text('Thank you for shopping with BuildaPC.', 50, 750, {
      width: 495,
      align: 'center',
    });
  doc.fontSize(8).text('This is a computer-generated invoice.', 50, 765, {
    width: 495,
    align: 'center',
  });
  doc.end();
};

module.exports = {
  generateInvoice,
};
