const mongoose=require("mongoose")

const userSchema = new mongoose.Schema({

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

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const userModel = mongoose.model("userauth", userSchema)

module.exports= userModel
