//? Package List
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config()
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 6000;


//?MongoDB Connect 
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
          const user = new User(req.body);
          await user.save();
          res.status(201).json(user);
     } catch (error) {
          console.error(error);
          res.status(500).json({message : `Something is worng in the server`});
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
app.get('/users/:id',async (req,res)=>{
     try {
          const id =req.params.id;
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
app.put('/users/:id',async(req,res) =>{
     try {
          const id = req.params.id;
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
app.delete('/users/:id',async(req,res) =>{
     try {
          const id =req.params.id;
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

//? Check Connection
app.listen(PORT,() =>{
     console.log(`Server is running on PORT ${PORT}`);
})