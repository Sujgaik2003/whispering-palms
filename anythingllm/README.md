# AnythingLLM Setup

## Quick Start

### 1. Install Docker Desktop (if not installed)

Download and install from: https://www.docker.com/products/docker-desktop/

After installation:
- Restart your computer
- Launch Docker Desktop
- Wait for it to start (whale icon in system tray)

### 2. Run Setup Script

Open PowerShell in this directory and run:

```powershell
.\setup-anythingllm.ps1
```

The script will:
- Check if Docker is installed
- Check if Docker is running
- Start AnythingLLM containers
- Show you next steps

### 3. Access AnythingLLM

Open browser: **http://localhost:3001**

- Create admin account (first time)
- Configure LLM provider

### 4. Configure LLM Provider

**Recommended: Ollama (Free, Local)**

1. Install Ollama: https://ollama.com/download
2. Download model:
   ```powershell
   ollama pull mistral
   ```
3. In AnythingLLM Dashboard:
   - Settings → LLM Preference
   - Select "Ollama"
   - URL: `http://host.docker.internal:11434`
   - Model: `mistral`
   - Save

## Manual Commands

```powershell
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# View logs
docker logs anythingllm
docker logs qdrant

# Check status
docker ps
```

## Troubleshooting

- **Docker not found**: Install Docker Desktop first
- **Port 3001 in use**: Change port in `docker-compose.yml`
- **Containers won't start**: Check Docker Desktop is running
