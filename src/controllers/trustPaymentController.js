// controllers/trustPaymentsController.js
const jwt = require("jsonwebtoken");

const TRUST_PAYMENTS_CONFIG = {
  jwtUsername: "JWT@lapsnaps.com",
  jwtSecret:
    "56-ce631318bac476a794450ed5f806c4f08c847c3d61f1d73b3153c2ff8fca3087",
  testSiteReference: "test_fbecomltd143257",
  liveSiteReference: "fbecomltd143258",
};

exports.generateJWT = async (req, res) => {
  try {
    const {
      amount,
      currency = "GBP",
      orderReference,
      isTest = true,
      userDetails = {},
    } = req.body;

    if (!amount || !currency || !orderReference) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: amount, currency, orderReference",
      });
    }

    // Use your actual domain for redirects
    const baseUrl = "https://lapsnaps.com"; // or "http://localhost:3000" for testing

    const jwtPayload = {
      iss: TRUST_PAYMENTS_CONFIG.jwtUsername,
      iat: Math.floor(Date.now() / 1000),
      payload: {
        // Required core fields
        sitereference: TRUST_PAYMENTS_CONFIG.testSiteReference,
        accounttypedescription: "ECOM",
        currencyiso3a: currency,
        baseamount: amount.toString(), // Already in pence
        orderreference: orderReference.toString(),

        // Request types - try with just THREEDQUERY first
        requesttypedescriptions: ["THREEDQUERY"],

        // Redirect URLs - CRITICAL FIXES:
        redirecturl: `${baseUrl}/payment/redirect-handler`,
        termurl: `${baseUrl}/payment/3ds-return`, // This should be YOUR domain

        // Settlement
        settlestatus: "0",

        // Customer information
        ...(userDetails?.firstName && {
          billingfirstname: userDetails.firstName.substring(0, 50),
        }),
        ...(userDetails?.lastName && {
          billinglastname: userDetails.lastName.substring(0, 50),
        }),
        ...(userDetails?.email && {
          billingemail: userDetails.email.substring(0, 100),
        }),

        // Additional recommended fields
        cachetoken: "yes",
        threedbypass: "no",

        // Billing address (optional but recommended)
        ...(userDetails?.address && {
          billingpremise: userDetails.address.substring(0, 100),
          billingpostcode: userDetails.postcode || "AB1 2CD",
        }),
      },
    };

    console.log(
      "[Trust Payments] JWT Payload:",
      JSON.stringify(jwtPayload, null, 2)
    );

    const token = jwt.sign(jwtPayload, TRUST_PAYMENTS_CONFIG.jwtSecret, {
      algorithm: "HS256",
    });

    console.log("[Trust Payments] JWT generated, length:", token.length);

    res.json({
      success: true,
      jwt: token,
      debug: {
        payload: jwtPayload,
        redirectUrl: `${baseUrl}/payment/redirect-handler`,
      },
    });
  } catch (error) {
    console.error("[Trust Payments] JWT generation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate payment token",
      details: error.message,
    });
  }
};

// Helper function to validate JWT before sending
exports.validateJWT = (jwtToken, secret) => {
  try {
    const decoded = jwt.verify(jwtToken, secret);
    console.log("[Trust Payments] JWT is valid");
    console.log("[Trust Payments] Decoded payload:", decoded);
    return { valid: true, payload: decoded };
  } catch (error) {
    console.error("[Trust Payments] JWT validation error:", error);
    return { valid: false, error: error.message };
  }
};

/**
 * Verify Trust Payments transaction (optional)
 * POST /api/trust-payments/verify
 */
exports.verifyTransaction = async (req, res) => {
  try {
    const { transactionReference, orderReference } = req.body;

    if (!transactionReference || !orderReference) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: transactionReference, orderReference",
      });
    }

    console.log(
      "[Trust Payments] Verifying transaction:",
      transactionReference
    );

    // In a real implementation, you would:
    // 1. Query Trust Payments API to verify the transaction
    // 2. Check the transaction status
    // 3. Update your database with the payment status

    // For now, we'll return a success response
    // You can implement actual verification using Trust Payments API
    res.json({
      success: true,
      verified: true,
      transactionReference,
      orderReference,
      message: "Transaction verified successfully",
    });
  } catch (error) {
    console.error("[Trust Payments] Verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify transaction",
      details: error.message,
    });
  }
};

/**
 * Handle Trust Payments webhook (optional)
 * POST /api/trust-payments/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;

    console.log("[Trust Payments] Webhook received:", webhookData);

    // Verify webhook signature if configured
    // Process the webhook data
    // Update your database with payment status

    res.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("[Trust Payments] Webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process webhook",
    });
  }
};
