🛡️ CrisisConnect: Emergency Response Hub

CrisisConnect is a mobile-first, Progressive Web App (PWA)
built to coordinate real-time emergency response between victims, volunteers, and official authorities.


[!IMPORTANT]
DEMO VERSION NOTICE
This project is currently in a Hackathon Demo State. 
Certain security features are bypassed for walkthrough purposes 
e.g., using the access code CRISIS2026 for Official Access) and simulated incident data may be used to demonstrate real-time mapping and movement features.


1. 🏗️ Project Workflows

1. 🔐 Official Authority Access (Demo Flow)
Workflow: Users navigate to the "Official" tab and enter the demo access code.
Logic: The system validates the code CRISIS2026 and unlocks the Authority Command Center UI.
Storage: Role updates are saved to the userRoles collection in Firestore.

2. 🆘 Instant SOS Reporting

Workflow: Users tap the "SOS" button on the home screen.
Geolocation: The app captures the device's latitude and longitude via the browser's Geolocation API.
Data Pipeline: The incident is added to Firestore and synced to the backend to alert nearby responders.

3. 🗺️ Real-Time Crisis Mapping

Workflow: Active incidents are displayed as markers on an interactive map.
Live Updates: Uses Firestore onSnapshot to update the UI instantly whenever a new incident is reported.

2. 🛠️ Required Installations

To set up this project locally or for assessment, you need:
Node.js (v18+): The runtime for the frontend and backend.
npm/yarn: For managing dependencies.
Firebase Account: To host the database and authentication services.



3. 🚀 Setup Instructions

1. Repository Setup
Bash
git clone https://github.com/BhavikAwari/EmergencyResponseHub.git
cd EmergencyResponseHub

2. Backend Setup (Node.js/Express)
Enter the directory: cd backend.
Install dependencies: npm install.
Configure environment: Create a .env file with PORT=4000.
Main entry point: node src/server.js.

3. Frontend Setup (Next.js)
Enter the directory: cd ../frontend.
Install dependencies: npm install.
Local variables: Create a .env.local and add your Firebase configuration keys.
Launch: npm run dev.

4. 🔐 Environment Variables

Variable Name                        Purpose
NEXT_PUBLIC_FIREBASE_API_KEY         Connects the app to your Firebase project.
NEXT_PUBLIC_FIREBASE_PROJECT_ID	     Directs requests to the correct database.
NEXT_PUBLIC_API_BASE_URL	           The live URL of your Render backend 
                                    (e.g., [https://emergency-responsehub-backend.onrender.com]
                                    (https://emergency-responsehub-backend.onrender.com)).

5. 🌐 Deployment Notes
Frontend: Hosted on Vercel. Ensure Vercel Authentication (Deployment Protection) is Disabled in settings to prevent 401 errors for PWA manifest files.

Backend: Hosted on Render. Ensure the Root Directory is set to backend and the Start Command is node src/server.js.

Interface: The UI is optimized specifically for phone screens and mobile browsers.                                  
