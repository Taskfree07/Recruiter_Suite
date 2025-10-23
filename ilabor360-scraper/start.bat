@echo off
echo Starting iLabor360 Scraper Service...
echo.

REM Check if virtual environment exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting Flask server on port 5002...
echo.
python app.py

pause
