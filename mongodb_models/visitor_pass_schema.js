const mongoose = require('mongoose')

const visitor_pass_schema = mongoose.Schema(
    {
        visitor_id:{
            type: mongoose.Schema.Types.ObjectId,ref:'Visitor'
        },
        purpose_of_visit:{
            type: String,
            required: true
        },
        host_name:{
            type: String,
            required: true
        },
        host_address:{
            type: String,
            required: true
        },
        remarks:{
            type: String,
        },
        visit_date:{
            type: String,
            required: true
        },
        checkin_time:{
            type: String
        },
        checkout_time:{
            type: String
        },
    },
    { versionKey: false }
)
const Pass = mongoose.model('Visitor Pass', visitor_pass_schema);
module.exports = Pass;