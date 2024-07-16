const multer = require("multer")

const path = require("path")

const storage = multer.diskStorage({
    destination:function(req, file, cb) {
        cb(null, "./media")
    },
    // filename:function(req,file,cb){
    //     cb(null, file.originalname)
    // },
     filename:function(req, file, cb){
        const fileName=req.body.firstName;
        const fileExtension= file.originalname.split('.').pop();
        cb(null, `${fileName}.${fileExtension}`)
     }
 })

const uploader =multer({storage,
    fileFilter:function(req,file,cb){
        const extension = path.extname(file.originalname)
        if(extension==".png"|| extension == ".jpg" || extension == ".jpeg"){
            cb(null, true)
        }else{
            cb(new Error("unspported Format"))
        }
    },
    limits:{fileSize:1024*1024}
})


module.exports = {uploader}



//Class lesson
// const multer = require("multer")
// const path = require("path")
// const storage=multer.diskStorage({

// destination:function(req,file,cb){

//     cb(null,"./media")
// },
// filename:function(req,file,cb){
//    cb(null,file.originalname) 
// },

// }
// )
// const uploader=multer({storage,
//     fileFilter:function(req,file,cb){
//         const extension= path.extname( file.originalname )
// console.log(extension)
//         if(extension == ".png" ||  extension == ".jpg" || extension ==".jpeg") {
//             cb (null,true)
//         }else{
//             cb (new Error ("unsupported format"))
//         }
//     },
//     limits:{fileSize:1024*1024}
//     })

// module.exports ={uploader}






// const multer = require('multer');

// // Function to generate a unique filename based on the user's name and original extension
// const generateFilename = (originalName, userName) => {
//     const extension = originalName.split('.').pop(); // Get file extension
//     return `${userName}-${Date.now()}.${extension}`;  // Generate new filename
// };

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, './uploads');
//     },

//     filename: (req, file, cb) => {
//         const userName = req.body.name; // Get user's name from request body
//         if (!userName) {
//             return cb(new Error('User name is required'));
//         }
//         const newFilename = generateFilename(file.originalname, userName);
//         cb(null, newFilename);
//     }
// });

// const fileFilter = (req, file, cb) => {
//     const image = { error: "Unsupported image format" };
//     const imgError = JSON.stringify(image);
//     if (!file.originalname.match(/\.(jpg|jpeg|png|gif|img)$/)) {
//         cb(new Error(imgError));
//     } else {
//         cb(null, true);
//     }
// };

// const fileSize = {
//     limits: { fileSize: 1024 * 1024 * 10 }
// };

// const upload = multer({
//     storage,
//     fileFilter,
//     limits: fileSize
// });

// module.exports = upload;

