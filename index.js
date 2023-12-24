require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const User = require('./mongodb_models/user_schema')
const Visitor = require('./mongodb_models/visitor_schema')
const Pass = require('./mongodb_models/visitor_pass_schema')
const jwt = require('jsonwebtoken')
const app = express()
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


const port = process.env.PORT || 3000;

app.use(express.json())

const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'WJ BENR3433 INFORMATION SECURITY assignment',
        version: '1.0.0',
      },
      tags:[
        { name: 'default', description: 'Default endpoints' },
        { name: 'User', description: 'Endpoints related to users' }
      ],
      components: {
        securitySchemes: {
            Authorization: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                value: "Bearer <JWT token here>",
                description:"this is for authentication only, to log out, please use the logout api"
            }
          }
        },
      servers:[
        {
            url: 'https://benr3433-information-security-assignment.azurewebsites.net/'
            //url: 'http://localhost:3000'
        }
      ]
    },
    apis: ['./index.js'], // files containing annotations as above
  };
  
  const openapiSpecification = swaggerJsdoc(options);
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openapiSpecification));


 mongoose.connect('mongodb+srv://jng010422:7NVCOJQwL6do3rXn@cluster0.junlsj6.mongodb.net/WJ_VMS')
 .then(()=>{
     console.log('connected to mongodb')
     app.listen(port,() => {
         console.log(`Node Api is running on port ${port}`)
     })
 }).catch((error)=>{
     console.log(error)
 })


/**
 * @swagger
 * /:
 *  get:
 *      summary: This api is for testing
 *      description: This api is used for testing
 *      responses:
 *          200:
 *              description: to test get api
 */
 app.get('/', (req, res) => {
    res.send('Hello World! WJ')
 })




/**
 * @swagger
 * /register:
 *  post:
 *      summary: registration for new users
 *      tags:
 *        - User
 *      description: this api fetch data from mongodb
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#components/schema/registerinfo'
 *      responses:
 *          200:
 *              description: added successfully
 *              content:
 *                 application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          user:
 *                              $ref: '#components/schema/registersuccessful'
 *          409:
 *              description: Username has been taken
 *          500:
 *              description: Internal server error
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  $ref: '#components/schema/errormessage'
 */
 app.post('/register', async(req, res) => {
    try {
        const { username, password, name} = req.body;
        const a = await User.findOne({'username':req.body.username})
        if(a == null){
          const request ={
            username: username,
            password: password,
            name: name,
            role: "user",
            login_status: false
          }  
          const user = await User.create(request)
          const responsemessage= 'User registered successfully';
          res.status(200).json({username:user.username,name:user.name, message: responsemessage})}
        else{
            res.status(409).send('Username has been taken');
        }        
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: error.message})
    }
})

/**
 * @swagger
 *  /login:
 *    post:
 *      summary: Login for users
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               properties:
 *                 username:
 *                  type: string
 *                 password:
 *                  type: string
 *      responses:
 *        200:
 *          description: Successful login
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  username:
 *                    type: string
 *                    description: Username of the logged-in user
 *                  message:
 *                    type: string
 *                    description: Login successful message
 *                  accesstoken:
 *                    type: string
 *                    description: Generated access token for the logged-in user
 *        401:
 *          description: Unauthorized - Wrong password
 *        404:
 *          description: Username not found
 *        409:
 *          description: User is already logged in
 *        500:
 *          description: Internal server error
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#components/schema/errormessage'
 *                
 */


app.post('/login',async(req,res)=>{
  const {username,password}=req.body
  try {
    const b = await User.findOne({username:req.body.username})
    if(b==null){
      res.status(404).send('Username not found');
    }else{
      if(b.login_status==true){
        res.status(409).send('User is already logged in');
      }else{
        const c = req.body.password === b.password;      
        if(!c){
          res.status(401).send('Unauthorized: Wrong password');
        }else{
        await User.updateOne({username:req.body.username},{$set:{login_status:true}})
        const login_user= await User.findOne({username:req.body.username})
        access_token=jwt.sign({username:login_user.username,user_id:login_user._id,role:login_user.role},process.env.JWT_SECRET)
        res.json({username:login_user.username,message:"login successful",accesstoken: access_token})
      }
      }
      }}
   catch (error) {
    console.log(error.message);
        res.status(500).json({message: error.message})
  }
})

//middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.JWT_SECRET, (err, login_user) => {
    console.log(err)
    if (err) return res.sendStatus(403)
    req.user = login_user
    next()
  })
}

/**
 * @swagger
 *  /showjwt:
 *    get:
 *      summary: Display user information from JWT token
 *      security:
 *        - Authorization: []
 *      responses:
 *        200:
 *          description: Successful retrieval of user information
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#components/schema/jwtinfo'
 *                description: User information retrieved from JWT token
 *        401:
 *          description: Unauthorized - Invalid or missing token
 *          
 */
//test jwt
app.get('/showjwt',authenticateToken,(req,res)=>{
  res.send(req.user)
})

//user logout(cannot interact with api after log out)
app.patch('/logout',async(req,res)=>{
  const {username}=req.body
  try {
    const a = await User.findOne({username:req.body.username})
    if(a==null){
      res.status(404).send('Username not found');
    }else{
      if(a.login_status!= true){
        res.send("user has logout")
      }else{
        await User.updateOne({username:req.body.username},{$set:{login_status:false}})
        res.send("successfully logout")
      }
    }
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({message: error.message})
  }
})



/**
 * @swagger
 *  components:
 *      schema:
 *          registerinfo:
 *              type: object
 *              properties:
 *                  username:
 *                      type: string
 *                  password:
 *                      type: string
 *                  name:
 *                      type: string
 * 
 * 
 *          registersuccessful:
 *              type: object
 *              properties:
 *                  username:
 *                      type: string
 *                  name:
 *                      type: string
 *                  message:
 *                      type: string
 *                      description: Additional message
 * 
 *          errormessage:
 *              type: object
 *              properties:
 *                message:
 *                  type: string
 *                  example: Internal server error occurred
 * 
 *          jwtinfo:
 *            type: object
 *            properties:
 *              username:
 *                type: string
 *              user_id: 
 *                type: string
 *              role:
 *                type: string
 * 
 *          User:
 *              type: object
 *              properties:
 *                  username:
 *                      type: string
 *                  password:
 *                      type: string
 *                  name:
 *                      type: string 
 *                  role:
 *                      type: string
 *                  visitor_id:
 *                      type: string
 *                      format: uuid
 *                  login_status:
 *                      type: boolean
 */