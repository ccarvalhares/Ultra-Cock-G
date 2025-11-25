# Deploying Ultra Cock G to Render

## Prerequisites
- A [Render](https://render.com) account.
- This repository pushed to GitHub.

## Step-by-Step Guide

1.  **Create a New Web Service**
    - Log in to your Render dashboard.
    - Click **New +** and select **Web Service**.
    - Connect your GitHub account if you haven't already.
    - Select the `ultra-cock-g` repository.

2.  **Configure the Service**
    - **Name**: `ultra-cock-g` (or any name you like).
    - **Region**: Choose the one closest to you.
    - **Branch**: `main`.
    - **Root Directory**: Leave blank (defaults to root).
    - **Runtime**: `Node`.
    - **Build Command**: `npm run build`
        - *Note: This script installs backend deps, then goes to `client` folder, installs frontend deps, and builds the React app.*
    - **Start Command**: `npm start`
        - *Note: This starts the Node.js server which serves the API and the built frontend files.*

3.  **Environment Variables**
    - Scroll down to the **Environment Variables** section.
    - Add the following keys and values (copy from your local `.env`):
        - `MONGO_URI`: Your MongoDB Atlas connection string.
        - `DISCORD_CLIENT_ID`: Your Discord Application Client ID.
        - `DISCORD_CLIENT_SECRET`: Your Discord Application Client Secret.
        - `DISCORD_CALLBACK_URL`: `https://<YOUR-RENDER-APP-NAME>.onrender.com/auth/discord/callback`
        - `SESSION_SECRET`: A long random string.
        - `NODE_ENV`: `production`

4.  **Deploy**
    - Click **Create Web Service**.
    - Render will start building your app. Watch the logs for any errors.
    - Once finished, your app will be live at `https://<YOUR-RENDER-APP-NAME>.onrender.com`.

## Important Notes
- **MongoDB**: You cannot use `localhost` for MongoDB on Render. You **MUST** use a cloud database like **MongoDB Atlas**.
- **Discord Redirect URI**: Don't forget to go to the [Discord Developer Portal](https://discord.com/developers/applications), select your app, go to **OAuth2**, and add the new Render URL (`https://<YOUR-RENDER-APP-NAME>.onrender.com/auth/discord/callback`) to the **Redirects** list.
