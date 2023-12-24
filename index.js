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
        { name: 'test', description: 'testing endpoints' },
        { name: 'User', description: 'Endpoints related to users' },
        { name: 'Visitor', description: 'Endpoints related to visitor' },
      ],
      components: {
        securitySchemes: {
            Authorization: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                value: "Bearer <JWT token here>",
                description:"this is for authentication only, to log out, please use the logout api. Logout here won't log you out of the account"
            }
          }
        },
      servers:[
        {
            //url: 'https://benr3433-information-security-assignment.azurewebsites.net/'
            url: 'http://localhost:3000'
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
 *      tags:
 *        - test
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
 *      tags:
 *        - User
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
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: Unauthorized Wrong password
 *        404:
 *          description: Username not found
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: Username not found
 *        409:
 *          description: User is already logged in
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: User is already logged in
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
 *      tags:
 *        - test
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


/**
 * @swagger
 *  /logout:
 *    patch:
 *      summary: Logout user
 *      tags:
 *        - User
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *      responses:
 *        200:
 *          description: Successfully logged out
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: Successfully logged out
 * 
 *        400:
 *          description: User has already logged out or invalid request
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: User has already logged out or invalid request
 * 
 *        404:
 *          description: Username not found
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: Username not found
 *        500:
 *          description: Internal server error
 *          content:
 *            application/json:
 *              schema:
 *                 $ref: '#components/schema/errormessage'
 */
//user logout(cannot interact with api after log out)
app.patch('/logout', async (req, res) => {
  const { username } = req.body;
  try {
    const a = await User.findOne({ username: req.body.username });
    if (a == null) {
      res.status(404).send('Username not found');
    } else {
      if (a.login_status !== true) {
        res.status(400).send("User has already logged out");
      } else {
        await User.updateOne({ username: req.body.username }, { $set: { login_status: false } });
        res.status(200).send("Successfully logged out");
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 *  /visitor/register:
 *    post:
 *      summary: Register a visitor for a user (1 user account only 1 visitor)
 *      tags:
 *        - Visitor
 *      security:
 *        - Authorization: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               properties:
 *                  full_name:
 *                    type: string
 *                  phone_number:
 *                    type: string
 *                  email:
 *                    type: string
 *                    format: email
 *                  license_number:
 *                    type: string
 *               required:
 *                  - full_name
 *                  - phone_number
 *                  - email
 *                  - license_number
 *      responses:
 *        200:
 *          description: Visitor registered successfully
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#components/schema/Visitor'
 * 
 *        400:
 *          description: Visitor already created for this user
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: Visitor has been created for this user (1 user 1 visitor)
 * 
 *        401:
 *          description: Unauthorized - User not logged in
 *          content:
 *            text/plain:
 *              schema:
 *                type: string
 *                example: Please login
 *        500:
 *          description: Internal server error
 *          content:
 *            application/json:
 *              schema:
 *                  $ref: '#components/schema/errormessage'
 */

/**
 * Endpoint to register a visitor for a user (1 user account only 1 visitor)
 */
app.post('/visitor/register', authenticateToken, async (req, res) => {
  try {
    // Check if the user is logged in
    const loggedInUser = await User.findOne({ _id: req.user.user_id });
    if (!loggedInUser || loggedInUser.login_status !== true) {
      return res.status(401).send('Please login');
    }

    // Check if the user already has a visitor ID
    if (loggedInUser.visitor_id != null) {
      return res.status(400).send('Visitor has been created for this user (1 user 1 visitor)');
    }

    // Create a visitor record
    const newVisitorData = {
      full_name: req.body.full_name,
      phone_number: req.body.phone_number,
      email: req.body.email,
      license_number: req.body.license_number,
      user_id: req.user.user_id // Link the visitor to the logged-in user
    };

    // Create the visitor
    const visitor = await Visitor.create(newVisitorData);

    // Update the user's visitor_id field with the newly created visitor's ID
    await User.updateOne({ _id: req.user.user_id }, { $set: { 'visitor_id': visitor._id ,'role':'visitor'} });

    // Return the newly created visitor details
    return res.status(200).json(visitor);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Internal server error occurred' });
  }
});



/**
 * @swagger
 *  /visitor/visitor_pass:
 *    post:
 *      summary: Create a visitor pass
 *      tags:
 *        - Visitor
 *      security:
 *        - Authorization: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *               type: object
 *               properties:
 *                purpose_of_visit
 *               required:
 *                  
 */

/**
 * Endpoint to create a visitor pass
 */
app.post('/visitor/visitor_pass', authenticateToken, async (req, res) => {
  try {
    // Check if the user is logged in
    const loggedInUser = await User.findOne({ _id: req.user.user_id });
    if (!loggedInUser || loggedInUser.login_status !== true) {
      return res.status(401).send('Please login');
    }

    // Find the visitor associated with the logged-in user
    const visitor = await Visitor.findOne({ user_id: req.user.user_id });
    if (!visitor) {
      return res.status(404).send('Visitor not found for this user');
    }

    // Create a new visitor pass
    const newVisitorPass = {
      visitor_id: visitor._id,
      purpose_of_visit: req.body.purpose_of_visit,
      host_name: req.body.host_name,
      host_address: req.body.host_address,
      visit_date: req.body.visit_date,
      checkin_time: Date.now(),
      remarks: req.body.remarks
    };

    // Save the visitor pass details
    const createdVisitorPass = await Pass.create(newVisitorPass);

    // Update the visitor with the newly created visitor pass ID
    await Visitor.updateOne(
      { _id: visitor._id },
      { $push: { 'visitor_pass_id': createdVisitorPass._id } }
    );

    // Return the newly created visitor pass details
    return res.status(200).json(createdVisitorPass);
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: 'Internal server error occurred' });
  }
});





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
 * 
 *          Visitor:
 *              properties:
 *                  full_name:
 *                      type: string
 *                  phone_number:
 *                      type: string
 *                  email:
 *                      type: string 
 *                  license_number:
 *                      type: string
 *                  user_id:
 *                      type: string
 *                  visitor_pass_id:
 *                      type: array
 *                      items:
 *                        type: string
 */