# 🏆 Blueprint: Building a Fully Legit, Production-Grade Android APK

To build a "fully legit" APK that works flawlessly on any device, signs correctly without security warnings, and looks polished for the hackathon judges, you must follow these pre-flight checks, backend deployment steps, and compilation instructions.

---

## 🚦 Phase 1: Pre-Flight Legitimacy Checklist

Before compiling your APK, you must check these three critical assets to ensure the application is professional and functional:

### 1. Verification of App Permissions & Configuration (`app.json`)
We have pre-configured `mobile/app.json` for you. Verify that it contains:
* **Branded Icon**: `"icon": "./assets/icon.png"` (Verified ✅)
* **Branded Splash**: `"image": "./assets/splash-icon.png"`, matching background `"backgroundColor": "#F6F8F4"` (Verified ✅)
* **Legit Package ID**: `"package": "com.kaamconnect.app"` (Verified ✅)
* **Android Location Permissions**: `"ACCESS_FINE_LOCATION"` and `"ACCESS_COARSE_LOCATION"` are correctly configured (Verified ✅)

### 2. Live API URL Check (`mobile/src/config/api.js`)
Currently, `BASE_URL` points to a local IP:
```javascript
const DEFAULT_URL = 'http://192.168.1.40:3000';
```
> [!WARNING]
> If you compile the APK pointing to `192.168.1.40`, **the app will not work on the judges' physical phones** because their phones cannot access your personal computer's local IP address. You **must** make the backend live and update this file before building.

---

## 🌐 Phase 2: Making Your Backend Live (Pick ONE Method)

To connect your APK to your backend, your Node.js server needs a public, secure `HTTPS` URL. Here are the three best methods:

### 🛡️ Method A: Deploy to Render (Recommended for Submission)
Render is a free, reliable cloud hosting service that automatically provides a secure HTTPS URL.

1. **Push your code to GitHub**: Make sure your whole project is committed to your repository.
2. **Log In to Render**: Go to [Render.com](https://render.com) and log in with your GitHub account.
3. **Create a Web Service**:
   * Click **New +** > **Web Service**.
   * Connect your `KaamConnect-AI` repository.
4. **Configure Build Settings**:
   * **Root Directory**: `backend` (Since your project is a monorepo).
   * **Runtime**: `Node`.
   * **Build Command**: `npm install`
   * **Start Command**: `node src/server.js`
   * **Instance Type**: `Free`.
5. **Add Environment Variables**:
   Click **Advanced** > **Add Environment Variable** and copy your keys:
   * `PORT` = `3000`
   * `GROQ_API_KEY` = `your_gsk_key_here`
   * `FIREBASE_PROJECT_ID` = `your_project_id`
   * `FIREBASE_CLIENT_EMAIL` = `your_firebase_client_email`
   * `FIREBASE_PRIVATE_KEY` = `your_firebase_private_key` (Replace `\n` characters with literal newlines if needed).
6. **Deploy**: Click **Deploy Web Service**. Render will build the server and provide you with a URL like `https://kaamconnect.onrender.com`.

---

### ⚡ Method B: Deploy to Railway (Faster & Instant)
Railway is extremely fast and has an instant setup cycle.

1. Install Railway CLI on your computer:
   ```powershell
   npm i -g @railway/cli
   ```
2. Navigate to your `/backend` folder:
   ```powershell
   cd backend
   railway login
   railway init
   ```
3. Deploy the project:
   ```powershell
   railway up
   ```
4. In the Railway web dashboard, go to your project **Settings** > click **Generate Domain** under the networking section. It will give you a public `https://...` URL. Add your environment variables (`GROQ_API_KEY`, etc.) in the dashboard variables tab.

---

### 🚀 Method C: Ngrok (The 1-Minute Hackathon Demo Cheatcode)
If you want to run the server on your computer but want to map it to a public URL instantly without deploying to the cloud:

1. **Install Ngrok**: Download it from [ngrok.com](https://ngrok.com) or install it via npm:
   ```powershell
   npm install -g ngrok
   ```
2. **Start your local backend server**:
   ```powershell
   npm run start
   ```
3. **Tunnel the port in another terminal**:
   ```powershell
   ngrok http 3000
   ```
4. **Get the URL**: Ngrok will generate a secure forwarding URL like:
   `https://a1b2-cd34.ngrok-free.app`
   *(Keep this terminal open! If you close it, the tunnel will stop working. Excellent for rapid live-testing and live-presenting to judges.)*

---

## 🔗 Phase 3: Link Your Mobile App to the Live URL

Once you have your live HTTPS URL from Method A, B, or C:

1. Open `mobile/src/config/api.js`.
2. Locate line 5:
   ```javascript
   const DEFAULT_URL = 'https://YOUR-LIVE-BACKEND-URL.com';
   ```
   *Replace `YOUR-LIVE-BACKEND-URL.com` with your Render, Railway, or Ngrok URL.*
3. Save the file.

---

## 🛠️ Phase 4: Compiling the Signed APK (Step-by-Step)

The official way to compile Expo React Native apps is via **EAS Build**. It signs the app with a secure production-grade cryptographic keystore.

### Step 1: Install EAS Globally
Open your terminal and run:
```powershell
npm install -g eas-cli
```

### Step 2: Log In & Configure
Navigate into your `/mobile` directory in your terminal:
```powershell
cd mobile
eas login
eas build:configure
```
*When prompted, select **Android**.*

### Step 3: Configure `eas.json` for Direct APK Output
Open `mobile/eas.json`. Ensure the `"preview"` profile specifies `"apk"` as the build target so that it produces a direct `.apk` file instead of an `.aab` file:
```json
{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### Step 4: Run the Build Command
Start the cloud compilation process:
```powershell
eas build --platform android --profile preview
```

### Step 5: Keystore Sign Off
* EAS will ask: **"Generate a new Android Keystore?"**
* **Select YES.** 
* Expo will generate a unique cryptographic signature file (Keystore) for your project. This signature proves to the Android OS that your app is authentic and safe to install.

### Step 6: Get the Shareable URL
1. Expo will queue, build, and compile the code on their cloud servers (takes 5-10 minutes).
2. Once complete, it will print a direct **shareable install link** in your terminal.
3. Submit this link or the downloaded APK file directly to the hackathon judges!
