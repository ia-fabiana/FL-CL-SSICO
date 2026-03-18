<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/51fd45bc-3d89-4f6c-b60c-4c8e5bc5ebba

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Safe Deploy

This repository is locked to the Firebase project `fl-classico`.

- `npm run deploy` is intentionally blocked.
- `npm run deploy:fl-classico` is the only approved hosting deploy command for this app.
- The deploy guard validates `.firebaserc`, `.env`, `metadata.json`, and `index.html` before publishing.
