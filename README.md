# RinkDeck — Hockey Arena Audio Player (Unraid Docker & PWA)

A dedicated, touch-first hockey arena audio player and goal soundboard designed specifically for iPads, tablets, and rinkside consoles. Runs in a lightweight multi-architecture Docker container on Unraid with persistent track cue position memory, instant whistle silence, custom goal horns, and 20 programmable athlete celebration buttons.

---

## Features

- **"Game Time" Simplified Interface**: Clean, clutter-free game-day mode designed specifically for arena and live sports audio operators. Hides complex studio settings and features tactile transport controls (**PANIC MUTE**, **STOP**, **PLAY**, **NEXT**), a massive **GOAL** celebration button (which opens the celebration soundboard silently on tap), and a unified playlist with one-tap song rotation exclusion.
- **Dedicated Emergency 'Panic Mute'**: Prominent, high-visibility button right next to STOP/PLAY that immediately cuts all audio output (HTML5 media elements, Web Audio synthesis nodes, and arena goal horns) with zero delay. Perfect for accidental track starts or unexpected on-ice situations.
- **Custom Goal Horn & Player Horn Toggle**: Upload any custom arena horn audio file (MP3, WAV, FLAC, AAC) or use the authentic multi-oscillator stadium synthesizer. Includes an instant toggle (`HORN W/ PLAYER: ON / OFF`) so you choose whether selecting an athlete blasts the horn or plays only their song.
- **Unified Playlist with Song Exclusion**: One unified playlist across the entire app with the ability to exclude songs from normal queue progression and shuffle rotation (ideal for athlete goal songs, penalties, or organ stings that you only want to trigger on demand).
- **Goal Soundboard (20 Programmable Buttons)**: Dedicated stadium celebration popup with 20 tactile buttons labeled with 2-digit athlete jersey numbers (e.g., #97 McDavid, #08 Ovechkin, #23 Jordan, #99 Gretzky). Easily program any button with custom athlete names, assigned songs, cue start drops (e.g. skip to chorus), and custom horn settings.
- **Persistent Cue Memory**: Automatically remembers where you left off in each track and restores playback cues upon track load. Cue points are stored persistently in Unraid's `/mnt/user/appdata/ipad-audio-player`.
- **Touch-First Tactile Controls**: Oversized touch targets (44px+ minimum), custom velocity-sensitive scrubbers, digital LED clock, and landscape/portrait responsive views.
- **PWA & iOS MediaSession**: Add to your iPad Home Screen for fullscreen app experience without browser address bars. Syncs track details and controls with iPad Lock Screen, Control Center, and AirPlay.
- **Sleep Timer & Screen Dimmer**: Built-in 15/30/45/60 min sleep timers with soft volume fade-out, plus a bedside OLED black screen dimmer.
- **Zero Cloud Dependency**: Runs entirely locally on your home network inside Unraid Docker.

---

## 1. Uploading to GitHub & GitHub Actions

This repository includes a ready-to-go GitHub Actions workflow (`.github/workflows/docker-build-push.yml`) that automatically builds a multi-architecture Docker container (`linux/amd64` and `linux/arm64`) and publishes it to **GitHub Container Registry (GHCR)** whenever you push code or tags.

### Step 1: Push to GitHub

```bash
# Initialize git (if not already initialized)
git init
git add .
git commit -m "feat: iPad Audio Player initial release"

# Link to your GitHub repository
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ipad-audio-player.git

# Push to trigger the GitHub Actions build
git push -u origin main
```

### Step 2: GitHub Actions Automated Build

1. Go to your repository on GitHub and click the **Actions** tab.
2. The workflow **"Build & Publish Docker Container"** will automatically start.
3. It validates TypeScript, builds Vite & Express, and publishes the image to:
   ```
   ghcr.io/YOUR_GITHUB_USERNAME/ipad-audio-player:latest
   ```

### Step 3: Make the Package Public (Important for Unraid)

By default, GitHub sets newly created container packages to private:
1. On GitHub, navigate to your repository homepage.
2. Look at the right sidebar under **Packages** and click `ipad-audio-player`.
3. Click **Package Settings** (on the bottom right).
4. Scroll to **Danger Zone** and change package visibility to **Public**.
   *(This allows your Unraid server to pull the image directly without needing a Docker login!)*

---

## 2. Installing on Unraid

### Option A: Using the Unraid User Template (Recommended)

1. Open your Unraid WebGUI or connect via SMB/SSH.
2. Copy `unraid-template.xml` from this repository to your Unraid flash drive templates folder:
   ```bash
   cp unraid-template.xml /boot/config/plugins/dockerMan/templates-user/my-ipad-audio-player.xml
   ```
3. In the Unraid WebGUI, go to the **Docker** tab and click **Add Container**.
4. In the **Template** dropdown at the top, select **iPad-Audio-Player**.
5. Update the **Repository** field with your GitHub username:
   ```
   ghcr.io/YOUR_GITHUB_USERNAME/ipad-audio-player:latest
   ```
6. Verify the settings:
   - **WebUI Port**: `3000` (or choose another port if 3000 is taken on your Unraid server)
   - **Appdata Storage**: `/mnt/user/appdata/ipad-audio-player` -> `/config`
7. Click **Apply**. Unraid will download the image and start the container!

---

### Option B: Add Container Manually via Unraid WebGUI

If you prefer adding it through the Unraid GUI without copying XML files:
1. Go to the **Docker** tab in Unraid and click **Add Container**.
2. Configure the following fields:
   - **Name**: `ipad-audio-player`
   - **Repository**: `ghcr.io/YOUR_GITHUB_USERNAME/ipad-audio-player:latest`
   - **Network Type**: `Bridge`
   - **Icon URL**: `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/disc.svg`
   - **WebUI**: `http://[IP]:[PORT:3000]/`
3. Click **+ Add another Path, Port, Variable, label or device**:
   - **Port**:
     - *Config Type*: Port
     - *Name*: WebUI Port
     - *Container Port*: `3000`
     - *Host Port*: `3000`
   - **Path**:
     - *Config Type*: Path
     - *Name*: Appdata Storage
     - *Container Path*: `/config`
     - *Host Path*: `/mnt/user/appdata/ipad-audio-player`
     - *Access Mode*: Read/Write
4. Click **Apply**.

---

### Option C: Using Docker Compose on Unraid

If you use the **Docker Compose Manager** plugin in Unraid or run compose via CLI:

```bash
cd /mnt/user/appdata/ipad-audio-player
# Place docker-compose.yml here
docker compose up -d
```

---

### Option D: Direct Unraid Terminal Command

Open the Unraid web terminal and run:

```bash
docker run -d \
  --name ipad-audio-player \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /mnt/user/appdata/ipad-audio-player:/config \
  ghcr.io/YOUR_GITHUB_USERNAME/ipad-audio-player:latest
```

---

## 3. Setting Up on iPad (Home Screen PWA)

1. Open **Safari** on your iPad.
2. Navigate to your Unraid server's IP address:
   ```
   http://192.168.1.XXX:3000
   ```
3. Tap the **Share button** (the square icon with an upward arrow) in the Safari toolbar.
4. Scroll down and tap **"Add to Home Screen"**.
5. Give it a name (e.g. `Audio Player`) and tap **Add**.
6. Launch the player from your iPad Home Screen!
   - Runs in fullscreen standalone mode (no Safari URL bar or tabs).
   - Audio continues playing when the screen locks or when switching apps.
   - Lock screen & Control Center show track titles, scrub bars, and playback buttons.

---

## 4. Local Development

To run locally on your development machine:

```bash
# Install dependencies
npm install

# Start development server with HMR and Express API
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
