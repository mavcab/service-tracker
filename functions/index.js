const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();

// Use CORS with no extra spaces in the object literal.
app.use(cors({origin: true}));
// Parse JSON request bodies.
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    console.log("Received webhook event:", req.body);

    const eventType = req.body.event_type;
    if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
      const subscriptionID = req.body.resource.id;
      console.log("Subscription cancelled. ID:", subscriptionID);

      // Find the customer with the matching subscription ID.
      const customersRef = admin.firestore().collection("customers");
      const snapshot = await customersRef
          .where("subscriptionID", "==", subscriptionID)
          .get();
      if (!snapshot.empty) {
        snapshot.forEach(async (docSnap) => {
          console.log("Updating customer", docSnap.id, "to status 'Canceled'");
          await docSnap.ref.update({status: "Canceled"});
        });
      } else {
        console.log(
            "No matching customer found for subscriptionID:",
            subscriptionID,
        );
      }
    }
    // Respond to PayPal indicating the event was received.
    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("Error handling webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

exports.webhook = functions.https.onRequest(app);
