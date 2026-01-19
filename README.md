# Text Moderator

An AI-powered tool that detects offensive language in text and rewrites flagged sentences professionally using a local LLM.

## Features

- **Automatic Detection**: Scans text for offensive words and phrases
- **AI Rewriting**: Uses a local AI model to professionally rephrase flagged sentences
- **File Upload**: Upload `.txt` files directly
- **Self-contained**: Everything runs in Docker - no other dependencies needed

---

## Prerequisites

You need **Docker Desktop** installed.

---

## Installation Guide

### Step 1: Install Docker Desktop

#### Windows

1. Go to https://www.docker.com/products/docker-desktop/
2. Click **"Download for Windows"**
3. Run the installer and follow the prompts
4. Restart your computer when prompted
5. Open Docker Desktop and wait for it to start (you'll see "Docker is running")

#### macOS

1. Go to https://www.docker.com/products/docker-desktop/
2. Click **"Download for Mac"** (choose Intel or Apple Chip based on your Mac)
3. Open the downloaded `.dmg` file
4. Drag Docker to Applications
5. Open Docker from Applications and wait for it to start

#### Linux (Ubuntu/Debian)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and log back in, then start Docker
sudo systemctl start docker
```

#### Verify Docker is Running

Open a terminal and run:

```bash
docker --version
```

You should see something like `Docker version 24.x.x`

---

### Step 2: Run the Application

1. Open a terminal/command prompt
2. Navigate to the project folder:
   ```bash
   cd path/to/rephraser
   ```
3. Start the application:

   ```bash
   docker compose up
   ```

   Wait for the download to complete (first time only, ~2-3GB for the AI model).

4. Open your browser and go to:
   ```
   http://localhost:8080
   ```

---

## Usage

1. **Enter text** in the text area, or click a sample, or upload a `.txt` file
2. Click **"Moderate Text"**
3. Wait for the AI to process (may take a few seconds per sentence)
4. View results in the table showing:
   - Original text (with offensive terms highlighted)
   - AI-rewritten version

---

## Stopping the Application

Press `Ctrl+C` in the terminal where it's running, or run:

```bash
docker compose down
```

---

## Troubleshooting

### "System Offline" message

- The AI model is still loading (first start takes longer)
- Wait a minute and refresh the page

### Docker not starting on Windows

- Make sure WSL 2 is installed (Docker will prompt you if needed)
- Ensure virtualization is enabled in BIOS

### Slow first startup

- The first run downloads the AI model (~2GB)
- Subsequent starts will be much faster

---

## Customization

### Adding/Removing Banned Terms

**Option 1: Edit the file directly**

Edit `terms_for_moderation.txt` (one term per line):

```
your_word_here
your phrase here
another term
```

Restart the application after editing the file:

```bash
docker compose down
docker compose up --build
```

**Option 2: Upload via the UI**

1. Create a `.txt` file with one term per line
2. In the web interface, click "Upload custom terms (.txt)" in the sidebar
3. Select your file - terms are updated immediately (no restart needed)
