const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({

firstName:String,

lastName:String,

passWord:String,

email:String,
 
phoneNumber:String,

isAdmin:{type:Boolean,default:false},

isSuperAdmin:{type:Boolean,default:false},

isVerified:{type:Boolean,default:false},

profilePicture:{pictureUrl:String,pictureId:String},
profilePicture: {
    pictureId: { type: String },
    pictureUrl: { type: String},
    formerImages: [
        {
            pictureId: { type: String },
            pictureUrl: { type: String }
        }
    ]
}

},{timestamps:true})

const userModel = mongoose.model("user auth",userSchema)

module.exports= userModel
