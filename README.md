<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1LsrdUaJ9ZpU0t8fysvpatzdMUVRN1MqS

## Run Locally

### 1. Backend (FastAPI)
The backend handles authentication and password resets.

```bash
cd backend
# Create virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload
```
API runs at: `http://localhost:8000`

### 2. Frontend (React + Vite)
Open a new terminal window:

```bash
# Install dependencies
npm install

# Run the app
npm run dev
```
App runs at: `http://localhost:5173`

> **Note**: Ensure you have set your Supabase credentials in `backend/.env` (or env vars) for the backend to work.
