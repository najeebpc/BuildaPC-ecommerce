const User = require("../model/userSchema");

const isAuthenticated = async (req,res,next)=>{
    try{
        if(!req.session.user){
            if(req.headers.accept?.includes('application/json')){
                return res.status(401).json({
                    success:false,
                    message:'Please login to continue',
                    redirect:'/login'
                });
            }
        return res.redirect('/login');
    }
    const user = await User.findById(req.session.user);
    if(user.isBlocked){
       return req.session.destroy(()=>{
            return res.redirect("/login");
        });
    }
    next();
}catch(error){
    res.redirect("/login")
}
}
const isLogged = (req,res,next)=>{
    if(req.session.user){
        return res.redirect('/');
    }
    next();
}
const isResetPassword = (req,res,next)=>{
    if(!req.session.resetEmail){
        return res.redirect('/forgot-password')
    }
    next();
    
}
const isVerified = (req,res,next)=>{
    if(!req.session.otpPurpose){
        return res.redirect('/signup');
    }
    next();
}
const adminAuth = (req,res,next)=>{
    if(req.session.admin){
        return next();
    }
    res.redirect('/admin/login');
}
const isAdminLogged = (req,res,next)=>{
    if(req.session.admin){
        return res.redirect('/admin/dashboard');
    }
    next();
}
module.exports = {
    isAuthenticated,
    isLogged,
    isVerified,
    adminAuth,
    isAdminLogged,
    isResetPassword
}