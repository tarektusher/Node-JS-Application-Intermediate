//? Package List
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config()
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT

//? Create a object and id
// let users = [];
let cc=0;

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
const Schema = mongoose.Schema;
const objectId = Schema.ObjectId;
const users = new Schema ({
     fname : String,
     lname : String,
     email : String,
     id : String,
})

//? API to check connection
app.get('/',(req,res) =>{
     res.json({message: 'Welcome to my app'});
})


//? API to create a User
app.post('/users',(req,res) => {
     const user = req.body;
     user.id = ++cc;
     users.push(user);
     res.status(201).json(user);
})

//? API to get Users 
app.get('/users',(req,res) =>{
     res.status(200).json(users);
})

//? API to get specfic user
app.get('/users/:id',(req,res)=>{
     const id =req.params.id;
     const user = users.find((u) => u.id ==  id);
     if(user){
          res.json(user);
     }
     else{
          res.status(404).json({message:"User Not Found"});
     }
})

//? API to Update a user
app.put('/users/:id',(req,res) =>{
     const id = req.params.id;
     const user = users.find((u) => u.id ==id);
     if(user){
          // user.fname = "Afroza";
          // user.lname = "Farzana";
          // user.email = "afrozalimacox@gmail.com";
          const body =req.body;
          user.fname = body.fname;
          user.lname = body.lname;
          user.email = body.email;
          res.json(user);
     }
     else {
          res.status(404).json({message:"User Not Found"});
     }
})

//? API to DELETE a user
app.delete('/users/:id',(req,res) =>{
     const id =req.params.id;
     const userIndex = users.findIndex((u) => u.id == id);
     if(userIndex){
          users.splice(userIndex,1)
          res.status(200).json(users);
     }
     else {
          res.status(404).json({message : "User is not Found"});
     }

})

//? Check Connection
app.listen(PORT,() =>{
     console.log(`Server is running on PORT ${PORT}`);
})