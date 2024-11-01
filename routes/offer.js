const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

const Offer = require("../models/Offer");
const User = require("../models/User");

const cloudinary = require("cloudinary").v2;

require('dotenv').config()

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});


const convertToBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post('/publish', fileUpload(), async (req, res) => {
    try {
        const { name, description, price } = req.body;

        if (description.length > 500) {
            return res.status(400).json({ message: "Description must be 500 characters or less" });
        }
        if (price > 100000) {
            return res.status(400).json({ message: "Price must not exceed 100,000" });
        }
        const details = JSON.parse(req.body.details);

        if (!req.files || !req.files.picture) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const pictureToUpload = req.files.picture;

        const requestToken = req.headers['authorization'];
        if (!requestToken) {
            return res.status(403).json({ message: "Token not provided" });
        }

        const token = req.headers.authorization.replace("Bearer ", "");
        const user = await User.findOne({ "token": token });

        if (!user) {
            return res.status(404).json({ message: "User not found or invalid token" });
        }

        const newOffer = new Offer({
            product_name: name,
            product_description: description,
            product_price: price,
            product_details: details,
            owner: user._id
        });

        await newOffer.save();

        const cloudinaryResult = await cloudinary.uploader.upload(convertToBase64(pictureToUpload), {
            folder: `vinted/offers/${newOffer._id}`
        });

        newOffer.product_image = cloudinaryResult.secure_url;
        await newOffer.save();

        res.status(201).json({
            _id: newOffer._id,
            product: newOffer,
            message: "Offer has been posted"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, details } = req.body;

        const requestToken = req.headers['authorization'];
        if (!requestToken) {
            return res.status(403).json({ message: "Token not provided" });
        }

        const token = requestToken.replace("Bearer ", "");
        const user = await User.findOne({ "token": token });
        if (!user) {
            return res.status(404).json({ message: "User not found or invalid token" });
        }

        const offer = await Offer.findById(id);
        if (!offer || offer.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to modify this offer" });
        }

        offer.product_name = name || offer.product_name;
        offer.product_description = description || offer.product_description;
        offer.product_price = price || offer.product_price;
        offer.product_details = details ? JSON.parse(details) : offer.product_details;

        await offer.save();

        res.status(200).json({
            _id: offer._id,
            product: offer,
            message: "Offer has been updated"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const requestToken = req.headers['authorization'];
        if (!requestToken) {
            return res.status(403).json({ message: "Token not provided" });
        }

        const token = requestToken.replace("Bearer ", "");
        const user = await User.findOne({ "token": token });

        if (!user) {
            return res.status(404).json({ message: "User not found or invalid token" });
        }

        const offer = await Offer.findById(id);
        if (!offer || offer.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this offer" });
        }
        await cloudinary.uploader.destroy(offer.product_image);
        await offer.deleteOne();

        res.status(200).json({ message: "Offer has been deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const { name, priceMin, priceMax, sort, page = 1 } = req.query;
        const filters = {};

        if (name) {
            filters.product_name = { $regex: name, $options: 'i' };
        }
        if (priceMin) {
            filters.product_price = { $gte: Number(priceMin) };
        }
        if (priceMax) {
            filters.product_price = { $lte: Number(priceMax) };
        }

        let sortOptions = {};
        if (sort === 'desc') {
            sortOptions.product_price = -1;
        } else if (sort === 'asc') {
            sortOptions.product_price = 1;
        }

        const offers = await Offer.find(filters).sort(sortOptions)

        const count = await Offer.countDocuments(filters);

        res.status(200).json({
            count,
            offers,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const offer = await Offer.findById(id).populate('owner', 'account.username account.avatar');

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        res.status(200).json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



module.exports = router;