

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
