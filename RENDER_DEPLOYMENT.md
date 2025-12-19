# Render Deployment Guide - FeedFlow Inventory Management

This guide provides complete step-by-step instructions for deploying both the backend and frontend of the FeedFlow application to Render.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ A [Render account](https://render.com) (free tier works)
2. ✅ Your code pushed to a GitHub repository
3. ✅ MongoDB Atlas database URL ready
4. ✅ All environment variables prepared

---

## 🗄️ Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Database

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 Sandbox)
3. Create a database user with username and password
4. Whitelist IP: `0.0.0.0/0` (allow access from anywhere)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

---

## 🔧 Part 2: Backend Deployment (Node.js API)

### Step 1: Create Web Service on Render

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository and click **"Connect"**

### Step 2: Configure Backend Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `feedflow-backend` (or your preferred name) |
| **Region** | Choose closest to your users |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |
| **Instance Type** | `Free` |

### Step 3: Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** and add the following:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `MONGO_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/feedflow` |
| `JWT_SECRET` | Random secure string (min 32 chars) | `your-super-secret-jwt-key-min-32-chars-long` |
| `PORT` | `5000` | `5000` |
| `FRONTEND_URL` | Your frontend URL (add after frontend deployment) | `https://feedflow-app.onrender.com` |
| `RENDER_URL` | Your backend URL (will be available after creation) | `https://feedflow-backend.onrender.com` |

> **Note:** You'll need to update `RENDER_URL` after the service is created. Copy the service URL and add it as an environment variable.

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for the deployment to complete (5-10 minutes)
3. Once deployed, copy your backend URL: `https://your-backend-name.onrender.com`
4. Go to **"Environment"** tab and add/update `RENDER_URL` with your backend URL
5. The service will automatically redeploy

### Step 5: Verify Backend Deployment

Test your backend endpoints:

```bash
# Health check
curl https://your-backend-name.onrender.com/health

# Ping endpoint
curl https://your-backend-name.onrender.com/api/ping

# Expected response:
# {"status":"alive","timestamp":"2025-12-19T04:37:38.123Z"}
```

---

## 🎨 Part 3: Frontend Deployment (React + Vite)

### Step 1: Create Static Site on Render

1. In Render Dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository
3. Click **"Connect"**

### Step 2: Configure Frontend Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `feedflow-app` (or your preferred name) |
| **Region** | Same as backend for best performance |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Step 3: Set Frontend Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend URL from Part 2 |

Example: `https://feedflow-backend.onrender.com`

### Step 4: Deploy Frontend

1. Click **"Create Static Site"**
2. Wait for build and deployment (3-5 minutes)
3. Once deployed, copy your frontend URL: `https://your-app-name.onrender.com`

### Step 5: Update Backend CORS

1. Go back to your **backend service** on Render
2. Navigate to **"Environment"** tab
3. Update the `FRONTEND_URL` variable with your frontend URL
4. Save changes (this will trigger a redeploy)

---

## 🔄 Part 4: Configure Keep-Alive (Prevent Free Tier Sleep)

The backend is already configured with automatic keep-alive pinging every 2 minutes.

### Verify Keep-Alive is Working

1. Check backend logs in Render Dashboard
2. You should see messages like:
   ```
   🔄 Starting HTTP keep-alive ping...
   📍 Pinging https://your-backend.onrender.com/api/ping every 2 minutes
   ✅ Initial HTTP ping successful
   ✅ HTTP ping successful: { status: 'alive', timestamp: '...' }
   ```

### Important Notes:

- ✅ Keep-alive only runs in **production** mode
- ✅ Pings every **2 minutes** to prevent 15-minute timeout
- ✅ Automatically starts when server starts
- ✅ Logs all ping attempts for monitoring

---

## 📝 Part 5: Post-Deployment Checklist

### Backend Verification

- [ ] Health endpoint responds: `/health`
- [ ] Ping endpoint responds: `/api/ping`
- [ ] MongoDB connection successful (check logs)
- [ ] Keep-alive pings running (check logs every 2 min)
- [ ] CORS configured with frontend URL

### Frontend Verification

- [ ] Application loads successfully
- [ ] Can access login page
- [ ] API calls work (check browser console)
- [ ] No CORS errors in browser console

### Environment Variables Check

- [ ] Backend `RENDER_URL` set correctly
- [ ] Backend `FRONTEND_URL` matches frontend deployment
- [ ] Frontend `VITE_API_URL` matches backend deployment
- [ ] `MONGO_URI` connection string is correct
- [ ] `JWT_SECRET` is secure and set

---

## 🚀 Quick Reference: Build & Start Commands

### Backend Service (Web Service)

```bash
# Build Command
npm install

# Start Command
node index.js
```

### Frontend Service (Static Site)

```bash
# Build Command
npm install && npm run build

# Publish Directory
dist
```

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** Service keeps sleeping
- **Solution:** Ensure `RENDER_URL` is set correctly and keep-alive logs show pings every 2 minutes

**Problem:** MongoDB connection fails
- **Solution:** Check `MONGO_URI` format and MongoDB Atlas IP whitelist (should be `0.0.0.0/0`)

**Problem:** CORS errors
- **Solution:** Verify `FRONTEND_URL` matches your frontend deployment URL exactly

### Frontend Issues

**Problem:** API calls fail
- **Solution:** Check `VITE_API_URL` is set correctly and matches backend URL

**Problem:** Blank page after deployment
- **Solution:** Check browser console for errors, verify build completed successfully

**Problem:** 404 on page refresh
- **Solution:** Render static sites handle this automatically, but verify routing is client-side

---

## 📊 Monitoring Your Deployment

### Check Backend Logs

1. Go to Render Dashboard → Your Backend Service
2. Click **"Logs"** tab
3. Monitor for:
   - MongoDB connection: `✅ MongoDB connected successfully`
   - Keep-alive pings: `✅ HTTP ping successful`
   - API requests and responses

### Check Frontend Logs

1. Go to Render Dashboard → Your Frontend Static Site
2. Click **"Logs"** tab
3. Monitor build process and deployment status

---

## 🔄 Redeployment

### Automatic Redeployment

Both services automatically redeploy when you push to your GitHub repository's main branch.

### Manual Redeployment

1. Go to service in Render Dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 💰 Cost Considerations

### Free Tier Limits

- **Backend (Web Service):** 
  - 750 hours/month free
  - Spins down after 15 min inactivity (prevented by keep-alive)
  - 50-second spin-up time when inactive

- **Frontend (Static Site):**
  - Completely free
  - 100 GB bandwidth/month
  - Always active (no spin-down)

### Upgrade Options

If you need better performance:
- Upgrade backend to **Starter ($7/month)** for always-on service
- No need to upgrade frontend (static sites are always fast)

---

## 🎯 Final URLs Structure

After deployment, your application will have:

```
Frontend:  https://feedflow-app.onrender.com
Backend:   https://feedflow-backend.onrender.com
API Base:  https://feedflow-backend.onrender.com/api
```

---

## 📞 Support

If you encounter issues:

1. Check Render logs for error messages
2. Verify all environment variables are set correctly
3. Test endpoints individually using curl or Postman
4. Check MongoDB Atlas connection and IP whitelist
5. Review browser console for frontend errors

---

## ✅ Deployment Complete!

Your FeedFlow Inventory Management System is now live on Render! 🎉

The backend will stay active with automatic keep-alive pings every 2 minutes, ensuring your users never experience delays from service spin-up.
