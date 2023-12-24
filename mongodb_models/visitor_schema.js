const mongoose = require('mongoose')

const visitorschema = mongoose.Schema(
    {
        name:{
            type: String,
            required: true
        },
        gender:{
            type: String,
            required: true
        },
        age:{
            type: Number,
            required: true
        },
        license_number:{
            type: String,
            required: true
        },
        user_id:{
            type: mongoose.Schema.Types.ObjectId, ref:'User'
        },
        visitor_pass_id:[{
            type: mongoose.Schema.Types.ObjectId, ref:'V_pass'
        }]
    },
    { versionKey: false }
)

const Visitor = mongoose.model('Visitor', visitorschema);
module.exports = Visitor;