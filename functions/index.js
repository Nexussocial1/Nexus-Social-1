/**
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Ensure you have the Firebase CLI installed: `npm install -g firebase-tools`
 * 2. Initialize functions in your project root: `firebase init functions`
 * 3. Choose 'JavaScript' or 'TypeScript' (this code is JavaScript).
 * 4. Replace the contents of `functions/index.js` with this code.
 * 5. Deploy the function: `firebase deploy --only functions`
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function to set the { admin: true } custom claim for a specific user.
 * This function is 'onCall', meaning it can be easily invoked from the Nexus frontend.
 * 
 * @param {Object} data - Contains the 'uid' of the target user.
 * @param {Object} context - Contains authentication context of the caller.
 */
exports.makeAdmin = functions.https.onCall(async (data, context) => {
  // Security Check: Ensure the requester is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'Only authenticated users can trigger this pulse.'
    );
  }

  // Optional: Check if the requester themselves is an admin
  // if (context.auth.token.admin !== true) {
  //   throw new functions.https.HttpsError(
  //     'permission-denied', 
  //     'Only existing administrators can elevate other nodes.'
  //   );
  // }

  const uid = data.uid;

  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'The function must be called with a valid user UID.'
    );
  }

  try {
    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    return {
      status: 'success',
      message: `User ${uid} has been elevated to Admin status within the Nexus.`,
      timestamp: admin.firestore.Timestamp.now().toMillis()
    };
  } catch (error) {
    console.error('Elevation failed:', error);
    throw new functions.https.HttpsError(
      'internal', 
      'A neural pulse error occurred during elevation.'
    );
  }
});
