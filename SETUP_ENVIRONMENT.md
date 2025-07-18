# Environment Setup Guide

To fix the checkout issues in your Crazy Chicken app, you need to create a `.env.local` file in the `crazy-chicken-app` directory with the following environment variables:

## Required Environment Variables

Create a file called `.env.local` in your `crazy-chicken-app` folder and add these variables:

```bash
# Database Configuration (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Payment Processing (Stripe) - REQUIRED FOR ONLINE PAYMENTS
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# SMS Verification (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1your_twilio_phone_number

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key

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