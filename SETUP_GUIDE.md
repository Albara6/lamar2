# Complete Setup Guide

This guide will walk you through setting up the Gas Station Cash Management System from scratch.

## Step 1: Supabase Setup (15 minutes)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose organization or create one
5. Enter project details:
   - **Name**: Gas Station Manager (or your choice)
   - **Database Password**: Generate and save this securely!
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### 1.2 Run Database Schema

1. In Supabase dashboard, click "SQL Editor" in left sidebar
2. Click "New Query"
3. Open `supabase-schema.sql` from this project
4. Copy all contents and paste into SQL Editor
5. Click "Run" button
6. Wait for "Success" message
7. Verify tables created:
   - Go to "Table Editor"
   - You should see: users, safe_drops, withdrawals, expenses, vendors, daily_sales, deposits, manual_safe_counts, shifts, audit_log

### 1.3 Create Storage Bucket

1. Click "Storage" in left sidebar
2. Click "Create Bucket"
3. Name: `receipts`
4. Set to Public: Yes (or configure RLS later)
5. Click "Create bucket"

### 1.4 Get API Keys

1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this SECRET!)

## Step 2: Local Development Setup (10 minutes)

### 2.1 Install Dependencies

\`\`\`bash
cd ReportsAPP
npm install
\`\`\`

If you get errors:
\`\`\`bash
# Try clearing cache first
rm -rf node_modules package-lock.json
npm install
\`\`\`

### 2.2 Configure Environment

1. Create `.env.local` in project root:
\`\`\`bash
touch .env.local
\`\`\`

2. Add your Supabase credentials:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

3. Save the file

### 2.3 Update next.config.js

Open `next.config.js` and update the Supabase domain:
\`\`\`javascript
images: {
  domains: ['your-project.supabase.co'],
},
\`\`\`

### 2.4 Start Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit: http://localhost:3000

You should see the homepage with two options: Safe Panel and Admin Dashboard.

## Step 3: Test the Application (10 minutes)

### 3.1 Test PIN Login

1. Click "Safe Panel"
2. Enter PIN: `1234` (default admin)
3. You should see the home screen with menu options

### 3.2 Test Safe Drop

1. Click "Make Safe Drop"
2. Enter amount: `100.00`
3. Add optional note
4. Click "Record Drop"
5. You should see success screen with receipt number

### 3.3 Test Admin Dashboard

1. Go back to home
2. Click "Admin Dashboard"
3. You should see:
   - Safe balance: $100.00
   - Today's drops: $100.00
   - Recent transaction with your drop

### 3.4 Test Expense Recording

1. Go to Safe Panel → Record Expense
2. Select vendor (or add new one)
3. Enter amount
4. Choose payment type
5. Optionally upload receipt photo
6. Record expense

## Step 4: Production Deployment (20 minutes)

### 4.1 Push to GitHub

\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/gas-station-manager.git
git push -u origin main
\`\`\`

### 4.2 Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: ./
   - Build Command: `npm run build` (auto-filled)
6. Add Environment Variables:
   - Click "Environment Variables"
   - Add all 4 variables from `.env.local`
   - **Important**: Update `NEXT_PUBLIC_APP_URL` to your Vercel URL (will be shown after first deploy)
7. Click "Deploy"
8. Wait 2-3 minutes

**Option B: Via Vercel CLI**
\`\`\`bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add env vars when asked
\`\`\`

### 4.3 Update Environment Variables

After first deployment:
1. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
2. In Vercel dashboard → Settings → Environment Variables
3. Edit `NEXT_PUBLIC_APP_URL` to your Vercel URL
4. Redeploy

### 4.4 Test Production

1. Visit your Vercel URL
2. Test Safe Panel login
3. Test Admin Dashboard
4. Test making a drop
5. Verify everything works

## Step 5: Tablet Setup (Kiosk Mode) (15 minutes)

### 5.1 Choose Tablet

Recommended specs:
- 10" or larger screen
- Android 9+ or iPad
- 2GB+ RAM
- WiFi connectivity

### 5.2 Install Kiosk Browser

**Android:**
- Install "Kiosk Browser Lockdown" or "Fully Kiosk Browser"
- Configure to open your Vercel URL
- Enable auto-start on boot
- Disable back button and home button

**iPad:**
- Use "Guided Access" (built-in)
- Settings → Accessibility → Guided Access
- Enable and set passcode
- Open Safari to your URL
- Triple-click home button to enable

### 5.3 Mount Tablet

1. Purchase tablet wall mount
2. Mount near safe (recommended)
3. Connect to power (use cable management)
4. Connect to WiFi
5. Test touch responsiveness

### 5.4 Configure Auto-Login (Optional)

For ultimate convenience, you can:
1. Set default PIN in URL: `https://yourapp.vercel.app/safe-panel?pin=1234`
2. Use custom authentication (requires modification)

## Step 6: User Management

### 6.1 Add Users

Currently, users must be added via SQL:

\`\`\`sql
-- Add a cashier
INSERT INTO users (name, role, pin_hash) VALUES 
('John Doe', 'cashier', '$2a$10$rB9l3YaJ...');  -- Hash of 1234

-- To generate PIN hash, use online bcrypt tool or Node.js:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('1234', 10));
\`\`\`

### 6.2 Change Default Admin PIN

\`\`\`sql
UPDATE users 
SET pin_hash = '$2a$10$YOUR_NEW_HASH_HERE'
WHERE role = 'admin';
\`\`\`

## Step 7: Backup and Security

### 7.1 Enable Supabase Backups

1. Supabase dashboard → Settings → Database
2. Enable automated backups (included in free tier)
3. Download manual backup:
   - Settings → Database
   - Download backup

### 7.2 Security Checklist

- [ ] Changed default admin PIN
- [ ] Environment variables are secure
- [ ] Service role key is not exposed
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] Tablet is in kiosk mode
- [ ] Row Level Security policies are active
- [ ] Regular database backups enabled

## Troubleshooting

### Build Fails on Vercel
- Check build logs for specific error
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Can't Login with PIN
- Check Supabase users table has data
- Verify bcrypt is working
- Check RLS policies allow select on users table

### Images Won't Upload
- Verify storage bucket exists
- Check bucket is public or has correct RLS
- Ensure environment variables include correct Supabase URL

### Tablet Touch Not Working
- Recalibrate touch screen
- Check browser supports touch events
- Test with different browser

## Need Help?

- Check README.md for detailed documentation
- Review Supabase logs for database errors
- Check Vercel logs for deployment issues
- Open GitHub issue for bugs

---

**Congratulations! Your gas station cash management system is now live! 🎉**

