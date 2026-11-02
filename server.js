const express = require("express");
const app = express();
const env = require("dotenv").config();
const path = require("path");
const session = require("express-session");
const passport = require("passport");
require("./config/passport");
const ejs = require("ejs")
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter")
const connectDB = require("./config/db");
connectDB();

const port = process.env.PORT;

app.set("view engine", "ejs");
app.set("views",[path.join(__dirname,'views'),path.join(__dirname,"views/admin")]);
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
    res.locals.formData =req.session.formData||{};
    res.locals.message =req.session.message|| null;
    res.locals.field = req.session.field||null;
    res.locals.profileError = null;
    res.locals.profileSuccess = null;

    delete req.session.message;
    delete req.session.field;
    next();
})

app.use((req,res,next)=>{
    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
    );
    next();
});

app.use("/",userRouter);
app.use('/admin',adminRouter);
// app.use((req,res)=>{
    
//     res.status(404).render('user/page-404');
// });

app.listen(port,()=>{
    console.log("server is running on port ",port);
})