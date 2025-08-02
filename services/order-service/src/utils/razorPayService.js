const Razorpay = require('razorpay')
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAYKEY_ID_DEV||"rzp_test_JukdKxCGZqamy4",//developmet
    // key_id:'rzp_live_nmEtTvImeXIvf7',//production
    key_secret: process.env.RAZORPAYKEY_SECRET_DEV||"Pafcggj10dqbLCnZxqCyTojt", //developmet
    // key_secret:'u4QbAJziwXhGYmdFWamz2KkZ',//production
})

module.exports = razorpayInstance;