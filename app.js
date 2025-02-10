const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const session = require("express-session");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite", (err) => {
    if (err) {
        console.error("Error connecting to database:", err.message);
    } else {
        console.log("Connected to SQLite database.");

        // Create users table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS users (
            isActive INTEGER NOT NULL DEFAULT 1,
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            deletionScheduledAt TEXT DEFAULT NULL
        )`);

        // Create downloads table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS downloads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            youtube_link TEXT NOT NULL,
            filename TEXT NOT NULL,
            thumbnail TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
    }
});
const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
const punycode = require("punycode/");
require("dotenv").config();
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;
const cron = require("node-cron");

// Run this task every hour (every minute for testing)
cron.schedule("* * * * *", () => {
    console.log("⏰ Checking for accounts pending deletion...");

    const now = new Date().toISOString();

    db.all(
        `SELECT id FROM users WHERE isActive = 0 AND deletionScheduledAt IS NOT NULL AND deletionScheduledAt <= ?`,
        [now],
        (err, rows) => {
            if (err) {
                console.error("❌ Error fetching users for deletion:", err);
                return;
            }

            if (!rows.length) {
                console.log("✅ No expired deletions at this time.");
                return;
            }

            console.log(`🚨 Found ${rows.length} accounts to delete.`);

            rows.forEach((user) => {
                const userId = user.id;

                // Delete downloads first
                db.run("DELETE FROM downloads WHERE user_id = ?", [userId], (downloadErr) => {
                    if (downloadErr) {
                        console.error("❌ Error deleting user downloads:", downloadErr);
                        return;
                    }

                    console.log(`✅ Deleted downloads for user ID: ${userId}`);

                    // Delete user
                    db.run("DELETE FROM users WHERE id = ?", [userId], (userErr) => {
                        if (userErr) {
                            console.error("❌ Error deleting user account:", userErr);
                            return;
                        }

                        console.log(`🗑️ Successfully removed user ID: ${userId} and all associated data.`);
                    });
                });
            });
        }
    );
});

app.get("/recaptcha-key", (req, res) => {
    res.json({ siteKey: process.env.RECAPTCHA_SITE_KEY });
});

// Set up session middleware
app.use(session({
    secret: "a9323c8867c92643e5defefb80e2edcae4f1500cbdf7a17c4966d82a50a2b73a",
    resave: false,
    saveUninitialized: true
}));

app.get("/grumpy-redirect-url", (req, res) => {
    res.json({ redirectURL: process.env.GRUMPY_REDIRECT_URL || "https://google.com" });
});


// Middleware to log all incoming requests & session state
app.use((req, res, next) => {
    console.log(`🔍 Incoming Request: ${req.method} ${req.url}`);
    console.log(`📌 Session Data:`, req.session);
    console.log(`🔑 Logged-in User: ${req.session.user ? req.session.user.username : "Guest"}`);
    next();
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"), {
    extensions: ['html', 'js'],  // Ensure it serves JavaScript files correctly
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');  // Force JS MIME type
        }
    }
}));

// Login Route - Store User in Session & Log the Event
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (!user) {
            console.warn("❌ Login Failed: Invalid username");
            return res.status(401).json({ error: "Invalid username or password" });
        }
        // Check isActive
        if (user.isActive === 0) {
            return res.status(409).json({
                error: "This account is scheduled to be deleted and cannot be logged in."
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.warn(`❌ Login Failed: Incorrect password for ${username}`);
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // ✅ Store session user data
        req.session.user = { id: user.id, username: user.username, email: user.email };

        console.log(`✅ Login Success: ${username} (ID: ${user.id})`);
        res.json({ success: true });
    });
});

// Delete account route - passes "isActive=0" to mark an account scheduled to be deleted
app.post("/account/delete-account", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user ID from session
    const username = req.session.user.username;

    db.get("SELECT id FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) {
            console.error("❌ Error fetching user ID:", err);
            return res.status(500).json({ error: "User not found." });
        }

        const userId = user.id;
        req.session.user.id = userId; // Ensure session now has `id`

        const now = new Date().toISOString();

        db.run(
            "UPDATE users SET isActive = 0, deletionScheduledAt = ? WHERE id = ?",
            [now, userId],
            function (err) {
                if (err) {
                    console.error("❌ Error scheduling account deletion:", err);
                    return res.status(500).json({ error: "Database error." });
                }

                console.log(`🗑️ Account for user ID ${userId} scheduled for deletion in 24 hours.`);
                res.json({ success: true });
            }
        );
    });
});

// Check Authentication Status - Log Session Info
app.get("/check-auth", (req, res) => {
    console.log(`🔄 Auth Check: ${req.session.user ? req.session.user.username : "Guest"}`);

    if (!req.session.user) {
        return res.json({ loggedIn: false });
    }

    db.get("SELECT id, name, email FROM users WHERE username = ?", [req.session.user.username], (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: "Database error or user not found." });
        }

        // Ensure session contains the correct `id`
        req.session.user.id = user.id;

        res.json({
            loggedIn: true,
            id: user.id,
            name: user.name,
            email: user.email
        });
    });
});

// Register User
app.post("/register", async (req, res) => {
    const { name, username, email, password } = req.body;

    // Check if user exists
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, existingUser) => {
        if (existingUser) {
            return res.status(400).json({ error: "Username already taken" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        db.run("INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)",
            [name, username, email, hashedPassword], function (err) {
                if (err) {
                    return res.status(500).json({ error: "Error inserting user" });
                }

                // Auto login after registration
                req.session.user = { username };
                res.json({ success: true });
            }
        );
    });
});

// Logout Route - Clear Session & Log Event
app.get("/logout", (req, res) => {
    console.log(`🚪 Logging Out: ${req.session.user ? req.session.user.username : "Guest"}`);
    req.session.destroy((err) => {
        if (err) {
            console.error("❌ Logout Failed:", err);
            return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true });
    });
});

// API route for downloading videos/audio
app.post("/download", async (req, res) => {
    const { url, format, fileFormat } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    const ytDlpPath = "yt-dlp";
    const tempDir = path.join(__dirname, "downloads");

    // Ensure tempDir exists
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    // Check if the file already exists in the database
    db.get("SELECT filename FROM downloads WHERE youtube_link = ?", [url], async (err, existingDownload) => {
        if (err) {
            console.error("❌ Database Error:", err.message);
            return res.status(500).json({ error: "Database error." });
        }

        // If the file exists, serve it directly without downloading again
        if (existingDownload) {
            const existingFilePath = path.join(tempDir, existingDownload.filename);

            if (fs.existsSync(existingFilePath)) {
                console.log(`📂 File already exists: ${existingFilePath}`);

                res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(existingDownload.filename)}"`);
                res.setHeader("Content-Type", format === "audio" ? "audio/mpeg" : "video/mp4");

                const fileStream = fs.createReadStream(existingFilePath);
                fileStream.pipe(res);
                return;
            }
        }

        // Get metadata: Extract Artist - Track Name and Thumbnail
        const metadataCommand = `${ytDlpPath} --print "%(artist)s - %(title)s" --get-thumbnail "${url}"`;

        exec(metadataCommand, (metaError, stdout, stderr) => {
            if (metaError || !stdout.trim()) {
                console.error("❌ Failed to fetch metadata:", stderr);
                return res.status(500).json({ error: "Failed to fetch metadata." });
            }

            const metadata = stdout.trim().split("\n");
            let filename = metadata[0].replace(/[^a-zA-Z0-9 _-]/g, "_").trim(); // Clean filename
            const thumbnail = metadata[1] || ""; // Use retrieved thumbnail URL, fallback to empty

            // Ensure filename is properly formatted
            if (!filename || filename === "_") {
                filename = "Unknown_Track";
            }
            filename += `.${fileFormat}`;
            const filepath = path.join(tempDir, filename);

            // yt-dlp command to save file
            const formatFlag = format === "audio" ? `-x --audio-format ${fileFormat}` : `--recode-video ${fileFormat}`;
            const command = `${ytDlpPath} ${formatFlag} -o "${filepath}" "${url}"`;

            console.log(`🎬 Running yt-dlp command: ${command}`);

            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ yt-dlp Error: ${stderr}`);
                    return res.status(500).json({ error: "Download failed." });
                }

                console.log("✅ yt-dlp Execution Complete!");
                console.log(`📂 File Ready: ${filepath}`);

                // If the user is logged in, save the download history
                if (req.session.user) {
                    db.run(
                        "INSERT INTO downloads (user_id, youtube_link, filename, thumbnail) VALUES (?, ?, ?, ?)",
                        [req.session.user.id, url, filename, thumbnail],
                        (dbErr) => {
                            if (dbErr) {
                                console.error("❌ Database Insert Error:", dbErr.message);
                            } else {
                                console.log(`✅ Saved Download to History for ${req.session.user.username}`);
                            }
                        }
                    );
                }

                // ✅ Correctly set the filename for browser download
                res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
                res.setHeader("Content-Type", format === "audio" ? "audio/mpeg" : "video/mp4");

                const fileStream = fs.createReadStream(filepath);
                fileStream.pipe(res);
            });
        });
    });
});

// Fetch user download history
app.get("/account", (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized." });
    db.all("SELECT * FROM downloads WHERE user_id = ?", [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error." });
        res.sendFile(path.join(__dirname, "public/account.html"));
    });
});

// Fetch user details
app.get("/account/details", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    db.get("SELECT name, email FROM users WHERE username = ?", [req.session.user.username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: "Database error." });
        }
        res.json(user);
    });
});

// Update email
app.post("/account/update-email", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { newEmail } = req.body;
    db.run("UPDATE users SET email = ? WHERE username = ?", [newEmail, req.session.user.username], function (err) {
        if (err) {
            return res.status(500).json({ error: "Database error." });
        }
        res.json({ success: true });
    });
});

// Update password
app.post("/update-password", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { currentPassword, newPassword } = req.body;
    db.get("SELECT password FROM users WHERE username = ?", [req.session.user.username], async (err, user) => {
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ error: "Incorrect current password" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, req.session.user.username], function (err) {
            if (err) {
                return res.status(500).json({ error: "Database error." });
            }
            res.json({ success: true });
        });
    });
});

// Serve account history JSON
app.get("/account/history", (req, res) => {
    if (!req.session.user) {
        console.warn("❌ Unauthorized Access to /account/history");
        return res.status(401).json({ error: "Unauthorized" });
    }

    db.all("SELECT * FROM downloads WHERE user_id = ?", [req.session.user.id], (err, rows) => {
        if (err) {
            console.error("❌ Database Error Fetching History:", err);
            return res.status(500).json({ error: "Database error." });
        }
        console.log(`📜 Download History Retrieved: ${rows.length} items for ${req.session.user.username}`);
        res.json(rows);
    });
});

// Create a credential object using Client ID, Client Secret, and Tenant ID
const credential = new ClientSecretCredential(
    process.env.GRAPH_TENANT_ID,
    process.env.GRAPH_CLIENT_ID,
    process.env.GRAPH_CLIENT_SECRET
);

// Create a Microsoft Graph Client using the credential
const graphClient = Client.initWithMiddleware({
    authProvider: {
        getAccessToken: async () => {
            const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
            return tokenResponse.token;
        }
    }
});

// Send Contact Message
app.post("/send-message", async (req, res) => {
    const { name, email, message, recaptchaToken } = req.body;

    console.log("Received request:", { name, email, message }); // Debug Log

    // Verify reCAPTCHA first
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
        console.error("reCAPTCHA verification failed");
        return res.status(400).json({ success: false, error: "reCAPTCHA verification failed" });
    }

    // If verified, proceed with sending email via Microsoft Graph API
    try {
        console.log("Attempting to send email via Microsoft Graph API...");

        await graphClient.api("/me/sendMail").post({
            message: {
                subject: "New YT-DLP Contact Form Submission",
                body: {
                    contentType: "HTML",
                    content: `
                        <p>Hello CronoTech Support,</p>
                        <p>A new contact submission has been made from the YT-DLP Contact Page.</p>
                        <h3>Message Details:</h3>
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong> ${message}</p>
                        <br>
                        <p>Reply directly to this email to respond to the user.</p>
                    `
                },
                toRecipients: [{ emailAddress: { address: process.env.GRAPH_MAILBOX } }],
                replyTo: [{ emailAddress: { address: email } }] // Set Reply-To to user's email
            }
        });

        console.log("Email successfully sent!");
        res.json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, error: "Failed to send email." });
    }
});

// To send a message when someone is grumpy about this site existing
app.post("/send-grumpy-message", async (req, res) => {
    const { name, email, message, recaptchaToken } = req.body;

    console.log("Received grumpy message:", { name, email, message }); // Debug Log

    // Verify reCAPTCHA first
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
        console.error("❌ reCAPTCHA verification failed");
        return res.status(400).json({ success: false, error: "reCAPTCHA verification failed" });
    }

    // If verified, proceed with sending email via Microsoft Graph API
    try {
        console.log("📨 Attempting to send grumpy message via Microsoft Graph API...");

        await graphClient.api("/users/" + process.env.GRAPH_MAILBOX + "/sendMail").post({
            message: {
                subject: "I'm Grumpy You're Allowing Me Free Stuff!",
                body: {
                    contentType: "HTML",
                    content: `
                        <p><strong>From:</strong> ${name} (${email})</p>
                        <p>${message}</p>
                        <hr>
                        <p>This was sent from the <strong>Grumpy Feedback Form</strong> on the site.</p>
                    `
                },
                toRecipients: [{ emailAddress: { address: process.env.GRAPH_MAILBOX } }],
                replyTo: [{ emailAddress: { address: email } }] // Allows replies directly to sender
            }
        });

        console.log("✅ Grumpy message sent successfully!");
        res.json({ success: true });

    } catch (error) {
        console.error("❌ Error sending grumpy message:", error);
        res.status(500).json({ success: false, error: "Failed to send grumpy message." });
    }
});

// Send Welcome Email on Registration
app.post("/register", async (req, res) => {
    const { name, username, email, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, existingUser) => {
        if (existingUser) {
            return res.status(400).json({ error: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run("INSERT INTO users (name, username, email, password, active) VALUES (?, ?, ?, ?, 1)",
            [name, username, email, hashedPassword], async function (err) {
                if (err) return res.status(500).json({ error: "Error inserting user" });

                req.session.user = { username };

                await graphClient.api("/me/sendMail").post({
                    message: {
                        subject: "Welcome to YouTube Downloader!",
                        body: {
                            contentType: "HTML",
                            content: `<p>Hi ${name},</p><p>Welcome to our service!</p>`
                        },
                        toRecipients: [{ emailAddress: { address: email } }]
                    }
                });

                res.json({ success: true });
            });
    });
});

// Request Account Closure
app.post("/request-closure", async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });

    const { reason } = req.body;
    const username = req.session.user.username;

    db.run("UPDATE users SET active = 0 WHERE username = ?", [username], async (err) => {
        if (err) return res.status(500).json({ error: "Database error" });

        await graphClient.api("/me/sendMail").post({
            message: {
                subject: "Account Closure Request",
                body: {
                    contentType: "HTML",
                    content: `<p>Your request has been received. Please allow 24 hours for processing.</p>`
                },
                toRecipients: [{ emailAddress: { address: username } }]
            }
        });

        res.json({ success: true });
    });
});
async function verifyRecaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const url = "https://www.google.com/recaptcha/api/siteverify";

    try {
        const response = await axios.post(url, `secret=${secretKey}&response=${token}`, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        return response.data.success && response.data.score >= 0.5;
    } catch (error) {
        console.error("Error verifying reCAPTCHA:", error);
        return false;
    }
}

app.post("/contact-submit", async (req, res) => {
    const { name, email, message, recaptchaToken } = req.body;

    // Verify reCAPTCHA first
    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
        return res.status(400).json({ success: false, error: "reCAPTCHA verification failed" });
    }

    // If verified, proceed with sending email via Microsoft Graph API
    try {
        await graphClient.api("/me/sendMail").post({
            message: {
                subject: "New Contact Form Submission",
                body: {
                    contentType: "HTML",
                    content: `<p><b>From:</b> ${name} (${email})</p><p>${message}</p>`
                },
                toRecipients: [{ emailAddress: { address: process.env.GRAPH_MAILBOX } }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, error: "Failed to send email." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});