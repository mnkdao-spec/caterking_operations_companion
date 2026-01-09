# Supabase Setup Guide

This guide explains how to configure Supabase for the CaterKing Operations Companion app.

## Overview

The app is designed to work in **two modes**:

1. **Mock Data Mode** (default): Uses local mock data for demonstration and development
2. **Supabase Mode**: Connects to a real Supabase backend for production use with real-time sync

## Current Status

The app is currently running in **Mock Data Mode** because Supabase credentials are not configured. This is intentional and allows you to explore the app's features without setting up a backend.

## When to Set Up Supabase

You should set up Supabase when you need:

- **Real-time synchronization** across multiple tablets
- **Persistent data** that survives app restarts
- **Multi-user collaboration** with live updates
- **Cloud backup** of your events, inventory, and orders
- **Production deployment** for actual catering operations

## Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Click "New Project"
3. Choose an organization (or create one)
4. Set a project name (e.g., "CaterKing")
5. Set a strong database password (save this!)
6. Choose a region close to your location
7. Click "Create new project"

### Step 2: Run Database Migrations

Once your project is created:

1. Go to the **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_kds_schema.sql`
3. Paste into the SQL Editor and click "Run"
4. Copy the contents of `supabase/migrations/002_inventory_schema.sql`
5. Paste into the SQL Editor and click "Run"

This will create all the necessary tables for the KDS and inventory system.

### Step 3: Enable Realtime

1. Go to **Database** → **Replication** in your Supabase dashboard
2. Enable Realtime for these tables:
   - `events`
   - `fired_courses`
   - `order_items`
   - `stock_levels`
   - `low_stock_alerts`

### Step 4: Get Your API Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon/public key** (a long string starting with `eyJ...`)

### Step 5: Configure the App

You have two options:

#### Option A: Using Environment Variables (Recommended)

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-anon-key-here
```

#### Option B: Using Manus Secrets (For Deployment)

If you're deploying via Manus:

1. Click the **Settings** icon in the Management UI
2. Go to **Secrets**
3. Add two secrets:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_KEY`: Your Supabase anon key

### Step 6: Restart the App

After adding credentials:

1. Stop the development server
2. Restart with `pnpm dev`
3. You should see: `[Supabase] ✓ Configured with real credentials` in the console

## Verifying the Setup

Once configured, the app will:

1. Connect to your Supabase database
2. Subscribe to real-time updates
3. Persist all data to the cloud
4. Sync changes across all connected devices

You can verify this by:

1. Opening the app on two devices
2. Firing a course on one device
3. Seeing it appear instantly on the other device

## Seeding Initial Data

To populate your database with sample data:

1. Go to the **SQL Editor** in Supabase
2. Run the following queries:

```sql
-- Create a sample event
INSERT INTO events (name, client, guest_count, venue, start_time, status)
VALUES ('Wedding Reception', 'Smith Family', 150, 'Grand Ballroom', NOW() + INTERVAL '2 hours', 'active');

-- Create sample courses
INSERT INTO courses (event_id, course_number, name, description)
SELECT id, 1, 'Appetizers', 'Assorted appetizers' FROM events WHERE name = 'Wedding Reception'
UNION ALL
SELECT id, 2, 'Salads', 'Garden salads' FROM events WHERE name = 'Wedding Reception'
UNION ALL
SELECT id, 3, 'Main Course', 'Entrees' FROM events WHERE name = 'Wedding Reception'
UNION ALL
SELECT id, 4, 'Dessert', 'Desserts' FROM events WHERE name = 'Wedding Reception';

-- Create sample table groups
INSERT INTO table_groups (event_id, name, table_numbers, guest_count)
SELECT id, 'Tables 1-4', ARRAY[1,2,3,4], 40 FROM events WHERE name = 'Wedding Reception'
UNION ALL
SELECT id, 'Tables 5-8', ARRAY[5,6,7,8], 40 FROM events WHERE name = 'Wedding Reception';

-- Create sample menu items
INSERT INTO menu_items (course_id, name, station, prep_time_minutes)
SELECT id, 'Grilled Ribeye', 'grill', 12 FROM courses WHERE name = 'Main Course'
UNION ALL
SELECT id, 'Pan-Seared Salmon', 'saute', 10 FROM courses WHERE name = 'Main Course';

-- Create sample ingredients
INSERT INTO ingredients (name, unit, category, cost_per_unit, reorder_level)
VALUES 
  ('Ribeye Steak', 'lb', 'Protein', 15.99, 5),
  ('Salmon Fillet', 'lb', 'Protein', 12.50, 4),
  ('Olive Oil', 'l', 'Pantry', 18.50, 1),
  ('Fresh Basil', 'bunch', 'Produce', 3.99, 2);

-- Set initial stock levels
INSERT INTO stock_levels (ingredient_id, event_id, quantity)
SELECT i.id, e.id, 50
FROM ingredients i
CROSS JOIN events e
WHERE e.name = 'Wedding Reception';
```

## Troubleshooting

### "supabaseUrl is required" Error

This means the app can't find your Supabase credentials. Check that:

1. Your `.env` file exists in the project root
2. The variable names are exactly `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`
3. You've restarted the development server after adding the `.env` file

### Data Not Syncing

If changes aren't appearing on other devices:

1. Check that Realtime is enabled for all tables (see Step 3)
2. Verify both devices are connected to the internet
3. Check the browser console for WebSocket errors
4. Ensure you're using the same Supabase project on all devices

### "Row Level Security" Errors

If you see RLS policy errors:

1. Go to **Authentication** → **Policies** in Supabase
2. For each table, ensure there's a policy allowing all operations
3. The migrations should have created these automatically, but you can add them manually if needed

### Performance Issues

If the app feels slow:

1. Check your internet connection
2. Choose a Supabase region closer to your location
3. Ensure indexes are created (the migrations include these)
4. Consider upgrading your Supabase plan for better performance

## Security Considerations

### For Development

The current setup uses the **anon key**, which is safe for development and allows public read/write access. This is fine for testing.

### For Production

Before deploying to production:

1. Enable **Row Level Security (RLS)** on all tables
2. Create policies that restrict access based on user roles
3. Implement authentication so only authorized staff can access the KDS
4. Consider using Supabase's **service role key** for server-side operations
5. Set up **database backups** in Supabase settings

## Cost Considerations

Supabase offers a **free tier** that includes:

- 500 MB database storage
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests

This is sufficient for small to medium catering operations. If you exceed these limits, Supabase offers affordable paid plans starting at $25/month.

## Alternative: Using Mock Data Permanently

If you prefer not to set up Supabase, the app will continue to work in **Mock Data Mode**:

- All features work locally
- Data is stored in AsyncStorage on each device
- No real-time sync between devices
- Data persists across app restarts on the same device
- Perfect for single-tablet operations or testing

## Support

If you encounter issues:

1. Check the [Supabase documentation](https://supabase.com/docs)
2. Review the console logs for error messages
3. Verify your database schema matches the migrations
4. Ensure your Supabase project is active and not paused

## Next Steps

Once Supabase is configured:

1. Test the real-time sync by opening the app on multiple devices
2. Fire a course on one device and watch it appear on others
3. Bump an item and see inventory decrement across all tablets
4. Create low-stock alerts and see them appear instantly
5. Review the audit trail in the `inventory_transactions` table
