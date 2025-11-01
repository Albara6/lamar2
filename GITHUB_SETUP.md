# GitHub Authentication Setup

## Quick Setup with Personal Access Token (Recommended)

### Step 1: Create a Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Fill in the form:
   - **Note:** "Gas Station Management Deploy"
   - **Expiration:** 90 days (or No expiration if you prefer)
   - **Scopes:** Check the box for `repo` (this gives full control of private repositories)
3. Scroll down and click **"Generate token"**
4. **IMPORTANT:** Copy the token immediately (it looks like: `ghp_xxxxxxxxxxxxxxxxxxxx`)
   - You won't be able to see it again!

### Step 2: Push to GitHub

Run this command:

```bash
cd /Users/albara/Documents/ReportsAPP
git push -u origin main --force
```

When prompted:
- **Username:** Your GitHub username (Albara6)
- **Password:** Paste the Personal Access Token you just created

### Step 3: Done!

Vercel will automatically deploy your app to:
- https://lamar2-chi.vercel.app

---

## Alternative: SSH Key Setup (Optional)

If you prefer SSH keys instead:

### Generate SSH Key:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter 3 times (default location, no passphrase)

### Copy the public key:
```bash
cat ~/.ssh/id_ed25519.pub | pbcopy
```

### Add to GitHub:
1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the key (already in your clipboard)
4. Click "Add SSH key"

### Then change remote to SSH:
```bash
cd /Users/albara/Documents/ReportsAPP
git remote set-url origin git@github.com:Albara6/lamar2.git
git push -u origin main --force
```

---

## Quick Deploy Command

After setting up authentication, just run:

```bash
cd /Users/albara/Documents/ReportsAPP && git push -u origin main --force
```

Your app will be live in 2-3 minutes! 🚀

