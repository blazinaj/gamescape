# Guest Account System

## Overview

The guest account system provides instant platform access without requiring email signup. This improves onboarding experience and allows users to try the platform before committing to account creation.

## How It Works

### Account Creation

When a user clicks "Try as Guest":

1. **Temporary Email Generation**
   ```typescript
   const timestamp = Date.now();
   const guestEmail = `guest_${timestamp}@gamescape.temp`;
   ```

2. **Secure Password**
   ```typescript
   const guestPassword = `guest_${timestamp}_${Math.random().toString(36).slice(2)}`;
   ```

3. **Supabase Auth Signup**
   - Creates a real Supabase auth user
   - Uses the generated temporary credentials
   - User gains authenticated status

4. **Profile Initialization**
   ```typescript
   const username = `Guest${timestamp.toString().slice(-6)}`;
   await profileService.ensureUserProfile(data.user.id, username);
   ```

5. **Developer Upgrade**
   ```typescript
   const profile = await profileService.createUserProfile(data.user.id, username, undefined, 'developer');
   await profileService.upgradeToDeveoper(data.user.id);
   ```

6. **Wallet Setup**
   ```typescript
   await grindTokenService.ensureWallet(data.user.id);
   await grindTokenService.awardGrind(data.user.id, 1000, 'Welcome bonus for new guest!');
   ```

## Guest Account Features

### Automatic Setup
- Username: `Guest` + last 6 digits of timestamp (e.g., "Guest847392")
- Role: **Developer** (full access)
- Welcome bonus: 1,000 Grind tokens
- Full platform access including developer features

### Capabilities
- Browse game store
- Play games
- Create save files
- Review games
- **Create game projects** - Full developer portal access
- **Publish games** - Test complete developer workflow
- **Manage projects** - Edit, test, and delete games
- Use all platform features (player + developer)

### Limitations
- No email notifications (uses @gamescape.temp domain)
- Credentials not saved (auto-generated)
- Lost if user clears browser data without converting

## User Experience Flow

```
Landing Page
    ↓
Click "Get Started"
    ↓
See Auth Form
    ↓
Click "Try as Guest"
    ↓
[Account created automatically]
    ↓
Redirect to Game Store
    ↓
Wallet shows 1,000 G
    ↓
Full platform access
```

## Converting Guest to Permanent

### Current Implementation

Guest accounts are fully functional Supabase users. To convert:

1. User updates their email via profile settings
2. User sets a new password
3. Account becomes permanent

### Future Enhancement

Add a "Convert Guest Account" feature:

```typescript
async function convertGuestAccount(userId: string, email: string, password: string) {
  // Update auth email
  await supabase.auth.updateUser({ email, password });

  // Update profile
  await profileService.updateUserProfile(userId, {
    username: email.split('@')[0],
    // Keep existing progress
  });

  // All saves, wallet, and progress preserved
}
```

## Security Considerations

### Safe Guest Accounts

1. **Unique Credentials**
   - Timestamp-based ensures uniqueness
   - Random component adds entropy
   - No collision risk

2. **Row Level Security**
   - Guest users are real authenticated users
   - Same RLS policies apply
   - No special security cases needed

3. **Data Isolation**
   - Each guest has isolated data
   - No cross-account access
   - Standard RLS enforcement

### Temporary Nature

- Guest accounts are NOT automatically deleted
- They persist in the database
- User can access if they save credentials
- Consider adding cleanup for old guests:

```sql
-- Clean up guest accounts older than 30 days with no activity
DELETE FROM auth.users
WHERE email LIKE 'guest_%@gamescape.temp'
AND last_sign_in_at < NOW() - INTERVAL '30 days';
```

## Implementation Details

### AuthForm Component

Location: `src/components/AuthForm.tsx`

Key function:
```typescript
const handleGuestLogin = async () => {
  setIsLoading(true);
  setError(null);

  try {
    // Generate credentials
    const timestamp = Date.now();
    const guestEmail = `guest_${timestamp}@gamescape.temp`;
    const guestPassword = `guest_${timestamp}_${Math.random().toString(36).slice(2)}`;

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email: guestEmail,
      password: guestPassword,
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create guest account');

    // Initialize profile and wallet
    const username = `Guest${timestamp.toString().slice(-6)}`;
    await profileService.ensureUserProfile(data.user.id, username);
    await grindTokenService.ensureWallet(data.user.id);
    await grindTokenService.awardGrind(data.user.id, 1000, 'Welcome bonus for new guest!');

    onSuccess();
  } catch (err: any) {
    setError(err.message || 'Failed to create guest account');
  } finally {
    setIsLoading(false);
  }
};
```

### UI Elements

**Button Placement:**
- Below email/password form
- Above "Don't have an account?" link
- Separated by "Or" divider

**Button Style:**
- Slate gray background (less prominent than primary)
- UserPlus icon
- "Try as Guest" text
- Loading state during creation

## Testing

### Manual Testing

1. Start development server
2. Navigate to landing page
3. Click "Get Started"
4. Click "Try as Guest"
5. Verify:
   - Successful login
   - Username shows as "Guest######"
   - Wallet shows 1,000 G
   - Can access store
   - Can play games

### Automated Testing

```typescript
describe('Guest Account', () => {
  it('should create guest account with welcome bonus', async () => {
    const result = await createGuestAccount();
    expect(result.user).toBeDefined();
    expect(result.profile.username).toMatch(/^Guest\d{6}$/);
    expect(result.wallet.balance).toBe(1000);
  });

  it('should have unique credentials', async () => {
    const guest1 = await createGuestAccount();
    const guest2 = await createGuestAccount();
    expect(guest1.email).not.toBe(guest2.email);
  });
});
```

## Benefits

### For Users
- Instant access without forms
- Try before commitment
- No email verification wait
- Immediate gratification

### For Platform
- Lower signup friction
- Higher conversion rates
- User can test before deciding
- Easier onboarding

### For Developers
- Quick testing accounts
- No need to create test users manually
- Fresh slate for each test
- Real auth flow testing

## Metrics to Track

### Engagement
- Guest account creation rate
- Guest to permanent conversion rate
- Average session time for guests
- Games played by guests

### Conversion
- % guests who convert
- Time to conversion
- Conversion triggers

### Retention
- Guest return rate (if they save credentials)
- Games purchased by guests
- Reviews left by guests

## Future Enhancements

1. **Conversion Prompts**
   - After first game purchase
   - After saving progress
   - Before wallet runs low

2. **Progress Warning**
   - Show reminder that account is temporary
   - Prompt to save credentials
   - Offer easy conversion

3. **Guest Limitations**
   - Limit certain features for guests
   - Encourage conversion for full access
   - e.g., max 3 games before conversion

4. **Analytics**
   - Track guest behavior
   - Identify conversion triggers
   - Optimize guest experience

## Maintenance

### Cleanup Strategy

Periodically remove inactive guest accounts:

```sql
-- Identify stale guests (no activity > 90 days)
SELECT id, email, last_sign_in_at
FROM auth.users
WHERE email LIKE 'guest_%@gamescape.temp'
AND last_sign_in_at < NOW() - INTERVAL '90 days'
ORDER BY last_sign_in_at;

-- Clean up (run with caution)
-- This will cascade delete all related data via foreign keys
DELETE FROM auth.users
WHERE email LIKE 'guest_%@gamescape.temp'
AND last_sign_in_at < NOW() - INTERVAL '90 days';
```

### Monitoring

Track guest account health:

```sql
-- Guest account statistics
SELECT
  COUNT(*) as total_guests,
  COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 1 END) as active_guests,
  COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 1 END) as monthly_active,
  AVG(EXTRACT(epoch FROM (NOW() - created_at))/86400) as avg_age_days
FROM auth.users
WHERE email LIKE 'guest_%@gamescape.temp';
```

## Conclusion

The guest account system provides a frictionless entry point to the platform while maintaining security and data integrity. Users can explore the full platform immediately, and their progress is preserved if they choose to convert to a permanent account.
