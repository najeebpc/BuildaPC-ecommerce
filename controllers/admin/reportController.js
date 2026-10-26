const reportServices = require('../../services/admin/reportServices');

const loadSalesReport = async (req, res) => {
    try {
        const { from, to, period } =
            reportServices.getReportDates(req.query);

        const report = await reportServices.getSalesReport(from, to);

        return res.render('admin/reports', {
            active: 'reports',
            report,
            period,
            startDate: from.toLocaleDateString('en-CA'),
            endDate: to.toLocaleDateString('en-CA'),
            error: req.query.error || null
        });
    } catch (error) {
        console.error('Error loading sales report:', error);

        return res.redirect(
            '/admin/reports?error=invalidDates'
        );
    }
};
const exportSalesPDF = async (req, res) => {
    try {
        const { from, to, period } =
            reportServices.getReportDates(req.query);

        const report = await reportServices.getSalesReport(from, to);
        const doc = await reportServices.generateSalesPDF(report, from, to);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="sales-report-${period}.pdf"`
        );

        doc.pipe(res);
    } catch (error) {
        console.error('PDF export error:', error);

        if (!res.headersSent) {
            return res.status(400).send('Unable to generate sales PDF.');
        }
    }
};

const exportSalesExcel = async (req, res) => {
    try {
        const { from, to, period } =
            reportServices.getReportDates(req.query);

        const report = await reportServices.getSalesReport(from, to);
        const buffer = await reportServices.generateSalesExcel(
            report,
            from,
            to
        );

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="sales-report-${period}.xlsx"`
        );

        return res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('Excel export error:', error);

        return res.status(400).send('Unable to generate sales Excel.');
    }
};
module.exports = {
        loadSalesReport,
        exportSalesExcel,
        exportSalesPDF
}