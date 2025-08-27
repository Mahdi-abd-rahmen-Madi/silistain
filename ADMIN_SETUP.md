# Admin Management Guide

This document outlines how to manage admin users in the application.

## Prerequisites
- Access to the Supabase dashboard
- Superuser or admin privileges in Supabase
- User ID of the account to be made an admin

## Adding an Admin

### 1. Create the Admins Table (First-Time Setup)

Run this SQL in the Supabase SQL Editor:

```sql
-- Create admins table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all admins" 
ON admins FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only existing admins can add new admins" 
ON admins FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "Only existing admins can remove admins" 
ON admins FOR DELETE 
TO authenticated 
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON admins
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 2. Add the First Admin (Superuser Required)

Run this SQL in the Supabase SQL Editor, replacing `'user-uuid-here'` with the actual user ID:

```sql
-- Add first admin (run as superuser)
INSERT INTO admins (user_id) VALUES ('user-uuid-here');
```

### 3. Add Additional Admins (Can be done by existing admins)

Existing admins can add new admins through the application's admin interface or by running:

```sql
-- Add additional admins (can be run by existing admins)
INSERT INTO admins (user_id) VALUES ('new-admin-uuid-here');
```

## Verifying Admin Status

To check if a user is an admin:

```sql
SELECT EXISTS (
  SELECT 1 FROM admins 
  WHERE user_id = 'user-uuid-here'
) AS is_admin;
```

## Removing an Admin

To remove admin privileges from a user:

```sql
DELETE FROM admins WHERE user_id = 'user-uuid-to-remove';
```

## Security Notes

1. Always verify user identities before granting admin privileges
2. Keep the number of admins to a minimum
3. Regularly review admin access
4. Use strong authentication methods for admin accounts
5. Keep audit logs of admin actions

## Troubleshooting

### If updates to products are not working:

1. Check if the user has admin privileges
2. Verify the RLS policies on the products table:

```sql
-- Check products table policies
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Example policy for admin access
CREATE POLICY "Enable all for admins" 
ON products
FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
```
