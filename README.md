# 🎥 Definitely Not for Downloading YouTube Videos 🎧

A simple web application totally not for downloading YouTube videos and audio using `yt-dlp` and `Node.js`.

## 🔹 Prerequisites
- **Ensure Python is installed** before running `npm install`.
- To install Python:
  - **Ubuntu/Debian:** `sudo apt install -y python3 python3-pip`
  - **CentOS/RHEL:** `sudo yum install -y python3 python3-pip`
  - **Arch Linux:** `sudo pacman -S python python-pip`
- If `npm install` still fails, ensure Python is in your `$PATH` by running:
```bash
which python3
```
- If Python is missing  
```bash
sudo ln -s $(which python3) /usr/bin/python
```

## 🚀 Installation & Setup

### **1 - Install Node.js (if not installed)**
Download and install **Node.js 16+** from [nodejs.org](https://nodejs.org/).

### **2 - Clone the Repository**
```bash
git clone https://github.com/killer6oose/YT-DL.git
cd YT-DL
```

### **3 - Install Dependencies**
```bash
npm install
```

### **4 - Setup Environment Variables**
Create a `.env` file (or copy the `.env.example` to a `.env` and update) in the project root and add:
```
# Server Configuration
PORT=3000
SESSION_SECRET={GENERATE YOUR OWN!}

RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
GRAPH_MAILBOX=your-email@example.com
```

### **5 - Run the Application**
```bash
npm start
```
or run in development mode:
```bash
npm run dev
```

### **6 - Access the WebApp**
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## **🛀 Project Structure**
```
ctech-ytdl/
│—— public/                 # Public static files (HTML, CSS, JS)
│—— views/                  # (Optional) Views if using a templating engine
│—— node_modules/           # Installed dependencies (ignored in Git)
│—— database.sqlite         # SQLite database (ignored in Git)
│—— .env                    # Environment variables (ignored in Git)
│—— .gitignore              # Ignore unnecessary files
│—— package.json            # Project metadata & dependencies
│—— package-lock.json       # Lock file for consistency
│—— app.js                  # Main Express application
│—— README.md               # Documentation for setup & usage
```

---

## **🚀 Deployment (Optional)**

### **Linux/macOS Setup Script**
Create `setup.sh`:
```bash
#!/bin/bash
echo "🛀 Installing dependencies..."
npm install
echo "✅ Setup complete! Run 'npm start' to launch the app."
```
Run it with:
```bash
chmod +x setup.sh
./setup.sh
```
##### This script exists in the project root already!

### **Windows Setup Script**
Create `setup.bat`:
```bat
@echo off
echo Installing dependencies...
npm install
echo Setup complete! Run "npm start" to launch the app.
```
Run it with:
```bat
setup.bat
```
##### This script exists in the project root already!

---

## **7 - One-Command Installation for Users**
```bash
git clone https://github.com/killer6oose/YT-DL.git && cd YT-DL && npm install
```
And start it with:
```bash
npm start
```

---

## **💡 Bonus: Use `pm2` for Production Deployment**
If you want to run the app persistently in production, install `pm2`:
```bash
npm install -g pm2
pm2 start app.js --name yt-dl
pm2 save
pm2 startup
```

---

## **🎉 Done!**
Now, your **Ctech YT-DLp** is fully packaged and ready for easy installation with a single `npm install` command! 🚀🔥

---

## **🚀 Bonus Fun: Play Games!**
Too bored to do anything else? You can navigate to the `/games` directory (or visit the Games page on our website) to enjoy a selection of **HTML5 games** including 2048, Flappy Bird, and Pac-Man! 🎮🎲

