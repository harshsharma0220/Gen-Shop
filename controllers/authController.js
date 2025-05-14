import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import UserModel from "../models/UserModel.js";
import orderModel from '../models/orderModel.js'
import JWT from "jsonwebtoken";

export const registerController = async (req,res) => {
    try {
        const {name,email,password,phone,address,answer} = req.body

        //validation
        if(!name){
            return res.send({message:'Name is required'})
        }
        if(!email){
            return res.send({message:'Email is required'})
        }
        if(!password){
            return res.send({message:'Password is required'})
        }
        if(!phone){
            return res.send({message:'Phone no is required'})
        }
        if(!address){
            return res.send({message:'Address is required'})
        }
        if(!answer){
            return res.send({message:'Answer is required'})
        }
        //check user
        const existingUser = await UserModel.findOne({email})
        //existing user
        if(existingUser){
            return res.status(200).send({
                success:false,
                message:'Already register please login',
            })
        }
        //register user
        const hashedPassword = await hashPassword(password)
        //save
        const user = await new UserModel({name,email,phone,address,password:hashedPassword,answer}).save()

        res.status(201).send({
            success:true,
            message:'User Register Successfully',
            user
        })

    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in registeration',
            error
        })
    }
};

//POST LOGIN
export const loginController = async (req,res) => {
    try {
        const {email,password} = req.body

        //validation
        if(!email || !password){
            return res.status(404).send({
                success:true,
                message:'Invalid email or password'
            })
        }
        //check user
        const user = await UserModel.findOne({email})
        if(!user){
            return res.status(404).send({
                success:false,
                message:'Email is not registered'
            })
        }

        const match = await comparePassword(password,user.password);
        if(!match){
            return res.status(200).send({
                success:false,
                message:'Invalid Password',
            });
        }
        //token
        const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {expiresIn: "7d"});
        res.status(200).send({
            success:true,
            message:'Login successfully',
            user: {
                name:user.name,
                email:user.email,
                phone:user.phone,
                address:user.address,
                role:user.role,
            },
            token,
        });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error in login',
            error
        })
    }
};

//forgotPasswordController
export const forgotPasswordController = async (req,res) => {
    try {
        const {email,answer,newPassword} = req.body
        if(!email){
            res.status(400).send({message:'Email is required'})
        }
        if(!answer){
            res.status(400).send({message:'Answer is required'})
        }
        if(!newPassword){
            res.status(400).send({message:'New Password is required'})
        }

        //check
        const user = await UserModel.findOne({email,answer})
        //validation
        if(!user){
            return res.status(404).send({
                success:false,
                message:'Wrong email or answer',
            })
        }
        const hashed = await hashPassword(newPassword)
        await UserModel.findByIdAndUpdate(user._id, {password:hashed})
        res.status(200).send({
            success:true,
            message:'Password reset successfully',
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Something went wrong",
            error
        })
    }
}

//test controller
export const testController = (req,res) => {
    try {
        res.send("Protected routes")
    } catch (error) {
        console.log(error)
        res.send({error})
    }
};

//update profile
export const updateProfileController = async (req,res) => {
    try {
        const {name,email,password,address,phone} = req.body
        const user = await UserModel.findById(req.user._id)
        if(password && password.length < 11){
            return res.json({error:'Password is required and is 11 characters long'})
        }
        const hashedPassword = password ? await hashPassword(password) : undefined
        const updatedUser = await UserModel.findByIdAndUpdate(req.user._id, {
            name: name || user.name,
            password: hashedPassword || user.password,
            phone: phone || user.phone,
            address: address || user.address,   
        }, {new:true})

        res.status(200).send({
            success:true,
            message:'Profile updated successfully',
            updatedUser,
        })
    } catch (error) {
        console.log(error)
        res.status(400).send({
            success:false,
            message:'Error while updating profile',
            error,
        })
    }
}

//orders
export const getOrdersController = async (req,res) => {
    try {
        const orders = await orderModel.find({buyer:req.user._id}).populate("products","-photo").populate("buyer","name")
        res.json(orders)
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting orders',
            error,
        })
    }
}

//all orders
export const getAllOrdersController = async (req,res) => {
    try {
        const orders = await orderModel.find({}).populate("products","-photo").populate("buyer","name").sort({ createdAt: -1 });
        res.json(orders)
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting orders',
            error,
        })
    }
}

//order status update
export const orderStatusController = async (req,res) => {
    try {
        const {orderId} = req.params
        const {status} = req.body
        const orders = await orderModel.findByIdAndUpdate(orderId, {status}, {new:true})
        res.json(orders)
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while updating orders',
            error,
        })
    }
}