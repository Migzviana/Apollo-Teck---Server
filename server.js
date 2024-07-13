const express = require("express");
const app = express();
const stripe = require("stripe")("sk_test_51POPkhDNyb8RcS3B2hZgV0xXHT9Lk7mi2M2SLwzBVAK99E5mwzgnhraUKsx4IMHDjcIoe7TNmPAewqrbZKBhvZda00qFwTYFv9"); // Substitua pela sua chave secreta do Stripe
const bodyParser = require("body-parser");

app.use(bodyParser.json());

// Endpoint para criar PaymentIntent
app.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Endpoint para webhooks do Stripe
app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body,
        sig,
        "whsec_BAteeLH08LIRaAN3g9T4HcGjEi15vyDG"
      );
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`, err.message);
      return response.sendStatus(400);
    }

    switch (event.type) {
      case "charge.dispute.created":
        const dispute = event.data.object;
        console.log(`Dispute created for charge: ${dispute.charge}`);
        // Enviar notificação ao usuário ou à equipe de suporte
        break;

      case "charge.failed":
        const failedCharge = event.data.object;
        console.log(`Charge failed for: ${failedCharge.id}`);
        // Notificar o usuário
        break;

      case "charge.refunded":
        const refund = event.data.object;
        console.log(`Charge refunded: ${refund.id}`);
        // Atualizar o registro de pagamento do usuário
        break;

      case "charge.succeeded":
        const charge = event.data.object;
        console.log(`Charge succeeded: ${charge.id}`);
        // Atualizar status do pedido do usuário para "pago"
        break;

      case "payment_intent.amount_capturable_updated":
        const paymentIntent = event.data.object;
        console.log(`Amount capturable updated for PaymentIntent: ${paymentIntent.id}`);
        // Atualizar status do pedido do usuário, se necessário
        break;

      case "payment_intent.canceled":
        const canceledPaymentIntent = event.data.object;
        console.log(`PaymentIntent canceled: ${canceledPaymentIntent.id}`);
        // Notificar o usuário
        break;

      case "payment_intent.created":
        const createdPaymentIntent = event.data.object;
        console.log(`PaymentIntent created: ${createdPaymentIntent.id}`);
        // Registrar a tentativa de pagamento
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object;
        console.log(`PaymentIntent payment failed: ${failedPaymentIntent.id}`);
        // Notificar o usuário
        break;

      case "payment_intent.processing":
        const processingPaymentIntent = event.data.object;
        console.log(`PaymentIntent processing: ${processingPaymentIntent.id}`);
        // Atualizar status do pedido do usuário
        break;

      case "payment_intent.requires_action":
        const actionPaymentIntent = event.data.object;
        console.log(`PaymentIntent requires action: ${actionPaymentIntent.id}`);
        // Notificar o usuário sobre a ação necessária
        break;

      case "payment_intent.succeeded":
        const succeededPaymentIntent = event.data.object;
        console.log(`PaymentIntent succeeded: ${succeededPaymentIntent.id}`);
        // Atualizar status do pedido do usuário para "pago"
        break;

      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }

    response.json({ received: true });
  }
);

app.listen(4242, () => console.log("Servidor rodando na porta 4242"));
