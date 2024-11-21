const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const usersRoutes = require("./routes/user");
app.use('/users',usersRoutes)

const offersRoutes = require("./routes/offer");
app.use('/offers',offersRoutes)

app.listen(process.env.PORT, () => {
    console.log("Server started on port 3000");
})