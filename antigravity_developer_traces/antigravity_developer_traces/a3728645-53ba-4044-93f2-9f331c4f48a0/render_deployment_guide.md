# 🚀 Step-by-Step Beginner Guide: Deploying KaamConnect to Render

Render is an extremely popular, free, and highly reliable cloud hosting platform that integrates directly with GitHub. Since your repository is structured with subfolders (`backend/` and `mobile/`), this guide walks you through the exact settings needed.

---

## 📅 Pre-deployment Checklist
1. **GitHub Repository:** Make sure all your recent code changes are pushed to GitHub (we already pushed the private key normalizer commit `54512bd` to your main branch).
2. **Firebase JSON:** Keep your Firebase Service Account JSON string handy (the exact single-line JSON string we set up earlier).

---

## 🛠️ Step 1: Create a Render Account & Connect GitHub
1. Go to [Render.com](https://render.com) and click **Sign Up**.
2. Select **Sign up with GitHub** (this connects your repositories automatically).
3. Once logged in, you will be taken to the Render Dashboard.

---

## 📦 Step 2: Create a New Web Service
1. On your Render dashboard, click the purple **New +** button in the top right.
2. Select **Web Service**.
3. Under **Connect a repository**, search for your repository name: 
   👉 `KaamConnect-AI-a-service-app-`
4. Click **Connect** next to it.

---

## ⚙️ Step 3: Configure Build Settings
Fill in the form exactly as follows:

| Field | Value | Rationale |
| :--- | :--- | :--- |
| **Name** | `kaamconnect-backend` | The name of your service (used in your URL). |
| **Region** | *Choose closest to you* (e.g. `Singapore` or `Oregon`) | Minimizes network latency. |
| **Branch** | `main` | The branch Render will deploy from. |
| **Root Directory** | `backend` | **CRITICAL:** Tells Render your server code is inside the `backend` folder. |
| **Runtime** | `Node` | The language of the server. |
| **Build Command** | `npm install` | Installs your backend dependencies. |
| **Start Command** | `node src/server.js` | Starts your express server. |
| **Instance Type** | **Free** | Choose the Free plan tier ($0/month). |

---

## 🔑 Step 4: Configure Environment Variables
Scroll down to the **Advanced** section or look for the **Environment Variables** panel, then click **Add Environment Variable** to add each of the following:

| Key | Value | Notes |
| :--- | :--- | :--- |
| **NODE_ENV** | `production` | Tells libraries to run in production mode. |
| **FIREBASE_SERVICE_ACCOUNT_JSON** | *[Paste your entire service account JSON string here]* | Make sure there are no trailing newlines in the box. |
| **GROQ_API_KEY** | `gsk_Lh7c...` | Your Groq LLM API Key. |
| **FIREBASE_PROJECT_ID** | `kaamconnect-496410` | Your Firebase Project ID. |
| **GOOGLE_CLOUD_PROJECT_ID** | `kaamconnect-496410` | For Google Cloud APIs. |
| **VERTEX_AI_LOCATION** | `us-central1` | Location for Vertex AI calls. |
| **GOOGLE_MAPS_API_KEY** | *[Your Google Maps Key]* | Optional backend map references. |

Click **Create Web Service** at the bottom of the page!

---

## ⏳ Step 5: Wait for Build to Finish
1. Render will open a live terminal showing your build progress.
2. It will download Node, install dependencies (`npm install`), and start the server (`node src/server.js`).
3. When it is successful, the log will show:
   * `[Credentials] Successfully generated runtime service-account-temp.json`
   * `[Firebase] Initialized successfully`
   * `Database: Firestore ✅`
   * **`Your service is live!`**

---

## 📱 Step 6: Link Your Mobile App to the New Render URL
1. At the top left of your Render dashboard page, you will see your public service URL (e.g., `https://kaamconnect-backend.onrender.com`). **Copy this URL**.
2. Open your local file: [api.js](file:///d:/AI%20Service%20Orchestrator%20for%20Informal%20Economy/mobile/src/config/api.js).
3. Change the `DEFAULT_URL` value to your new Render URL:
   ```javascript
   const DEFAULT_URL = 'https://kaamconnect-backend.onrender.com';
   ```
4. Save the file! That's it! Your mobile app is now directly connected to your production backend on Render! 🎉
