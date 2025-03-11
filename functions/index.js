const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.paypalWebhook = functions.https.onRequest(async (req, res) => {
  // In production, you should verify the webhook signature.
  const event = req.body;

  if (event.event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
    const subscriptionID = event.resource.id;
    console.log("Received cancellation for subscription:", subscriptionID);
    try {
      const snapshot = await admin
          .firestore()
          .collection("customers")
          .where("subscriptionID", "==", subscriptionID)
          .get();
      if (!snapshot.empty) {
        snapshot.forEach(async (docSnap) => {
          await docSnap.ref.update({status: "Canceled"});
          console.log("Updated customer", docSnap.id, "status to Canceled.");
        });
      } else {
        console.log("No customer found with subscriptionID:", subscriptionID);
      }
    } catch (error) {
      console.error("Error updating customer status:", error);
      res.status(500).send("Error");
      return;
    }
  }
  res.status(200).send("OK");
});
