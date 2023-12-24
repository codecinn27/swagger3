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
      servers:[
        {
            url: 'https://benr3433-information-security-assignment.azurewebsites.net/'//change this to the Azure url after finish testing
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
 *      summary: registration for new user
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
 *                              $ref: '#components/schema/User'
 *                          message:
 *                              type: string
 *                              description: Additional message
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
 *                                  type: string
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
          res.status(200).json({user:user, message: responsemessage})}
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