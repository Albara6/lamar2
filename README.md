# Gas Station Cash Management System

A comprehensive full-stack web application for managing gas station sales, cash flow, and reconciliation. Built with Next.js, Supabase, and TailwindCSS.

## 🌟 Features

### Safe Panel Interface (Touchscreen Tablet)
- **PIN Authentication** - Secure 4-digit PIN login for cashiers and managers
- **Safe Drops** - Record cash drops with automatic receipt generation
- **Expense Tracking** - Log expenses with vendor management and photo receipt upload
- **Daily Sales Entry** - Record card sales with auto-calculated cash sales
- **Manager Withdrawals** - Secure withdrawal process with reason tracking
- **End of Shift Reconciliation** - Drawer counting with variance reporting
- **Manual Safe Count** - Physical verification against expected balance

### Admin Dashboard (Web Interface)
- **Real-time Analytics** - Live safe balance, today's drops, expenses, withdrawals
- **Safe History** - Complete log of all drops and withdrawals with filters and export
- **Expense Management** - Track expenses by vendor, date, and payment type
- **Sales Reports** - Daily, weekly, and monthly sales summaries
- **Bank Deposits** - Log deposits by source (DoorDash, Clover, Cash, etc.)
- **Bank Reconciliation** - Compare expected vs actual deposits with variance analysis
- **Shift Reports** - Track cashier performance and drawer accuracy
- **Audit Log** - Immutable record of all system changes (admin-only)

## 🔧 Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- **Styling**: TailwindCSS with custom orange theme
- **Authentication**: PIN-based with bcrypt hashing
- **Security**: Row Level Security (RLS) policies for role-based access
- **Exports**: CSV and PDF report generation

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Vercel account for deployment (optional)

## 🚀 Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd ReportsAPP
npm install
\`\`\`

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Go to SQL Editor and run the `supabase-schema.sql` file to create tables
4. Go to Settings → API to get your project URL and keys

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Create Storage Bucket for Receipts

1. In Supabase dashboard, go to Storage
2. Create a new bucket called `receipts`
3. Set it to public (or configure RLS policies)

### 5. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000`

## 🔐 Default Admin Account

After running the SQL schema, a default admin user is created:

- **PIN**: `1234`
- **Role**: Admin
- **⚠️ IMPORTANT**: Change this PIN immediately after first login

## 📊 Database Schema

### Core Tables

- **users** - Cashiers, managers, and admins with PIN authentication
- **safe_drops** - All cash drops to safe with receipt numbers
- **withdrawals** - Manager withdrawals with reasons and approvals
- **expenses** - Business expenses with vendor tracking and receipt uploads
- **vendors** - Vendors and deposit sources
- **daily_sales** - Daily card and cash sales with auto-calculated totals
- **deposits** - Bank deposits by source
- **manual_safe_counts** - Physical safe verifications
- **shifts** - Cashier shift records with reconciliation
- **audit_log** - Immutable log of all system changes

### Key Features

- **Automatic Triggers** - Audit logging, timestamp updates
- **Computed Columns** - Auto-calculated totals and variances
- **Row Level Security** - Role-based access control
- **Indexes** - Optimized for fast queries

## 🧮 Key Calculations

### Safe Balance
\`\`\`
Safe Balance = (All Drops) - (All Withdrawals)
\`\`\`

### Cash Sales
\`\`\`
Cash Sales = (Total Safe Drops for Day) + (Cash Expenses)
\`\`\`

### Shift Variance
\`\`\`
Variance = (Actual Ending Drawer) - (Starting Drawer - Drops)
\`\`\`

### Bank Variance
\`\`\`
Expected Deposits = (Card Sales) + (Check Expenses)
Variance = (Actual Deposits) - (Expected Deposits)
\`\`\`

## 🎨 UI/UX Design

- **Touch-Friendly** - Large buttons optimized for touchscreen tablets
- **Orange Theme** - Modern color scheme inspired by Popeye's/McDonald's
- **Kiosk Mode Ready** - Can run in full-screen kiosk mode on tablets
- **Responsive** - Works on tablets, desktops, and mobile devices
- **Clear Visual Feedback** - Color-coded transactions and variance indicators

## 📱 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard
4. Deploy!

\`\`\`bash
# Or use Vercel CLI
npm i -g vercel
vercel
\`\`\`

### Update Supabase URL

After deployment, update `NEXT_PUBLIC_APP_URL` in Vercel environment variables to your production URL.

## 🔒 Security Best Practices

1. **Change Default PIN** - Update the admin PIN immediately
2. **Use Strong PINs** - Require 4-digit PINs minimum
3. **Enable RLS** - All Row Level Security policies are included in schema
4. **Rotate Keys** - Regularly rotate Supabase service role keys
5. **HTTPS Only** - Always use HTTPS in production
6. **Tablet Security** - Lock down tablets in kiosk mode, disable browser navigation

## 📈 Future Enhancements

- [ ] Automated daily email/SMS reports (3 AM summary)
- [ ] Offline mode with local caching and sync
- [ ] Advanced analytics and charts (using Recharts)
- [ ] User management interface
- [ ] Shift scheduling
- [ ] Inventory tracking integration
- [ ] Mobile app (React Native)
- [ ] Multi-location support
- [ ] Integration with POS systems

## 🐛 Troubleshooting

### Issue: Can't connect to Supabase
- Verify environment variables are correct
- Check Supabase project status
- Ensure API keys are not expired

### Issue: PIN login fails
- Verify users table has data
- Check bcrypt is properly installed
- Ensure RLS policies are configured

### Issue: Receipt upload fails
- Verify storage bucket exists and is configured
- Check bucket permissions (public or RLS)
- Ensure file size is within limits

### Issue: Audit log not recording
- Verify audit triggers are created
- Check that `app.current_user_id` is set
- Review trigger function logs

## 📚 API Structure

All database operations use Supabase client:

\`\`\`typescript
import { supabase } from '@/lib/supabase'

// Example: Record a drop
const { data, error } = await supabase
  .from('safe_drops')
  .insert({
    user_id: userId,
    amount: 100.00,
    receipt_number: 'DROP-123456',
  })
\`\`\`

## 🤝 Support

For issues or questions, please open an issue on GitHub or contact support.

## 📄 License

MIT License - feel free to use this for your business!

---

**Built with ❤️ for gas station owners who want better cash management**

