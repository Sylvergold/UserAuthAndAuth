const userModel=require("../model/userModel")
const sendMail = require("../helpers/email")
const bcrypt=require("bcryptjs")
require("dotenv").config()
const html=require("../helpers/html.js")
const jwt= require("jsonwebtoken")
const cloudinary= require("../helpers/cloudinary.js")
const fs = require("fs")

exports.createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phoneNumber, passWord } = req.body;

        // Check if email already exists
        const checkIfAnEmailExists = await userModel.findOne({ email: email.toLowerCase() });
        if (checkIfAnEmailExists) {
            return res.status(400).json("User with this email already exists");
        }

        // Generate salt and hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passWord, salt);

        // Check if the profile picture is uploaded
        if (!req.file) {
            return res.status(400).json("Kindly upload your profile picture");
        }

        // Upload profile picture to Cloudinary
        const cloudProfile = await cloudinary.uploader.upload(req.file.path, { folder: "users_dp" });

        // Prepare user data
        const data = {
            firstName,
            lastName,
            email: email.toLowerCase(),
            phoneNumber,
            passWord: hashedPassword,
            profilePicture: {
                pictureId: cloudProfile.public_id,
                pictureUrl: cloudProfile.secure_url
            }
        };

        // Create the user
        const createdUser = await userModel.create(data);

        // Delete the image from the local filesystem
        fs.unlink(req.file.path, (err) => {
            if (err) {
                return res.status(400).json("Unable to delete user profile image: " + err.message);
            }
        });

        // Generate JWT token
        const userToken = jwt.sign({ id: createdUser._id, email: createdUser.email }, process.env.jwtSecret, { expiresIn: "3 minutes" });

        // Generate verification link
        const verifyLink = `${req.protocol}://${req.get("host")}/api/v1/verify/${createdUser._id}/${userToken}`;

        // Send verification email
        sendMail({
            subject: "Kindly Verify your Email",
            email: createdUser.email,
            html: html(verifyLink, createdUser.firstName)
        });

        // Send response
        res.status(201).json({
            message: `Welcome ${createdUser.firstName}, kindly check your email to verify your account.`,
            data: createdUser
        });
    } catch (error) {
        res.status(500).json(error.message);
    }
};


//create an end point to verify users email
exports.verifyEmail=async (req,res)=>{
    try {
const id=req.params.id
const findUser=await userModel.findById(id)
await jwt.verify(req.params.token,process.env.jwtSecret,(err)=>{
    if(err){
        const link=`${req.protocol}://${req.get("host")}/api/v1/newemail/${findUser._id}`

        sendMail({ subject : `Kindly Verify your mail`,
            email:findUser.email,
            html:html(link,findUser.firstName)
          
        })
 
    return res.json(`This link has expired, kindly check your email link`)
      
    }else{
        if(findUser.isVerified == true){
            return res.status(400).json("Your account has already been verified")
        }
    userModel.findByIdAndUpdate(id,{isVerified:true})
    
        res.status(200).json("You have been verified,kindly go ahead to log in")
    }
})
    
    } catch (error) {
        res.status(500).json(error.message)  
      
    }
}

exports.newEmail=async(req,res)=>{
    try {

        const user=await userModel.findById(req.params.id)
        const userToken = jwt.sign({id:user._id,email:user.email},process.env.jwtSecret,{expiresIn: "3 Minutes"})
        const reverifyLink= `${req.protocol}://${req.get("host")}/api/v1/verify/${user._id}/${userToken}`
        sendMail({ subject : `Kindly re Verify your email`,
            
            email:user.email,
            html:html(reverifyLink,user.firstName)}
        )
    } catch (error) {
       res.status(500).json(error.message) 
    }
}
exports.logIn= async (req,res)=>{
try {

    const {email,password}=req.body

    const findWithEmail=await userModel.findOne({email:email.toLowerCase()})
    if(!findWithEmail){
        return res.status(404).json(`user with  the email ${email} does not exist`)
    }
    // const bcryptPassword=findWithEmail.passWord
    const checkPassword=await bcrypt.compare(password,findWithEmail.passWord)
    if(!checkPassword){
        return res.status(400).json("password in correct")
    }

const user=await jwt.sign({firstName:findWithEmail.firstName,},process.env.jwtSecret,{expiresIn: "2 minutes"})

const{isVerified ,phoneNumber,createdAt,updatedAt,__v,_id,passWord, ...others}=findWithEmail._doc
  res.status(200).json({message:"login Successful",data: others,token:user})

} catch (error) {
    res.status(500).json(error.message)  
}
}

//update a user
exports.updateUser = async (req, res)=>{
    try {
        const userId = req.params.id;
        const {firstName,phoneNumber,lastName}=req.body

        const data={
            firstName,
            phoneNumber,
            lastName
        }
        const updatedUser = await userModel.findByIdAndUpdate(userId, data,{new:true});
       
         return   res.status(200).json({
                message: "user updated successfully",
                data: updatedUser
            })
        
        } catch (error) {
      return  res.status(500).json(error.message)
    }
}

exports.makeAdmin =async(req,res)=>{
try {
  const newAdmin=  await userModel.findByIdAndUpdate(req.params.id,{isAdmin:true})
    res.status(200).json({
        message:`${newAdmin.firstName} is now an admin`
    })
} catch (error) {
    res.status(500).json(error.message)
}
}

exports.makeSuperAdmin= async(req,res)=>{
    try {
        const newSuperAdmin = await userModel.findByIdAndUpdate(req.params.id,{isAdmin:true});

        res.status(200).json({
            message:`${newSuperAdmin.Firstname} is now an SUPER ADMIN.`
        })
        
    } catch (error) {
        res.status(500).json({
            message:error.message 
        })
        
    }
}


exports.updatePicture = async (req, res) => {
    try {
        // Extract token from headers
        const userToken = req.headers.authorization.split(" ")[1];

        // Check if file is provided
        if (!req.file) {
            return res.status(400).json({ message: "No profile picture selected" });
        }

        // Verify token
        jwt.verify(userToken, process.env.jwtSecret, async (error, newUser) => {
            if (error) {
                return res.status(400).json({ message: "Could not authenticate" });
            } else {
                const userId = newUser.id;

                // Find user to get the current profile picture
                const user = await userModel.findById(userId);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                // Save the current profile picture details
                const formerImage = {
                    pictureId: user.profilePicture.pictureId,
                    pictureUrl: user.profilePicture.pictureUrl
                };

                // Upload new profile picture to Cloudinary
                const cloudProfile = await cloudinary.uploader.upload(req.file.path, { folder: "users_dp" },{new:true});

                // Prepare update data
                const pictureUpdate = {
                    profilePicture: {
                        pictureId: cloudProfile.public_id,
                        pictureUrl: cloudProfile.secure_url,
                        formerImages: [...user.profilePicture.formerImages, formerImage] // Save old picture details
                    }
                };

                // Update user profile picture
                const updatedUser = await userModel.findByIdAndUpdate(userId, pictureUpdate, { new: true });

                //delete the picture from media folder
                fileSystem.unlink(req.file.path,(error)=>{
                    if(error){
                        return res.status(400).json({
                            message:"unable to delete users profile picture",error
                        })            
                    }
                });

                // Return success response
                return res.status(200).json({
                    message: "User image successfully changed",
                    data: updatedUser.profilePicture
                });
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// exports.updatePicture = async(req, res)=>{
//     try {
//         const userToken = req.headers.authorization.split(" ")[1]
//         if(!req.file){
//             return res.status(400).json({message:"No profile picture selected"})
//         }
//         // verify token
//         await jwt.verify(userToken, process.env.jwtSecret, async(err, newUser)=>{
//             if(!err){
//                 return res.status(400).json("Could not authenticate")
//             } else {
//                 req.user = newUser.id

//             const cloudImage = await cloudinary.uploader.upload(req.file.path, {folder: "user dp"}, (err, data)=>{
//                 if(err){
//                     console.log(err)
//                 }
//                 // Cloudinary.upload.destroy()
//                 return data
//             })
//             const userId = newUser.id
//             console.log(userId)

//             const pictureUpdate = {profilePicture:{
//                 pictureId:cloudImage.public_id,
//                 pictureUrl:clooudImage.secure_url
//             }}
//             const uoser = await userModel.findById(userId)
//             const formerImageId = user.profilePicture.pictureId
//             await cloudinary.uploader.destroy(formerImageId)

//             const checkUser = await userModel.findByIdAndUpdate(userId, pictureUpdate, {new:true})
//             return res.status(200).json({message: "User image successfully updated"})
//             }
//         })
//     } catch (error) {
//         res.status(500).json(error.message)
//     }
// }
