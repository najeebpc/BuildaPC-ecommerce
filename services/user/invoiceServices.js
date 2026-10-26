const PDFDocument = require('pdfkit');
const Order = require('../../model/orderSchema');

const generateInvoice = async(userId, orderId, res)=>{
    const order = await Order.findOne({userId,orderId}).lean();
    if(!order){
        throw new Error('Order not found');
    }
    const doc = new PDFDocument({
        size:'A4',
        margin:50
    });
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition',`attachment; filename=invoice-${order.orderId}.pdf`);
    doc.pipe(res);
    doc.fontSize(22).font('Helvetica-Bold').text('BuildaPC');
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text('PC Components & Accessories');
    doc.fillColor('#000000').moveDown(1);
    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE',{align:'right'});
    doc.fontSize(10).font('Helvetica').text(`Invoice #:${order.orderId}`,{align:'right'});
    doc.text(
        `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })}`,
        {
            align: 'right'
        }
    );
    doc.moveDown(2);
    // ================================
    // Line
    // ================================
    doc
        .strokeColor('#dddddd')
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();
    doc.moveDown(1.5);
    // ================================
    // Shipping Information
    // ================================
    const addressTop = doc.y;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Shipping Address');
    doc.moveDown(0.5);
    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(order.shippingAddress.fullName);
    doc
        .font('Helvetica')
        .text(order.shippingAddress.addressLine1);
    if (order.shippingAddress.addressLine2) {
        doc.text(order.shippingAddress.addressLine2);
    }
    doc.text(
        `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
    );
    doc.text(
        `Phone: ${order.shippingAddress.phone}`
    );
    // ================================
    // Payment Information
    // ================================
    doc.y = addressTop;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Payment Information', 320);

    doc.moveDown(0.5);
    doc
        .fontSize(10)
        .font('Helvetica')
        .text(
            `Payment Method: ${
                order.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'Online Payment'
            }`,
            320
        );
    doc.text(
        `Payment Status: ${order.paymentStatus}`,
        320
    );
    doc.text(
        `Order Status: ${order.orderStatus}`,
        320
    );
    doc.y = Math.max(doc.y, addressTop + 110);
    doc.moveDown(1);
    // ================================
    // Products
    // ================================
    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Order Summary');
    doc.moveDown(0.8);
    // Table header
    const tableTop = doc.y;
    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('#', 50, tableTop);

    doc.text('Product', 80, tableTop);
    doc.text('Qty', 350, tableTop, {
        width: 40,
        align: 'center'
    });
    doc.text('Price', 410, tableTop, {
        width: 60,
        align: 'right'
    });
    doc.text('Total', 480, tableTop, {
        width: 65,
        align: 'right'
    });
    doc
        .strokeColor('#cccccc')
        .moveTo(50, tableTop + 18)
        .lineTo(545, tableTop + 18)
        .stroke();
    let currentY = tableTop + 30;
    // Products
    order.items.forEach((item, index) => {
        const productName =
            item.productName;
        const itemTotal =
            item.price * item.quantity;
        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor('#333333')
            .text(
                `${index + 1}`,
                50,
                currentY
            );
        doc
            .font('Helvetica-Bold')
            .text(
                productName,
                80,
                currentY,
                {
                    width: 250
                }
            );
        // Variant details
        let variantText = '';
        if (
            item.variantAttributes &&
            item.variantAttributes.length > 0
        ) {
            variantText =
                item.variantAttributes
                    .map(attribute =>
                        `${attribute.name}: ${attribute.value}`
                    )
                    .join(', ');
            doc
                .font('Helvetica')
                .fontSize(8)
                .fillColor('#666666')
                .text(
                    variantText,
                    80,
                    currentY + 14,
                    {
                        width: 250
                    }
                );
        }
        doc
            .fontSize(9)
            .fillColor('#333333')
            .text(
                item.quantity.toString(),
                350,
                currentY,
                {
                    width: 40,
                    align: 'center'
                }
            );
        doc.text(
            `₹${Number(item.price).toLocaleString('en-IN')}`,
            410,
            currentY,
            {
                width: 60,
                align: 'right'
            }
        );
        doc.text(
            `₹${Number(itemTotal).toLocaleString('en-IN')}`,
            480,
            currentY,
            {
                width: 65,
                align: 'right'
            }
        );
        doc
            .strokeColor('#eeeeee')
            .moveTo(50, currentY + 35)
            .lineTo(545, currentY + 35)
            .stroke();
        currentY += 45;
    });
    // ================================
    // Billing
    // ================================
    currentY += 15;
    doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#555555')
        .text('Subtotal', 380, currentY);

    doc
        .fillColor('#000000')
        .text(
            `₹${Number(order.totalAmount).toLocaleString('en-IN')}`,
            480,
            currentY,
            {
                width: 65,
                align: 'right'
            }
        );
    currentY += 20;
    doc
        .fillColor('#555555')
        .text('Shipping', 380, currentY);
    doc
        .fillColor('#000000')
        .text(
            'Free',
            480,
            currentY,
            {
                width: 65,
                align: 'right'
            }
        );
    currentY += 20;
    doc
        .fillColor('#555555')
        .text('Tax', 380, currentY);

    doc
        .fillColor('#000000')
        .text(
            '₹0',
            480,
            currentY,
            {
                width: 65,
                align: 'right'
            }
        );
    currentY += 15;
    doc
        .strokeColor('#333333')
        .moveTo(380, currentY)
        .lineTo(545, currentY)
        .stroke();
    currentY += 12;
    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('Total', 380, currentY);
    doc
        .fillColor('#000000')
        .text(
            `₹${Number(order.totalAmount).toLocaleString('en-IN')}`,
            480,
            currentY,
            {
                width: 65,
                align: 'right'
            }
        );
    // ================================
    // Footer
    // ================================
    doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#666666')
        .text(
            'Thank you for shopping with BuildaPC.',
            50,
            750,
            {
                width: 495,
                align: 'center'
            }
        );
    doc
        .fontSize(8)
        .text(
            'This is a computer-generated invoice.',
            50,
            765,
            {
                width: 495,
                align: 'center'
            }
        );
    doc.end();

}
module.exports ={
    generateInvoice
}