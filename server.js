//? Package List
const express = require('express');
const bodyParser = require('body-parser');
const bycript = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config()
const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 6000;

//? Check Connection
app.listen(port,() =>{
     console.log(`Server is running on PORT ${port}`);
})
const url = process.env.MONGODB_URI;
mongoose.connect(url, {useNewUrlParser : true})
  .then(() => console.log('Connected!'));

mongoose.connection.on('connected',()=>{
     console.log(`Mongoose default connection open`);
});
mongoose.connection.on('error',(err)=>{
     console.log(`Mongoose default connection error`);
});

//? MongoDB Schema
const userSchema = new mongoose.Schema(
     {
          fname : String,
          lname : String,
          email : String,
          password : String,
          age : Number
     },
     {
          timestamps : true
     }
)
const User = mongoose.model('User',userSchema);

//? API to check connection
app.get('/',(req,res) =>{
     res.json({message: 'Welcome to my app'});
})


//? API to create a User
app.post('/users',async (req,res) => {
     try {
          const salt =await bycript.genSalt(10);
          const hash = await bycript.hash(req.body.password,salt);
          const userObj = {
               fname : req.body.fname,
               lname : req.body.lname,
               email : req.body.email,
               password : hash,
               age : req.body.age,

          }
          const user = new User(userObj);
          await user.save();
          res.status(201).json(user);
     } catch (error) {
          console.error(error);
          res.status(500).json({message : `Something is worng in the server`});
     }
})

// //? API to LOG IN

app.post('/users/login', async(req,res) =>{
     try {
          const {email , password, type, refreshToken} = req.body;
          if(!type){
               res.status(401).json({message : `Type is not defined`});
          }
          else{
               if(type == 'email'){
                    await handleEmail(email, res, password);
               }
               else{
                    handleRefreshToken(refreshToken, res);
                    
               }
          }
     } catch (error) {
          console.error(error);
          res.status(500).json({message : `Something is worng in the server`});
     }
})
//? Creating a Middleware to Authenticate JWT Access Token

const authenticateToken = (req, res, next) =>{
     const authHeader = req.headers.authorization;
     const token = authHeader && authHeader.split(" ")[1];
     if(!token){
          res.status(401).json({message : `Unauthorized`});
          return ;
     }
     else{
          jwt.verify(token, process.env.JWT_Secret, (err,user) =>{
               if(err){
                    res.status(401).json({message : `Unauthorized`});
               }
               else{
                    req.user = user;
                    next();
               }
          })
     }
}
//? get a user profile 
app.get('/profile',authenticateToken,async(req,res) =>{
     try {
          const id =req.user.id;
          const user = await User.findById(id);
          if(user){
               res.json(user);
          }
          else{
               res.status(404).json({message:"User Not Found"});
          }
     } catch (error) {
          res.status(500).json({message : `SomeThing wrong in Server`});
     }
})

 //? API to get Users 
app.get('/users',async(req,res) =>{
     try {
          const users =  await User.find({})
          res.json(users);
          
     } catch (error) {
          res.status(404).json(`User not Found`);
     }
})

//? API to get specfic user
app.get('/users',authenticateToken,async (req,res)=>{
     try {
          const id =req.user.id;
          const user = await User.findById(id);
          if(user){
               res.json(user);
          }
          else{
               res.status(404).json({message:"User Not Found"});
          }
     } catch (error) {
          res.status(500).json({message : `SomeThing wrong in Server`});
     }
})

 //? API to Update a user
app.put('/users',authenticateToken,async(req,res) =>{
     try {
          const id = req.user.id;
          const body = req.body
          const user = await User.findByIdAndUpdate(id,body,{new : true});
          if(user){
               res.json(user);
          }
          else {
               res.status(404).json({message:"User Not Found"});
          }
     } catch (error) {
          res.status(500).json({message : `SomeThing wrong in Server`});
     }
})

 //? API to DELETE a user
app.delete('/users',authenticateToken,async(req,res) =>{
     try {
          const id =req.user.id;
          const user = await User.findByIdAndDelete(id);
          if(user){
               res.status(200).json(user);
          }
          else {
               res.status(404).json({message : "User is not Found"});
          }
     } catch (error) {
          res.status(500).json({message : `SomeThing wrong in Server`});
     }

})

function handleRefreshToken(refreshToken, res) {
     if(!refreshToken){
          res.status(401).json({message : `RefreshToken is not defined`})
     }
     else{
          jwt.verify(refreshToken, process.env.JWT_Secret, async (err, payload) => {
               if (err) {
                    res.status(401).json({ message: `Unauthorized` });
               }
               else {
                    const id = payload.id;
                    const user = await User.findById(id);
                    if (user) {
                         res.status(401).json(user);
                    }
                    else {
                         getUserTokens(user, res);
                    }
               }
          });
     }
}
function getUserTokens(user, res) {
     const accessToken = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_Secret, { expiresIn: '1m' });
     const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_Secret, { expiresIn: '3m' });
     const userObj = user.toJSON();
     userObj['accessToken'] = accessToken;
     userObj['refreshToken'] = refreshToken;
     res.json(userObj);
}
async function handleEmail(email, res, password) {
     const user = await User.findOne({ email: email });
     if (!user) {
          res.status(401).json({ message: `User is not found` });
     }
     else {
          const validPassword = await bycript.compare(password, user.password);
          if (!validPassword) {
               res.status(401).json({ message: `Wrong Password` });
          }
          else {
               getUserTokens(user, res);
          }
     }
}