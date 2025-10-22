// routes/trustPayments.js
const express = require("express");
const router = express.Router();
const trustPaymentsController = require("../controllers/trustPaymentController");

// Generate JWT for payment
router.post(
  "/trust-payments/generate-jwt",
  trustPaymentsController.generateJWT
);

// Verify transaction (optional)
router.post(
  "/trust-payments/verify",
  trustPaymentsController.verifyTransaction
);

// Webhook endpoint (optional)
router.post("/trust-payments/webhook", trustPaymentsController.handleWebhook);

module.exports = router;
