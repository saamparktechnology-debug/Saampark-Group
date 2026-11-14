# 🚀 Saampark CRM — Complete Setup Guide (New Computer)

Follow every step **in order**. Do not skip anything.

---

## ✅ PART 1 — Install Required Software

### Step 1 — Install Node.js

1. Open your browser and go to: **https://nodejs.org/**
2. Click **"LTS"** (the big green button on the left).
3. Run the downloaded `.msi` installer.
4. Click **Next → Next → Install → Finish** (keep all default settings).
5. **Verify** — open **Command Prompt** (press `Win + R`, type `cmd`, press Enter) and run:

   ```
   node -v
   ```
   You should see: `v22.x.x`

   ```
   npm -v
   ```
   You should see: `10.x.x`

   ✅ If you see version numbers, Node.js is installed correctly.

---

### Step 2 — Install XAMPP (for MySQL)

> ⚠️ If MySQL is already installed on your computer, skip this step.

1. Go to: **https://www.apachefriends.org/**
2. Click **"Download XAMPP for Windows"**.
3. Run the installer → click **Next → Next → Install** (all defaults).
4. XAMPP Control Panel opens automatically after install.
5. On the **MySQL** row, click the **Start** button.
6. MySQL row turns **green** with status: **Running**.

   ✅ MySQL is now running on **port 3306**.

   > ℹ️ You do **NOT** need to start Apache — only MySQL is needed.

---

### Step 3 — Install VS Code

1. Go to: **https://code.visualstudio.com/**
2. Click **Download for Windows** → run the installer.
3. Click **Next → Accept → Next → Install → Finish**.

---

## ✅ PART 2 — Open the Project in VS Code

### Step 4 — Open the CRM Folder

1. Open **VS Code**.
2. Click **File → Open Folder...** (or press `Ctrl + K`, then `Ctrl + O`).
3. Browse to the **CRM** folder and click **Select Folder**.

   ✅ You should see all project files in the left panel.

---

### Step 5 — Open the Terminal

1. In VS Code press **Ctrl + `** (backtick key, below Escape).
2. The terminal opens at the bottom.
3. Confirm the path ends in `...\CRM>`.

---

## ✅ PART 3 — Set Up the Database

### Step 6 — Create the Database in phpMyAdmin

1. Open your browser → go to: **http://localhost/phpmyadmin/**
2. In the left sidebar, click **"New"**.
3. In the **Database name** box type exactly: `crm_db`
4. In the collation dropdown, select: **`utf8mb4_unicode_ci`**
5. Click **Create**.

   ✅ The `crm_db` database is created.

---

### Step 7 — Import the Database

1. In phpMyAdmin, click **`crm_db`** in the left sidebar.
2. Click the **"Import"** tab at the top.
3. Click **"Choose File"**.
4. Browse to: `CRM\database\crm_db_complete.sql` and select it.
5. Leave all settings as default.
6. Scroll down and click **"Import"** (or "Go").

   ✅ Wait 10–30 seconds. A green success message means the import worked.
   This imports all **92 tables** and all the sample data.

---

## ✅ PART 4 — Set Up the Backend

### Step 8 — Go to the Backend Folder

In the VS Code terminal, run:

```
cd backend\src_extracted
```

Your prompt should now show `...\CRM\backend\src_extracted>`.

---

### Step 9 — Create the Backend `.env` File

1. In VS Code left panel, navigate to: `backend → src_extracted`.
2. Right-click on that folder → **New File** → name it `.env`
3. Open it and paste **exactly** this:

```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=crm_db

JWT_SECRET=8vK#2mQ!7xP@4zL$9rT^6nW&3cY*5sH@1jF!8dQ#0kV$6pX
JWT_EXPIRES_IN=1d

CLIENT_URL=http://localhost:3000
```

4. Press `Ctrl + S` to save.

   > ⚠️ If your MySQL root user has a **password**, add it after `DB_PASSWORD=`.
   > Default XAMPP has no password — leave it blank.

---

### Step 10 — Install Backend Packages

In the terminal (still in `backend\src_extracted`):

```
npm install
```

⏳ Wait 1–3 minutes. You'll see `added XXX packages` when done.

---

### Step 11 — Run Migrations

Still in `backend\src_extracted`:

```
node migrate.js
```

✅ You should see a list of messages ending with:

```
Migration complete!
```

---

### Step 12 — Start the Backend Server

Still in `backend\src_extracted`:

```
npm start
```

✅ You should see:

```
🚀 CRM Backend Server running on port 5000
✅ Successfully connected to MySQL Database!
```

> ⚠️ **Keep this terminal open.** The backend runs as long as this terminal is open.

---

## ✅ PART 5 — Set Up the Frontend

### Step 13 — Open a Second Terminal

In VS Code, click the **"+"** button in the terminal panel (top-right of terminal area) to open a **new terminal tab**.

---

### Step 14 — Go to the Frontend Folder

In the **new terminal**:

```
cd frontend
```

---

### Step 15 — Create the Frontend `.env.local` File

1. In VS Code left panel, navigate to: `frontend`.
2. Right-click → **New File** → name it `.env.local`
3. Open it and paste:

```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:5000/api/v1
```

4. Press `Ctrl + S` to save.

---

### Step 16 — Install Frontend Packages

In the **frontend terminal**:

```
npm install
```

⏳ This takes 3–7 minutes (Next.js has many packages). Wait for it to complete.

---

### Step 17 — Start the Frontend Server

Still in the `frontend` terminal:

```
npm run dev
```

⏳ Wait **15–30 seconds** for Next.js to compile.

✅ You should see:

```
▲ Next.js 16.2.12
- Local:   http://localhost:3000
✓ Ready in Xs
```

---

## ✅ PART 6 — Open the CRM

### Step 18 — Open in Your Browser

1. Open **Chrome** (or any browser).
2. Go to: **http://localhost:3000**
3. You should see the **Saampark CRM login page**.

---

## 🔐 Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `hiisupriya@gmail.com` | `123456` |
| **Super Admin** | `supriyo.main@gmail.com` | `123456` |
| **Admin** | `admin@saampark.in` | `admin123` |
| **Team Member** | `team@saampark.in` | `Password123` |
| **Client** | `client@saampark.in` | `Password123` |

---

## ⏹️ How to Stop the Servers

- In the **Backend terminal** → press `Ctrl + C` → type `Y` → press `Enter`
- In the **Frontend terminal** → press `Ctrl + C` → type `Y` → press `Enter`

---

## 🔄 How to Start the CRM Every Day (After First Setup)

1. Open **XAMPP Control Panel** → click **Start** next to **MySQL**.
2. Open the **CRM folder** in VS Code.
3. Open **two terminals**:

**Terminal 1 — Start Backend:**
```
cd backend\src_extracted
npm start
```

**Terminal 2 — Start Frontend:**
```
cd frontend
npm run dev
```

4. Open browser → **http://localhost:3000**

---

## 🛟 Troubleshooting

| Problem | Solution |
| :--- | :--- |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL is not running. Open XAMPP → Start MySQL. |
| `ER_ACCESS_DENIED_ERROR` | Your MySQL root has a password. Add it to `.env` on `DB_PASSWORD=` line. |
| `Port 3000 already in use` | Run `npx kill-port 3000` then `npm run dev` again. |
| `Port 5000 already in use` | Run `npx kill-port 5000` then `npm start` again. |
| Frontend shows blank/API errors | Make sure **Backend** terminal is running (`npm start`). |
| `Cannot find module` error | Run `npm install` inside the folder showing the error. |
| phpMyAdmin won't open | Open XAMPP Control Panel and start MySQL. |

---

> 💡 **Quick Summary — All commands in order:**
> ```
> # Terminal 1 — Backend
> cd backend\src_extracted
> npm install
> node migrate.js
> npm start
>
> # Terminal 2 — Frontend
> cd frontend
> npm install
> npm run dev
> ```
