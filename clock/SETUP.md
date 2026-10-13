# Countdown Clock: Deployment Guide (Porkbun + GitHub + Firebase)

Plan on about 20–30 minutes the first time. You only do this once.

## How the pieces fit

| Piece | Job |
|---|---|
| GitHub | Stores the clock files |
| Porkbun Static Hosting | Publishes the files at your web address |
| Firebase (free, by Google) | Holds the timer so every screen shows the same countdown, and checks your password |

## What's in the folder

| File | Purpose | Do you edit it? |
|---|---|---|
| `index.html` | Display page for both screens (clock only) | No |
| `control.html` | Your password-protected control page | No |
| `clock.js`, `style.css` | Clock code and styling | No |
| `config.js` | Your Firebase settings and control email | **Yes** (Step 6) |
| `database.rules.json` | Security rules to paste into Firebase | **Yes** (Step 5) |

To edit `config.js` or `database.rules.json`, right-click > Open with > Notepad. Save when done.

---

## Part A: Firebase

### Step 1: Create the project
1. Go to https://console.firebase.google.com and sign in with a Google account (a work Google account is fine).
2. Click **Create a project** (or **Add project**).
3. Name it `countdown-clock` and click **Continue**.
4. Turn **off** Google Analytics (not needed) and click **Create project**, then **Continue**.

### Step 2: Create the Realtime Database
1. Left menu: **Build > Realtime Database** (if you don't see Build, click **All products**).
2. Click **Create Database**.
3. Location: **United States**. Click **Next**.
4. Choose **Start in locked mode**. Click **Enable**.
5. At the top of the Data tab you'll see a web address like `https://countdown-clock-xxxx-default-rtdb.firebaseio.com`. Keep this page handy; you'll need that address in Step 6.

### Step 3: Turn on password sign-in
1. Left menu: **Build > Authentication > Get started**.
2. On the **Sign-in method** tab, click **Email/Password**.
3. Turn on the first switch (**Email/Password**). Leave "Email link" off. Click **Save**.

### Step 4: Create the control login (this is the password)
1. Still in Authentication, click the **Users** tab > **Add user**.
2. Email: use any email you choose. It never receives mail. Example: `clock@cedarmemorial.com`.
3. Password: choose the password you'll type on the control page (at least 6 characters; longer is better).
4. Click **Add user**.
5. In the user list, copy the long **User UID** for this user (hover over it and click the copy icon). Paste it in Notepad for a moment.

Anyone who needs to run the clock just needs this password. To change it later: Users tab > the three dots next to the user > **Reset password**, or delete and re-add the user (then update the UID in Step 5).

### Step 5: Lock the timer to that login
1. Open `database.rules.json` in Notepad and replace `PASTE_YOUR_USER_UID_HERE` with the UID from Step 4. Keep the single quotes around it. Save.
2. In Firebase: **Realtime Database > Rules** tab.
3. Delete everything in the box, paste in the full contents of `database.rules.json`, and click **Publish**.

Result: anyone can view the countdown, but only someone with the password can change it.

### Step 6: Copy your settings into `config.js`
1. Click the gear icon (top left) > **Project settings**.
2. Scroll to **Your apps** and click the **</>** (Web) icon.
3. Nickname: `clock`. Leave "Firebase Hosting" unchecked. Click **Register app**.
4. Firebase shows a code block containing `const firebaseConfig = { ... }`.
5. Open `config.js` in Notepad. Copy each value from Firebase into the matching line, keeping the quotes:
   - `apiKey`, `authDomain`, `projectId`, `appId`
   - `databaseURL`: if Firebase's block doesn't include it, use the address from Step 2.
6. On the `controlEmail` line, replace `PASTE_CONTROL_EMAIL_HERE` with the email from Step 4.
7. Save `config.js`. Click **Continue to console** in Firebase.

### Step 7: Approve your web address for sign-in
1. **Authentication > Settings** tab > **Authorized domains** > **Add domain**.
2. Add your domain, e.g. `yourdomain.com`. If people visit with `www.`, add `www.yourdomain.com` too.

---

## Part B: GitHub

### Step 8: Upload the files
Choose one:

**Option 1 – The clock gets its own repo (simplest)**
1. Go to https://github.com and click **New** (or **+ > New repository**).
2. Name: `countdown-clock`. Public is fine. Click **Create repository**.
3. Click **uploading an existing file**.
4. Open the unzipped `clock-firebase` folder, select **all files inside it** (not the folder itself), and drag them into the browser.
5. Click **Commit changes**.

**Option 2 – Add the clock to your existing website repo**
1. Open your existing repo on GitHub.
2. Click **Add file > Upload files**.
3. Drag in the files, but first put them in a folder named `clock` so the clock lives at `yourdomain.com/clock/`. (Easiest: rename the unzipped folder to `clock` and drag the whole folder in.)
4. Click **Commit changes**.

Note: `config.js` is safe in a public repo. Firebase web settings aren't secret; your password and the rules in Step 5 are what protect the timer.

---

## Part C: Porkbun

### Step 9: Connect the repo to your domain
If you used **Option 2** and your repo is already connected to Porkbun, skip to Step 10; the update publishes automatically within a minute or two.

Otherwise:
1. Log in at https://porkbun.com > **Account > Domain Management**.
2. Find your domain and click **Details**, then find **Static Hosting** (set it up first if you haven't: https://kb.porkbun.com/article/137-how-to-set-up-static-hosting).
3. Choose **Connect to GitHub**, sign in to GitHub, and when asked, pick **Only select repositories** and select your repo. Porkbun's guide: https://kb.porkbun.com/article/145-how-to-connect-static-hosting-to-github
4. Wait a few minutes for the first publish.

If you used Option 1 and the domain already hosts your main website, connecting this repo would replace it. In that case, use Option 2 instead, or put the clock on a subdomain/second domain.

---

## Part D: Test it

### Step 10: Run a trial
1. On one computer open the display page:
   - Option 1: `https://yourdomain.com/`
   - Option 2: `https://yourdomain.com/clock/`
2. On another device (laptop or phone) open the control page: same address plus `control.html`.
3. Type the password and click **Unlock controls** (or press Enter).
4. Set 16 minutes and click **Set**, then **Start**. The display should change within a second and count in green.
5. Try Pause and Reset. Check that the display follows along.
6. Optional color check: set 0 h 15 m 5 s and start it; it should turn yellow at 15:00. Set 10 m 5 s; it should turn red at 10:00.

### Step 11: Event day
1. Open the display page on both screens and press **F11** for full screen.
2. Open the control page on your device and unlock it.
3. Keyboard shortcuts on the control page: **Space** = start/pause, **R** = reset.
4. When finished, click **Lock controls**.

---

## Troubleshooting

| What you see | Likely cause | Fix |
|---|---|---|
| Display shows 10:00 but never changes, or "Cannot reach timer data" | `config.js` values wrong or `databaseURL` missing | Re-check Step 6, re-upload `config.js` to GitHub |
| "Sign-in failed. Check the password." | Wrong password, wrong `controlEmail`, or Email/Password not enabled | Check Steps 3, 4 and 6 |
| Unlocks, but buttons show "Not allowed" | UID in the rules doesn't match the user | Re-copy the UID (Step 4) and re-publish rules (Step 5) |
| Sign-in error mentioning "unauthorized domain" | Domain not approved | Step 7 |
| Changes on GitHub don't appear | Porkbun hasn't republished yet, or browser cache | Wait 2 minutes, then press Ctrl+F5 |
| "Reconnecting..." in the corner | Screen lost internet | It recovers on its own once internet returns |

Firebase's free plan is far more than enough for this. Nothing needs to be left running on your computer.
