# Backend Deployment Guide

This guide shows how to deploy the SoLBot backend to Render.com and update the Vercel environment variables.

## Deploy to Render.com

1. Sign up for a free account on [Render.com](https://render.com/)

2. Click "New +" and select "Web Service"

3. Connect your GitHub repository or deploy from a public Git URL

4. Configure the service:
   - **Name**: solbot-backend (or your preferred name)
   - **Runtime**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

5. Add the following environment variables:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `CLAUDE_MODEL`: claude-3-5-sonnet-20241022
   - `USE_MEMORY_DB`: true

6. Click "Create Web Service"

7. Wait for the deployment to complete - it might take a few minutes

8. Once deployed, you'll get a URL like `https://solbot-backend.onrender.com`

## Update Vercel Environment Variables

1. Go to your project in the [Vercel Dashboard](https://vercel.com/dashboard)

2. Click on your SoLBot project

3. Navigate to "Settings" → "Environment Variables"

4. Add or update the following environment variables:
   - `BACKEND_URL`: The URL of your Render deployment (e.g., `https://solbot-backend.onrender.com`)
   - `DATABASE_ENABLED`: false (Keep database disabled for now)

5. Click "Save"

6. Redeploy your frontend by going to "Deployments" and clicking "Redeploy" on your latest deployment

## Testing the Connection

1. Visit your Vercel app URL

2. Try the chat functionality - it should now connect to your backend 

3. Check the backend logs on Render.com if you encounter any issues

## Troubleshooting

- **CORS issues**: Make sure your backend CORS configuration allows requests from your Vercel domain
- **Connection timeout**: Check if your Render instance is running (free tier instances sleep after inactivity)
- **API key errors**: Verify your Anthropic API key is set correctly on Render 