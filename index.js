const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const cloudinary = require("cloudinary").v2;

require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());


mongoose.connect(process.env.MONGODB_URI);
cloudinary.config({
    cloud_name: "lereacteur",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

const usersRoutes = require("./routes/user");
app.use('/users',usersRoutes)

const offersRoutes = require("./routes/offer");
app.use('/offers',offersRoutes)

const paymentsRoutes = require("./routes/payment");
app.use('/payments',paymentsRoutes)

app.listen(process.env.PORT, () => {
    console.log("Server started on port 3000");
})