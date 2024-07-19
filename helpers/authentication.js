const jwt=require("jsonwebtoken")
require("dotenv").config()

exports.authenticator=async(req,res,next)=>{
    try {
const token=req.headers.authorization && req.headers.authorization.split(" ")[1] 
 if(!token){
    return res.status(400).json("Something went wrong")
 }   

 await jwt.verify(token,process.env.jwtSecret,(err,sly)=>{
    if(err){
        return res.status(400).json("Kindly login to perform this action")
    }
      req.user = sly.id
      next()
    })

    } catch (error) {
       res.status(500).json(error.message) 
    }
}  

