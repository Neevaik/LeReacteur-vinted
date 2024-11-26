const express = require("express");
const router = express.Router();
const createStripe = require("stripe");

const stripe = createStripe(process.env.STRIPE_API_SECRET);

router.post("/payment", async (req, res) => {
  console.log(req.body);
  try {
    let { status } = await stripe.charges.create({
      amount: (req.body.amount * 100).toFixed(0),
      currency: "eur",
      description: `Paiement vinted pour : ${req.body.title}`,
      source: req.body.token,
    });
    res.json({ status });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;