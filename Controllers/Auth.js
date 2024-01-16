const bcrypt = require("bcrypt");
const User = require("../model/User");
const jwt = require("jsonwebtoken");

require("dotenv").config()

// signup route handler

exports.signup = async (req, res) => {
    try {
        // get data
        const { name, email, password, role } = req.body;

        // check if user already exist 
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User Already Exists",
            })
        }

        // Secured password 
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        }
        catch (err) {
            return res.status(500).json({
                success: false,
                message: "Error in hashing password",
            })
        }

        // Create Entry for User
        let user = await User.create({
            name, email, password: hashedPassword, role
        });

        return res.status(200).json({
            success: true,
            message: "User Created Successfully",
            data: user
        });
    }
    catch (err) {
        console.error(err)
        return res.status(500).json({
            success: false,
            message: "User cannot be register,Please try again later",
        })
    }
}

// login route handler

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;
        // validation on email and password

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "please fill all the details carefully"
            });
        }

        // check user is exist or not
        let user = await User.findOne({ email });
        // not a registerred user
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "user is not registerred"
            });
        }
        
        // verify password and generate JWT tokens

        const payload = {
            email: user.email,
            id: user._id,
            role: user.role,
        }
        if(await bcrypt.compare(password, user.password)){
            // token create using sign method
            let token = jwt.sign(
                payload, process.env.JWT_SECRET, {
                    expiresIn: "2h",

            });
            user  = user.toObject();
            user.token = token;
            user.password = undefined;
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 *60 *1000),
                httpOnly: true, // prevent to access from client side

            }
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user,
                message:"user logged in successfully",
            });
        }
        else{
            return res.status(403).json({
                success:false,
                message:"password does not match"
            });
        }
    } 
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "log in failure"
        });
    }
}