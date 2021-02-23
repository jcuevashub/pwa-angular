const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { Logging } = require('@google-cloud/logging');
const logging = new Logging({
  projectId: process.env.GCLOUD_PROJECT,
});

const { Stripe } = require('stripe');
const stripe = new Stripe('sk_test_51ILgZHLjeFJCOWeVuGij5Zy1Kk1mlAVo5j21F4n5pYpO5LH7n6Tu4x4QRXr27w4MYQxwYsUe1HgUBmNHNHXU3dkV00cIEFcQl0', {
  apiVersion: '2020-08-27',
});

// const nodemailer = require('nodemailer');
// // Configure the email transport using the default SMTP transport and a GMail account.
// // For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// const gmailEmail = functions.config().gmail.email;
// const gmailPassword = functions.config().gmail.password;
// const mailTransport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: gmailEmail,
//     pass: gmailPassword,
//   },
// });

/**
 * When a user is created, create a Stripe customer object for them.
 *
 * @see https://stripe.com/docs/payments/save-and-reuse#web-create-customer
 */
exports.createStripeCustomer = functions.auth.user().onCreate(async (user) => {

  const customer = await stripe.customers.create({ email: user.email,
    phone: user.phoneNumber,
    name: user.displayName});

  const intent = await stripe.setupIntents.create({
    customer: customer.id,
  });

  await admin.firestore().collection('customers').doc(user.uid).set({
    customer_id: customer.id,
    setup_secret: intent.client_secret,
  });

  await admin.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    phone: user.phoneNumber,
    name: user.displayName
  })

  return;
});


/**
 * When adding the payment method ID on the client,
 * this function is triggered to retrieve the payment method details.
 */
exports.addPaymentMethodDetails = functions.firestore
  .document('/customers/{userId}/payment_methods/{pushId}')
  .onCreate(async (snap, context) => {
    try {
      const paymentMethodId = snap.data().id;
      const paymentMethod = await stripe.paymentMethods.retrieve(
        paymentMethodId
      );
      await snap.ref.set(paymentMethod);
      // Create a new SetupIntent so the customer can add a new method next time.
      const intent = await stripe.setupIntents.create({
        customer: `${paymentMethod.customer}`,
      });
      await snap.ref.parent.parent.set(
        {
          setup_secret: intent.client_secret,
        },
        { merge: true }
      );
      return;
    } catch (error) {
      await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
      await reportError(error, { user: context.params.userId });
    }
  });

/**
 * When a payment document is written on the client,
 * this function is triggered to create the payment in Stripe.
 *
 * @see https://stripe.com/docs/payments/save-and-reuse#web-create-payment-intent-off-session
 */

// [START chargecustomer]

exports.createStripePayment = functions.firestore
  .document('customers/{userId}/payments/{pushId}')
  .onCreate(async (snap, context) => {
    const { amount, currency, payment_method } = snap.data();
    try {
      // Look up the Stripe customer id.
      const customer = (await snap.ref.parent.parent.get()).data().customer_id;
      // Create a charge using the pushId as the idempotency key
      // to protect against double charges.
      const idempotencyKey = context.params.pushId;
      const payment = await stripe.paymentIntents.create(
        {
          amount,
          currency,
          customer,
          payment_method,
          off_session: false,
          confirm: true,
          confirmation_method: 'manual',
        },
        { idempotencyKey }
      );
      // If the result is successful, write it back to the database.
      await snap.ref.set(payment);
    } catch (error) {
      // We want to capture errors and render them in a user-friendly way, while
      // still logging an exception with StackDriver
      console.log(error);
      await snap.ref.set({ error: userFacingMessage(error) }, { merge: true });
      await reportError(error, { user: context.params.userId });
    }
  });

// [END chargecustomer]

/**
 * When 3D Secure is performed, we need to reconfirm the payment
 * after authentication has been performed.
 *
 * @see https://stripe.com/docs/payments/accept-a-payment-synchronously#web-confirm-payment
 */
exports.confirmStripePayment = functions.firestore
  .document('customers/{userId}/payments/{pushId}')
  .onUpdate(async (change, context) => {
    if (change.after.data().status === 'requires_confirmation') {
      const payment = await stripe.paymentIntents.confirm(
        change.after.data().id
      );
      change.after.ref.set(payment);
    }
  });

/**
 * When a user deletes their account, clean up after them
 */
exports.cleanupUser = functions.auth.user().onDelete(async (user) => {
  const dbRef = admin.firestore().collection('customers');
  const customer = (await dbRef.doc(user.uid).get()).data();
  await stripe.customers.del(customer.customer_id);
  // Delete the customers payments & payment methods in firestore.
  const batch = admin.firestore().batch();
  const paymetsMethodsSnapshot = await dbRef
    .doc(user.uid)
    .collection('payment_methods')
    .get();
  paymetsMethodsSnapshot.forEach((snap) => batch.delete(snap.ref));
  const paymentsSnapshot = await dbRef
    .doc(user.uid)
    .collection('payments')
    .get();
  paymentsSnapshot.forEach((snap) => batch.delete(snap.ref));

  await batch.commit();

  await dbRef.doc(user.uid).delete();
  return;
});

/**
 * To keep on top of errors, we should raise a verbose error report with Stackdriver rather
 * than simply relying on console.error. This will calculate users affected + send you email
 * alerts, if you've opted into receiving them.
 */

// [START reporterror]

function reportError(err, context = {}) {
  // This is the name of the StackDriver log stream that will receive the log
  // entry. This name can be any valid log stream name, but must contain "err"
  // in order for the error to be picked up by StackDriver Error Reporting.
  const logName = 'errors';
  const log = logging.log(logName);

  // https://cloud.google.com/logging/docs/api/ref_v2beta1/rest/v2beta1/MonitoredResource
  const metadata = {
    resource: {
      type: 'cloud_function',
      labels: { function_name: process.env.FUNCTION_NAME },
    },
  };

  // https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorEvent
  const errorEvent = {
    message: err.stack,
    serviceContext: {
      service: process.env.FUNCTION_NAME,
      resourceType: 'cloud_function',
    },
    context: context,
  };

  // Write the error log entry
  return new Promise((resolve, reject) => {
    log.write(log.entry(metadata, errorEvent), (error) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

// [END reporterror]

/**
 * Sanitize the error message for the user.
 */
function userFacingMessage(error) {
  return error.type
    ? error.message
    : 'An error occurred, developers have been alerted';
}

// Sends an email confirmation when a user changes his mailing list subscription.
// exports.sendEmailConfirmation = functions.database.ref('/users/{uid}').onWrite(async (change) => {
//   // Early exit if the 'subscribedToMailingList' field has not changed
//   if (change.after.child('subscribedToMailingList').val() === change.before.child('subscribedToMailingList').val()) {
//     return null;
//   }

//   const val = change.after.val();

//   const mailOptions = {
//     from: '"Spammy Corp." <noreply@firebase.com>',
//     to: val.email,
//   };

//   const subscribed = val.subscribedToMailingList;

//   // Building Email message.
//   mailOptions.subject = subscribed ? 'Thanks and Welcome!' : 'Sad to see you go :`(';
//   mailOptions.text = subscribed ?
//       'Thanks you for subscribing to our newsletter. You will receive our next weekly newsletter.' :
//       'I hereby confirm that I will stop sending you the newsletter.';

//   try {
//     await mailTransport.sendMail(mailOptions);
//     console.log(`New ${subscribed ? '' : 'un'}subscription confirmation email sent to:`, val.email);
//   } catch(error) {
//     console.error('There was an error while sending the email:', error);
//   }
//   return null;
// });

exports.createSubcription = functions.firestore
.document('/users/{userId}/pro-membership/token')
.onCreate(async (snap, context) => {
  const customer = (await snap.ref.parent.parent.get()).data().customer_id;
    const subscriptionObj = {
      customer: customer.id,
      items: [
        { price: staqConfig.get('stripeDefaultPriceId') }
      ],
    }
  // const customer = (await dbRef.doc(user.uid).get()).data();

  return stripe.subscriptions.create(subscriptionObj).then(sub => {
    functions
    .firestore
    .document(`users/${userId}/pro-memership`)
    .onUpdate({status: 'active'})
  }).catch(err => console.log(err));
});
