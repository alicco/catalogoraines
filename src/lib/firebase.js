// Firebase configuration
// Replace these values with your Firebase project credentials
// Get them from: https://console.firebase.google.com/project/raines-project/settings/general

export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "raines-project.firebaseapp.com",
    projectId: "raines-project",
    storageBucket: "raines-project.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Instructions to set up:
// 1. Go to https://console.firebase.google.com/
// 2. Click "Add project" or "Create a project"
// 3. Enter "raines-project" as project ID
// 4. Follow the wizard
// 5. Once created, go to Project Settings (gear icon)
// 6. Scroll down to "Your apps" and click the web icon (</>)
// 7. Register app with name "AISAC Kit Manager"
// 8. Copy the firebaseConfig values and replace them above
// 9. Enable Firestore: Go to Build > Firestore Database > Create database
// 10. Start in production mode (we'll add rules later)
