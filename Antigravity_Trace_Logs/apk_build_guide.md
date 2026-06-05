# 📱 KaamConnect: Step-by-Step Android APK Compilation Guide

This guide outlines the step-by-step process for packaging the **KaamConnect** mobile app into a fully functional, standalone, signed Android **APK** file. 

For the Google Hackathon, we highly recommend using **EAS Build (Expo Application Services)**. It executes builds in a secure Expo cloud environment, automatically manages signing keystores, and outputs a **public, shareable URL** where judges can instantly download the APK directly onto their Android devices.

---

## 🛠️ Method 1: EAS Cloud Build (Highly Recommended for Hackathons)

This method does not require you to have Android Studio, Java JDK, or a powerful machine configured locally. It compiles the APK on Expo's servers and gives you a direct link.

### Step 1: Install the EAS CLI
Open your terminal (PowerShell or Command Prompt) and install the Expo Application Services command-line interface globally:
```bash
npm install -g eas-cli
```

### Step 2: Log In to Your Expo Account
If you don't have an Expo account, create one at [expo.dev](https://expo.dev). Once registered, log in from your terminal:
```bash
eas login
```
*Enter your Expo credentials when prompted.*

### Step 3: Initialize EAS in Your Mobile Directory
Ensure your terminal is located inside the `/mobile` directory of your project, then initialize the build configuration:
```bash
eas build:configure
```
*When prompted, select **Android** (or all).* This will automatically generate a file named `eas.json` in your mobile directory.

### Step 4: Configure `eas.json` to Output an APK
By default, EAS Build produces an `.aab` (Android App Bundle) which is meant for the Google Play Store. To configure it to produce an installable **`.apk`** file, open `eas.json` in your editor and ensure your `"preview"` configuration specifies `"apk"` as the build type.

Modify your `eas.json` to look exactly like this:
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
  },
  "submit": {
    "production": {}
  }
}
```

### Step 5: Start the Build Command
To compile the standalone signed APK, run the following command in your terminal:
```bash
eas build --platform android --profile preview
```

### Step 6: Follow the Interactive Prompts
EAS will ask you a couple of questions:
1. **"Generate a new Android Keystore?"**: Select **`Yes`**. Expo will automatically generate a secure digital signature key (keystore) to sign your APK so that it installs cleanly on Android devices.
2. **"Review and upload credentials?"**: Select **`Yes`**.

### Step 7: Wait and Share the Download Link!
* EAS will queue your build and compile it in the cloud. You can close your terminal; the build progress can be tracked in your [expo.dev](https://expo.dev) dashboard.
* The build usually takes 5 to 10 minutes.
* Once completed, the terminal (and the Expo web dashboard) will output a **shortened download URL** (e.g., `https://expo.dev/artifacts/eas/...apk`).
* **This is the link you submit to the hackathon judges!** They can open it on their Android phone and tap install instantly.

---

## 💻 Method 2: Local Build (Alternative)

If you prefer to build locally on your own machine without EAS Cloud, you will need **Android Studio, Java JDK 17, and Android SDK** installed.

### Step 1: Prebuild the Android project
This generates the native `/android` folder from your Expo code:
```bash
npx expo prebuild
```

### Step 2: Navigate to the native Android directory
```bash
cd android
```

### Step 3: Build the APK using Gradle
* **On Windows (PowerShell):**
  ```powershell
  ./gradlew assembleRelease
  ```
* **On macOS/Linux:**
  ```bash
  ./gradlew assembleRelease
  ```

### Step 4: Retrieve Your APK
Once finished, the compiled APK will be located at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`
You can upload this file to Google Drive, Dropbox, or GitHub Releases to create a shareable link for the judges.

---

## 💡 Hackathon Submission Tip
Include the following section in your Hackathon **README** to make testing seamless for judges:

> ### 📲 Android Installation Instructions
> 1. Download the APK file from [Your Shareable EAS Link].
> 2. Open the downloaded file on your Android device.
> 3. If prompted by **Play Protect**, tap **"Install Anyway"** (this warning appears for all standalone apps built outside the Google Play Store).
> 4. Ensure you are connected to the internet, and launch **KaamConnect**!
