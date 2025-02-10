# 🎥 Definitely Not for Downloading YouTube Videos 🎧

A simple web application totally not for downloading YouTube videos and audio using `yt-dlp` and `Node.js`.

## 🚀 Installation & Setup

### **1⃣ Install Node.js (if not installed)**
Download and install **Node.js 16+** from [nodejs.org](https://nodejs.org/).

### **2⃣ Clone the Repository**
```bash
git clone https://github.com/killer6oose/ctech-ytdl.git
cd YtDlpWebApp
```

### **3⃣ Install Dependencies**
```bash
npm install
```

### **4⃣ Setup Environment Variables**
Create a `.env` file in the project root and add:
```
RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
GRAPH_TENANT_ID=your-tenant-id
GRAPH_CLIENT_ID=your-client-id
GRAPH_CLIENT_SECRET=your-client-secret
GRAPH_MAILBOX=your-email@example.com
```

### **5⃣ Run the Application**
```bash
npm start
```
or run in development mode:
```bash
npm run dev
```

### **6⃣ Access the WebApp**
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## **🛀 Project Structure**
```
YtDlpWebApp/
│—— downloads/              # Folder for downloaded files (ignored in Git)
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

---

## **7⃣ One-Command Installation for Users**
After you've packaged the project, anyone can install it with:
```bash
git clone https://github.com/YOUR-USERNAME/YtDlpWebApp.git && cd YtDlpWebApp && npm install
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
pm2 start app.js --name yt-dlp-webapp
pm2 save
pm2 startup
```

---

## **🎉 Done!**
Now, your **Ctech YT-DLp** is fully packaged and ready for easy installation with a single `npm install` command! 🚀🔥

---

## **🚀 Bonus Fun: Play Games!**
Too bored to do anything else? You can navigate to the `/games` directory (or visit the Games page on our website) to enjoy a selection of **HTML5 games** including 2048, Flappy Bird, and Pac-Man! 🎮🎲

