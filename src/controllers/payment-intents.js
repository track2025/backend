const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const payment_intents = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({ error: "Amount and currency are required" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Ensure integer
      currency: currency.toLowerCase(),
    });

    return res.json({ 
      success: true,
      client_secret: paymentIntent.client_secret 
    });

  } catch (error) {
    console.error("Stripe Error:", error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

module.exports = { payment_intents };