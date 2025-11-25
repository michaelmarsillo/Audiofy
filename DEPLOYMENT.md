# 🚀 Deployment Guide

Complete guide for deploying Audiofy to production.

## 📋 Overview

- **Frontend**: Vercel (Free tier available)
- **Backend**: Render (Free tier available)
- **Database**: Render PostgreSQL (Free tier available)
- **Socket.IO**: Works with Render (no additional cost)

## ✅ Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] API endpoints tested
- [ ] Socket.IO tested
- [ ] CORS configured
- [ ] Error handling in place

## 🗄️ Step 1: Use Your Existing Database (NeonDB)

Since you already have a PostgreSQL database on NeonDB:

1. **Get Your NeonDB Connection String**
   - Go to your [NeonDB Dashboard](https://console.neon.tech)
   - Navigate to your project
   - Copy your connection string
   - Format: `postgresql://user:password@host.neon.tech/database?sslmode=require`
   - **Save this** - you'll need it for backend environment variables

2. **Test Connection (Optional)**
   - You can test locally by updating your `.env` with the NeonDB URL
   - Run: `node scripts/migrate-leaderboard.js` to ensure it works

## 🔧 Step 2: Deploy Backend (Render)

1. **Create Web Service**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `audiofy` repository

2. **Configure Service**
   - **Name**: `audiofy-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

3. **Environment Variables**
   Add these in Render's Environment tab:
   ```
   DATABASE_URL=<your-neondb-connection-string>
   JWT_SECRET=<generate-a-random-secret-key>
   PORT=10000
   FRONTEND_URL=https://audiofy.vercel.app
   NODE_ENV=production
   ```
   
   **Important**: 
   - Use your **NeonDB connection string** (not Render PostgreSQL)
   - Add your **Vercel frontend URL** to `FRONTEND_URL` (this replaces localhost:3000)

   **Generate JWT_SECRET**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Advanced Settings**
   - **Auto-Deploy**: Yes (deploys on git push)
   - **Health Check Path**: `/api/health` (optional - create this endpoint)

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL: `https://audiofy-backend.onrender.com`

## 🎨 Step 3: Deploy Frontend (Vercel)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the `audiofy` repository

2. **Configure Project**
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

3. **Environment Variables**
   Add these in Vercel's Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://audiofy-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment (2-5 minutes)
   - Your site will be live at: `https://audiofy.vercel.app`

## 🔗 Step 4: Update Frontend Configuration

Update `frontend/next.config.ts` to use your production backend:

```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:5000/api/:path*',
      },
    ];
  },
  // ... rest of config
};
```

Update Socket.IO connection in `frontend/app/play/friends/room/page.tsx`:

```typescript
const socketUrl = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
  : 'http://localhost:5000';

const newSocket = io(socketUrl, {
  // ... socket config
});
```

## 🔒 Step 5: Configure CORS (Backend)

**✅ Already Done!** Your backend is already configured to use `FRONTEND_URL` environment variable.

Just make sure in Render's environment variables you set:
```
FRONTEND_URL=https://audiofy.vercel.app
```

The code automatically allows both localhost (for dev) and your production URL!

## 🔌 Step 6: Socket.IO Configuration

**✅ Already Done!** Socket.IO is already configured to work with production.

The server uses `FRONTEND_URL` environment variable, and the client uses `NEXT_PUBLIC_API_URL`. Just make sure both are set correctly in your deployment platforms!

## 🗄️ Step 7: Run Database Migration

After backend is deployed, run the migration:

**Option 1: Via Render Shell**
1. Go to your Render service
2. Click "Shell" tab
3. Run: `node scripts/migrate-leaderboard.js`

**Option 2: Via Local Connection**
1. Get your database connection string from Render
2. Update your local `.env` with production DATABASE_URL
3. Run: `node scripts/migrate-leaderboard.js`

## ✅ Step 8: Test Everything

1. **Test Frontend**
   - Visit your Vercel URL
   - Test login/signup
   - Test all game modes

2. **Test Backend API**
   - Test: `https://your-backend.onrender.com/api/leaderboard/global`
   - Should return JSON data

3. **Test Socket.IO**
   - Create a multiplayer room
   - Test real-time functionality
   - Check browser console for errors

4. **Test Database**
   - Play a game
   - Check leaderboard updates
   - Verify data in Render PostgreSQL dashboard

## 💰 Cost Breakdown

### Free Tier (Hobby)
- **Vercel**: Free (unlimited deployments, 100GB bandwidth)
- **Render Web Service**: Free (spins down after 15min inactivity)
- **Render PostgreSQL**: Free (90 days, then $7/month or upgrade)

### Paid Tier (Production)
- **Vercel**: Free tier is usually enough
- **Render Web Service**: $7/month (always on)
- **Render PostgreSQL**: $7/month (persistent)

**Total Free**: $0/month (with limitations)
**Total Paid**: ~$14/month (always-on production)

## ⚠️ Important Notes

### Render Free Tier Limitations
- **Spins down after 15 minutes** of inactivity
- **First request after spin-down takes ~30 seconds** (cold start)
- **Socket.IO connections** may drop when spinning down
- **Solution**: Upgrade to paid tier for always-on service

### Socket.IO on Render
- Works perfectly on Render
- Use WebSocket transport for best performance
- Falls back to polling if WebSocket fails
- Reconnection is handled automatically

### Database Connection (NeonDB)
- NeonDB works seamlessly with Render
- Use your NeonDB connection string in `DATABASE_URL`
- Connection pooling is handled automatically
- No additional configuration needed
- Works exactly like local PostgreSQL

## 🔧 Troubleshooting

### Backend Not Starting
- Check environment variables are set correctly
- Check build logs in Render
- Verify `node server.js` works locally

### Frontend Can't Connect to Backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration
- Verify backend is deployed and running

### Socket.IO Not Working
- Check WebSocket URL (should use `wss://` for HTTPS)
- Verify CORS allows your frontend domain
- Check browser console for connection errors
- Try polling transport as fallback

### Database Connection Errors
- Verify `DATABASE_URL` is your NeonDB connection string
- Check NeonDB dashboard to ensure database is active
- Run migration script if tables don't exist
- Ensure connection string includes `?sslmode=require` for NeonDB

### Games Not Saving
- Check backend logs for errors
- Verify database connection
- Check environment variables
- Run migration script

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Socket.IO Deployment Guide](https://socket.io/docs/v4/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🎉 You're Live!

Once deployed, your Audiofy app will be:
- **Frontend**: `https://audiofy.vercel.app` (Vercel)
- **Backend**: `https://audiofy-backend.onrender.com` (Render)
- **Database**: Your existing NeonDB database

Share your game with the world! 🚀

