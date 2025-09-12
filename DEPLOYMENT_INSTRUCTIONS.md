# TGate Frontend - GitHub Pages Deployment Instructions

## 🚀 Deployment Status

Your TGate frontend application has been successfully deployed to GitHub Pages!

**Repository:** https://github.com/VibeGrind/tgate-frontend  
**Live URL:** https://vibegrind.github.io/tgate-frontend/

## ⚠️ Important: Backend Configuration Required

The frontend is deployed, but you need to configure your backend to make it work properly:

### 1. Make Your Backend Publicly Accessible

Since GitHub Pages uses HTTPS, your backend must also use HTTPS/WSS. Use one of these options:

#### Option A: Cloudflare Tunnel (Recommended)
```bash
# Install Cloudflare tunnel
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Create tunnel (follow the authentication steps)
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create tgate-backend

# Run tunnel pointing to your FastAPI server
cloudflared tunnel run --url http://localhost:8000 tgate-backend
```

#### Option B: ngrok (Quick setup)
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Create account and get auth token from https://ngrok.com
ngrok config add-authtoken YOUR_AUTHTOKEN

# Start tunnel
ngrok http 8000
```

### 2. Update Environment Variables

Once you have your public HTTPS URL, update the GitHub repository variables:

```bash
# Replace YOUR_DOMAIN with your actual domain
gh variable set VITE_API_URL --body "https://YOUR_DOMAIN.com" --repo VibeGrind/tgate-frontend
gh variable set VITE_WS_URL --body "wss://YOUR_DOMAIN.com" --repo VibeGrind/tgate-frontend
```

### 3. Configure Backend CORS

Add your GitHub Pages domain to your FastAPI CORS settings:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vibegrind.github.io",  # Add this line
        "http://localhost:5173",
        # ... other origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Test the Deployment

1. Push any backend changes to trigger a new GitHub Pages build
2. Visit https://vibegrind.github.io/tgate-frontend/
3. Check that the "Live" indicator shows green (WebSocket connected)
4. Verify that tables load properly

## 📋 Current Configuration

- **Base URL:** `/tgate-frontend/` (configured for GitHub Pages)
- **Environment Variables:** 
  - `VITE_API_URL`: Currently set to "https://your-backend-domain.com" (needs updating)
  - `VITE_WS_URL`: Currently set to "wss://your-backend-domain.com" (needs updating)

## 🔄 Automatic Deployment

The site will automatically redeploy when you push to the `master` branch. The GitHub Actions workflow:

1. Installs dependencies
2. Builds the React app with your environment variables
3. Deploys to GitHub Pages

## 🛠 Manual Deployment Trigger

You can manually trigger a deployment from the GitHub Actions tab in your repository.

## 📝 Next Steps

1. Set up your backend tunnel (Cloudflare/ngrok)
2. Update the environment variables with your real domain
3. Configure CORS on your backend
4. Test the live application

Your frontend is ready to go! Just need to connect it to your public backend.