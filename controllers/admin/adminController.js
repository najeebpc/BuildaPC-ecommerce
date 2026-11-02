const User = require('../../model/userSchema');
const mongoose = require("mongoose");
const MESSAGES = require("../../constants/messages");
const bcrypt = require("bcrypt");
const dashboardServices = require('../../services/admin/dashboardServices');
const userServices = require('../../services/user/userServices');
const {generateOtp} = require("../../helpers/otpHelper");
const {sendVerificationEmail} = require("../../helpers/mailHelper");
const Otp = require('../../model/otpSchema');

const loadLogin =async (req,res)=>{
    if(req.session.loginError){
        res.locals.formData = req.session.loginError.formData;
        res.locals.message = req.session.loginError.message;
        res.locals.field = req.session.loginError.field;
        req.session.loginError = null;
    }
    const passSuccess = req.session.passSuccess;
    res.render("admin/login" ,{
        passSuccess
    }
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
const loadForgotPassword = async(req,res)=>{
    try{
        res.render('admin/forgot-password');
    }catch(error){
        console.log('load forgot error',error)
    }
}
const forgotPassword = async(req,res)=>{
    try{
        const {email} = req.body;
        const adminEmail = email.trim();
        console.log('admin email',email);
        const admin =await User.findOne({email:adminEmail,isAdmin:true});
        if(!admin){
            console.log('email not found',admin)
            req.session.message =MESSAGES.ADMIN_EMAIL_NOT_FOUND;
            req.session.formData ={email:adminEmail};
            return res.redirect('/admin/forgot-password')
        }
        const otp = generateOtp();
        const emailSend = await sendVerificationEmail(email,otp);
        console.log('reset otp ',otp,emailSend)
        if(!emailSend){
            req.session.message = MESSAGES.EMAIL_SEND_FAILED;
            req.session.formData = {email:adminEmail};
            return res.redirect('/admin/forgot-password')
        }
        await Otp.deleteMany({
            email:adminEmail,
            purpose:'ADMIN-RESET-PASSWORD'
        });
        await Otp.create({
            email:adminEmail,
            otp:otp,
            purpose:'ADMIN-RESET-PASSWORD',
            expiresAt:new Date(Date.now()+60*1000)
        });
        req.session.adminResetEmail = adminEmail;
        req.session.adminOtpPurpose='ADMIN-RESET-PASSWORD';
        return res.redirect('/admin/verify-otp');
    }catch(error){
        console.log('email post error', error)
        return res.redirect('/admin/forgot-password');
    }
}
const loadVerifyOtp = async(req,res)=>{
    try{
        const email = req.session.adminResetEmail;
        const otpData = await Otp.findOne({
            email,
            purpose:'ADMIN-RESET-PASSWORD'
        });
        if(!otpData){
            return res.redirect('/admin/forgot-password');
        }
        return res.render('admin/verify-otp',{
            expiresAt:otpData.expiresAt
        })
    }catch(error){
        console.log(error);
        return res.redirect('/admin/forgot-password');
    }
}
const verifyOtp = async(req,res)=>{
    try{
        const {otp} = req.body;
        const email = req.session.adminResetEmail;
        console.log('otp email session',otp,email,req.session.adminOtpPurpose)
        if(!email||req.session.adminOtpPurpose!=='ADMIN-RESET-PASSWORD'){
            return res.status(400).json({
                success:false,
                message:MESSAGES.SESSION_EXPIRED
            });
        }
        
        if(!otp){
            return res.status(400).json({
                success:false,
                message:MESSAGES.ENTER_OTP
        })
        }
        const otpData = await Otp.findOne({
            email,
            purpose:'ADMIN-RESET-PASSWORD'
        })
        if(!otpData){
            return res.status(400).json({
                success:false,
                message:MESSAGES.OTP_INVALID
            });
        }
        if(Date.now()>otpData.expiresAt.getTime()){
            return res.status(400).json({
                success:false,
                message:MESSAGES.OTP_EXPIRED
            })
        }
        if(otp !==otpData.otp){
            return res.status(400).json({
                success:false,
                message:MESSAGES.OTP_INVALID
            })
        }
        await Otp.deleteOne({_id:otpData._id});
        return res.json({
            success:true,
            redirectUrl:'/admin/change-password'
        })
    
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:MESSAGES.SERVER_ERROR
        })
    }
}
const resendOtp = async(req,res)=>{
    try{
        const resetEmail = req.session.adminResetEmail;
        if(!resetEmail){
            return res.status(400).json({
                success:false,
                message:MESSAGES.SOMETHING_WENT_WRONG
            });
        }
        const newOtp = generateOtp();
        const emailSend = await sendVerificationEmail(resetEmail,newOtp);
        if(!emailSend){
            return res.status(400).json({
                success:false,
                message:MESSAGES.EMAIL_SEND_FAILED
            });
        }
        console.log('new otp',newOtp)
        await Otp.deleteMany({
            email:resetEmail,
            purpose:'ADMIN-RESET-PASSWORD'
        });
        const newOtpData = await Otp.create({
            email:resetEmail,
            otp:newOtp,
            purpose:'ADMIN-RESET-PASSWORD',
            expiresAt:new Date(Date.now()+60*1000)
        })
        return res.status(200).json({
            success:true,
            message:MESSAGES.OTP_SENT,
            expiresAt:newOtpData.expiresAt
        })
    }catch(error){
        console.log('new otp error',error);
        return res.status(500).json({
            success:false,
            message:MESSAGES.SOMETHING_WENT_WRONG
        })
    }
}
const loadChangePassword = async(req,res)=>{
    return res.render('admin/change-password');
}
const changePassword = async(req,res)=>{
    try{
        const {password,confirmPassword}= req.body;
        console.log('passwords',password,confirmPassword);
        if(!userServices.isStrongPassword(password)){
                req.session.message = MESSAGES.PASSWORD_INVALID,
                req.session.field = 'password'
            return res.redirect('/admin/change-password');
        }
        if(password!==confirmPassword){
                req.session.message = MESSAGES.PASSWORD_MISMATCH,
                req.session.field  = 'passoword'
            return res.redirect('/admin/change-password');
        }
        const passwordHash = await userServices.securePassword(password);
        await User.updateOne(
            {email:req.session.adminResetEmail,isAdmin:true},
            {$set:{password:passwordHash}}
        );
        req.session.adminResetEmail = null;
        req.session.resendOtp=null;
        req.session.adminOtpPurpose =null;
        req.session.passSuccess = {
            message:MESSAGES.PASSWORD_CHANGED,
            field:'passChange'
        }
        res.redirect('/admin/login')
    }catch(error){
        console.log('passchange error',error);
        res.redirect('/admin/change-password')
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
    loadForgotPassword,
    forgotPassword,
    loadVerifyOtp,
    verifyOtp,
    resendOtp,
    loadChangePassword,
    changePassword,
    loadDashBoard,
    loadSalesChartData,
    logout
}