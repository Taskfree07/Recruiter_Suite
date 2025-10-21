@echo off
echo Starting AI Matching Service...
echo.

REM Check if venv exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate

REM Check if requirements are installed
echo Checking dependencies...
pip install -r requirements.txt --quiet

echo.
echo AI Matching Service is starting on http://localhost:5001
echo Press Ctrl+C to stop the service
echo.

REM Start the service
python app.py
