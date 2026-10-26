const User = require('../../model/userSchema');
const mongoose = require("mongoose");
const MESSAGES = require("../../constants/messages");
const bcrypt = require("bcrypt");
const dashboardServices = require('../../services/admin/dashboardServices');
const loadLogin =async (req,res)=>{
    if(req.session.loginError){
        res.locals.formData = req.session.loginError.formData;
        res.locals.message = req.session.loginError.message;
        res.locals.field = req.session.loginError.field;
        req.session.loginError = null;
    }
    res.render("admin/login" 
    );
}
const login = async (req,res)=>{
    
    console.log(req.originalUrl);
    try{
        const {email,password}= req.body;
        console.log(email,password);
        const emailTrim = email.trim().toLowerCase();
        const admin =  await User.findOne({email:emailTrim,isAdmin:true});
        
        if(!admin){
            req.session.loginError ={
                message:MESSAGES.USER_NOT_FOUND,
                field:"email",
                formData:{email}
            }
            return res.redirect('/admin/login');
        }
        const isMatch = await bcrypt.compare(password,admin.password);
        if(!isMatch){
            req.session.loginError={
                message:MESSAGES.PASSWORD_MISMATCH,
                field:"password",
                formData:{email}
            }
            return res.redirect('/admin/login');
        }
        req.session.admin = admin;
        res.redirect('/admin/dashboard');
    }catch(error){
        return res.redirect('/admin/login');
    }
    
}
const loadDashBoard  = async (req,res)=>{
    console.log('Admin dashboard loaded', req.session.admin);
    const admin = await User.findById(req.session.admin);
    const [
        stats,
        topProducts,
        topCategories
    ] = await Promise.all([
        dashboardServices.getDashboardStats(),
        dashboardServices.getTopSellingProducts(),
        dashboardServices.getTopSellingCategories()
    ])
    res.render('admin/dashboard',{
        active:"dashboard",
        admin,
        ...stats,
        topProducts,
        topCategories
    });
}
const loadSalesChartData = async (req, res) => {
    try {
        const { period, year, month } = req.query;
        const allowedPeriods = ['daily', 'monthly', 'yearly'];
        if (period && !allowedPeriods.includes(period)) {
            return res.status(400).json({
                message: 'Invalid sales period'
            });
        }
        const sales = await dashboardServices.getSalesChartData(
            period,
            year,
            month
        );
        res.json({ sales });
    } catch (error) {
        console.error('Error loading sales chart:', error);
        res.status(500).json({
            message: 'Unable to load sales chart'
        });
    }
};
const logout = (req,res)=>{
    req.session.admin=null;
    res.redirect('/admin/login');
}
module.exports = {
    loadLogin,
    login,
    loadDashBoard,
    loadSalesChartData,
    logout
}