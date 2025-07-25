# Environment Setup Guide

To fix the checkout issues in your Crazy Chicken app, you need to create a `.env.local` file in the `crazy-chicken-app` directory with the following environment variables:

## Required Environment Variables

Create a file called `.env.local` in your `crazy-chicken-app` folder and add these variables:

```bash
# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://fadltrjanuegsipsbdrm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkeWJ2ZHludGx5cGJtcHVlZHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE5NzYsImV4cCI6MjA2ODI4Nzk3Nn0.FGVfrIgaF2qvX7ONKcqUIcVtw6qJvxdVrWHNsSwkFAwyour_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkeWJ2ZHludGx5cGJtcHVlZHNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTk3NiwiZXhwIjoyMDY4Mjg3OTc2fQ._ltwWW0JVhrUdm3lAFOJveeNEf6vL58wHHya_M9Tii0

# Payment Processing (Stripe) - REQUIRED FOR ONLINE PAYMENTS
STRIPE_SECRET_KEY=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_test_your_stripe_secret_keypk_live_51OJH7wIm0C628dZzVq0Gu0Id29BKQvoo3rWwbkLFdDJLOepGtSlzh8ZOEJXPINzYnmsEO3dEbqhXqw5SRxRh3vbP00qxxPzswX
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51OJH7wIm0C628dZzVq0Gu0Id29BKQvoo3rWwbkLFdDJLOepGtSlzh8ZOEJXPINzYnmsEO3dEbqhXqw5SRxRh3vbP00qxxPzswX

# SMS Verification (Twilio)
TWILIO_ACCOUNT_SID=AC7fd874461935985e61e0187b4ae765c9
TWILIO_AUTH_TOKEN=ae54e39d7119fcbf8168830bd1c8d128
TWILIO_PHONE_NUMBER=+18704941363

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
# (Optional) Custom "from" address if your domain has been verified in Resend.
# If not provided or if the domain is not verified, the system will
# automatically fall back to `onboarding@resend.dev` so confirmations still send.
RESEND_FROM_EMAIL=orders@your-verified-domain.com

# Application Configuration - REQUIRED FOR REDIRECTS
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin Configuration
ADMIN_PASSCODE=5548247
```

## How to Get These Keys

### 1. Stripe (for online payments)
- Go to https://dashboard.stripe.com/
- Create an account or sign in
- Go to Developers > API keys
- Copy your "Publishable key" and "Secret key" (use test keys for development)

### 2. Supabase (for database)
- Go to https://supabase.com/
- Create a new project or use existing
- Go to Settings > API
- Copy your URL and anon key
- Copy service role key from the same page

### 3. Twilio (for SMS verification)
- Go to https://www.twilio.com/
- Create account and get phone number
- Find Account SID and Auth Token in console

### 4. Resend (for emails)
- Go to https://resend.com/
- Create account and get API key

## After Setting Up Environment

1. Restart your development server: `npm run dev`
2. Test the checkout process
3. Online payments should now redirect to Stripe
4. Cash payments should complete and redirect to success page
5. Orders should appear in the admin panel

## Troubleshooting

- If online payment doesn't work: Check Stripe keys
- If redirects fail: Check NEXT_PUBLIC_APP_URL
- If orders don't save: Check Supabase configuration
- If SMS doesn't work: Check Twilio configuration
- If emails don't send: Check Resend API key

## Changes Made

✅ Fixed order summary display in checkout
✅ Improved payment flow for both cash and card
✅ Fixed admin orders to show real data from database
✅ Added proper error handling
✅ Enhanced UI for better user experience

Once you add the environment variables, all checkout issues should be resolved! 