# Clothing Inventory System - Setup Guide

## 🚀 Quick Start

### Development on Your Laptop

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version

2. **Create Project Directory**
   ```bash
   mkdir clothing-inventory
   cd clothing-inventory
   ```

3. **Create the following files:**
   - `package.json` (from the artifact)
   - `server.js` (from the artifact)
   - Create a `public` folder and put `index.html` inside it

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Run the Server**
   ```bash
   npm start
   ```

6. **Access the Application**
   - Open your browser to: `http://localhost:3000`
   - Test all features on your laptop first

---

## 📱 Deploy to Raspberry Pi

### Prerequisites on Raspberry Pi

1. **Update System**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install Node.js on Pi**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Verify Installation**
   ```bash
   node --version
   npm --version
   ```

### Transfer Files to Pi

**Option 1: Using SCP (from your laptop)**
```bash
# First, zip your project folder (excluding node_modules)
cd /path/to/clothing-inventory
zip -r clothing-inventory.zip . -x "node_modules/*" "*.db" "uploads/*"

# Copy to Pi (replace with your Pi's IP address)
scp clothing-inventory.zip pi@192.168.1.XXX:~/

# SSH into Pi
ssh pi@192.168.1.XXX

# Unzip and setup
cd ~
unzip clothing-inventory.zip -d clothing-inventory
cd clothing-inventory
npm install
```

**Option 2: Using Git (recommended for updates)**
```bash
# On your laptop: Initialize git repo
cd clothing-inventory
git init
git add .
git commit -m "Initial commit"

# Push to GitHub/GitLab (create a private repo first)
git remote add origin YOUR_REPO_URL
git push -u origin main

# On Pi: Clone the repo
cd ~
git clone YOUR_REPO_URL
cd clothing-inventory
npm install
```

### Run on Raspberry Pi

1. **Start the Server**
   ```bash
   cd ~/clothing-inventory
   npm start
   ```

2. **Find Your Pi's IP Address**
   ```bash
   hostname -I
   ```
   (Usually looks like `192.168.1.XXX`)

3. **Access from Any Device on Your Network**
   - On your phone/computer browser: `http://192.168.1.XXX:3000`
   - Replace `XXX` with your Pi's actual IP

---

## 🔄 Auto-Start on Boot (Keep Running 24/7)

Use PM2 to keep the service running even after reboots:

1. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

2. **Start Application with PM2**
   ```bash
   cd ~/clothing-inventory
   pm2 start server.js --name clothing-inventory
   ```

3. **Save PM2 Configuration**
   ```bash
   pm2 save
   pm2 startup
   ```
   (Follow the command it outputs)

4. **Useful PM2 Commands**
   ```bash
   pm2 status              # Check status
   pm2 logs clothing-inventory  # View logs
   pm2 restart clothing-inventory  # Restart
   pm2 stop clothing-inventory    # Stop
   ```

---

## 🔧 Updating the Application

### From Your Laptop to Pi (using Git)

1. **Make changes on your laptop**

2. **Commit and push changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

3. **Update on Pi via SSH**
   ```bash
   ssh pi@192.168.1.XXX
   cd ~/clothing-inventory
   git pull
   npm install  # If package.json changed
   pm2 restart clothing-inventory
   ```

### Quick Update without Git

1. **Make your changes locally**

2. **Copy updated files via SCP**
   ```bash
   scp server.js pi@192.168.1.XXX:~/clothing-inventory/
   scp public/index.html pi@192.168.1.XXX:~/clothing-inventory/public/
   ```

3. **Restart on Pi**
   ```bash
   ssh pi@192.168.1.XXX
   pm2 restart clothing-inventory
   ```

---

## 📂 Project Structure

```
clothing-inventory/
├── server.js           # Backend server
├── package.json        # Dependencies
├── public/
│   └── index.html      # Frontend UI
├── uploads/            # Uploaded images (created automatically)
└── inventory.db        # SQLite database (created automatically)
```

---

## 🌐 Accessing from Your Phone

1. **Make sure your phone is on the same WiFi network**

2. **Open any web browser on your phone**

3. **Navigate to: `http://[Pi-IP-Address]:3000`**
   - Example: `http://192.168.1.150:3000`

4. **Bookmark it for easy access!**

5. **Add to Home Screen** (optional)
   - On iPhone: Safari → Share → Add to Home Screen
   - On Android: Chrome → Menu → Add to Home Screen

---

## 🔒 Optional: Set Static IP for Pi

To prevent the IP address from changing:

1. **On your router**, find DHCP settings
2. **Assign a static IP** to your Pi's MAC address
3. Alternatively, edit `/etc/dhcpcd.conf` on Pi:
   ```bash
   sudo nano /etc/dhcpcd.conf
   ```
   Add at the end:
   ```
   interface wlan0
   static ip_address=192.168.1.150/24
   static routers=192.168.1.1
   static domain_name_servers=192.168.1.1 8.8.8.8
   ```

---

## 🐛 Troubleshooting

### Can't Access from Phone/Computer

1. **Check if server is running**
   ```bash
   pm2 status
   ```

2. **Check Pi's firewall**
   ```bash
   sudo ufw status
   sudo ufw allow 3000
   ```

3. **Verify same WiFi network**
   - Both devices must be on the same network

4. **Try Pi's IP directly**
   ```bash
   # On Pi
   hostname -I
   ```

### Port Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process (replace PID with actual number)
kill -9 PID
```

### Database Issues

```bash
# Reset database (deletes all data!)
rm inventory.db
npm start  # Will recreate database
```

### Images Not Loading

```bash
# Check uploads folder permissions
chmod 755 uploads/
```

---

## 💾 Backup Your Data

**Backup database and images:**
```bash
# On Pi
cd ~/clothing-inventory
tar -czf backup-$(date +%Y%m%d).tar.gz inventory.db uploads/

# Download to laptop
scp pi@192.168.1.XXX:~/clothing-inventory/backup-*.tar.gz ./
```

---

## 🎉 You're All Set!

Your inventory system should now be:
- ✅ Running on your Raspberry Pi
- ✅ Accessible from any device on your WiFi
- ✅ Auto-starting on boot
- ✅ Easy to update via SSH

Enjoy managing your clothing inventory! 👕📦