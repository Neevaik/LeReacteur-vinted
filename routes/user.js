const express = require("express")
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
const User = require('../models/User');

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

require('dotenv').config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


router.use(fileUpload());

const convertToBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post('/signup', async (req, res) => {
    try {
        const { email, username, password, newsletter } = req.body;
        if (!username) {
            return res.status(404).json({ message: "Username required" })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(404).json({ message: "Email already used" })
        }
        const salt = uid2(16);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(16);

        let avatarUrl = null;
        if (req.files && req.files.avatar) {
            const avatarFile = req.files.avatar;
            const cloudinaryResult = await cloudinary.uploader.upload(convertToBase64(avatarFile));
            avatarUrl = cloudinaryResult.secure_url;
        }

        const newUser = new User({
            email,
            account: {
                username,
                avatar: avatarUrl,
            },
            newsletter: newsletter,
            token,
            hash,
            salt
        })
        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            token: newUser.token,
            account: newUser.account,
        })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})


router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing email or passord" })
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User doesn't exist" })
        }

        const hash2 = SHA256(req.body.password + user.salt).toString(encBase64);
        if (user.hash !== hash2) {
            return res.status(401).json({ message: "Incorrect password" })
        }

        res.json({
            message: "Connection succeeded",
            account: user.account,
            token: user.token
        });

    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
})

module.exports = router;