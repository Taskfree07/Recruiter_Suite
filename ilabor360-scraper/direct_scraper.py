"""
Direct iLabor360 Scraper - Bypasses backend and saves directly to MongoDB
Run this script standalone to scrape iLabor360 jobs
"""

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import json
from datetime import datetime
from pymongo import MongoClient
import os
import sys
from dotenv import load_dotenv

def main():
    # Fix Windows console encoding
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    # Load environment variables
    load_dotenv('../.env')

    # MongoDB connection
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ats-resume-optimizer')

    print("\n" + "="*80)
    print("ILABOR360 DIRECT SCRAPER")
    print("="*80)
    print("This script will:")
    print("1. Open a Chrome browser window")
    print("2. Navigate to iLabor360")
    print("3. Wait for YOU to manually login")
    print("4. Scrape ALL requisitions")
    print("5. Save them directly to MongoDB")
    print("="*80 + "\n")

    # Create Chrome driver
    print("Opening Chrome browser...")
    options = uc.ChromeOptions()
    options.add_argument('--start-maximized')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')

    driver = uc.Chrome(options=options, headless=False, use_subprocess=False)
driver.execute_script("document.title = 'iLabor360 - LOGIN MANUALLY';")

# Navigate to login page
LOGIN_URL = "https://vendor.ilabor360.com/logout"
print(f"Navigating to: {LOGIN_URL}")
driver.get(LOGIN_URL)
time.sleep(3)

# Pre-fill credentials (optional - you can manually enter too)
USERNAME = "Matt.s@techgene.com"
try:
    username_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="text"], input[type="email"], input#username'))
    )
    driver.execute_script(f"arguments[0].value = '{USERNAME}';", username_field)
    print(f"✓ Username pre-filled: {USERNAME}")
    print("\n" + "="*80)
    print("👉 PLEASE LOGIN MANUALLY IN THE CHROME WINDOW")
    print("="*80)
    print("1. Enter your password")
    print("2. Click the LOGIN button")
    print("3. Wait for the dashboard to load")
    print("4. This script will automatically detect when you're logged in")
    print("="*80 + "\n")
except Exception as e:
    print(f"Could not pre-fill username: {e}")
    print("\n" + "="*80)
    print("👉 PLEASE LOGIN MANUALLY IN THE CHROME WINDOW")
    print("="*80 + "\n")

# Wait for manual login
print("⏳ Waiting for you to login...")
max_wait = 300  # 5 minutes
elapsed = 0
logged_in = False

while elapsed < max_wait:
    time.sleep(2)
    elapsed += 2

    current_url = driver.current_url
    print(f"⏱️  Waiting... ({elapsed}s) Current URL: {current_url[:60]}...")

    # Check if logged in
    if 'login' not in current_url.lower() and 'logout' not in current_url.lower():
        print("\n✅ LOGIN DETECTED!")
        logged_in = True
        time.sleep(3)
        break

    # Also check for dashboard elements
    try:
        driver.find_element(By.PARTIAL_LINK_TEXT, "Requisition")
        print("\n✅ LOGIN DETECTED! (Found Requisitions link)")
        logged_in = True
        time.sleep(3)
        break
    except:
        pass

if not logged_in:
    print("\n❌ Login timeout. Please try again.")
    driver.quit()
    exit(1)

print("\n" + "="*80)
print("📥 SCRAPING REQUISITIONS")
print("="*80)

# Navigate to requisitions
try:
    print("Looking for Requisitions link...")
    req_link = WebDriverWait(driver, 15).until(
        EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "Requisition"))
    )
    print("✓ Found Requisitions link, clicking...")
    req_link.click()
    time.sleep(5)
except Exception as e:
    print(f"Could not find Requisitions link: {e}")
    print("Trying direct URL...")
    base_url = driver.current_url.split('/')[0] + '//' + driver.current_url.split('/')[2]
    driver.get(f'{base_url}/requisitions')
    time.sleep(5)

print(f"Current URL: {driver.current_url}")

# Wait for table to load
try:
    WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, 'table, .table, tbody'))
    )
    print("✓ Requisitions table loaded")
except TimeoutException:
    print("⚠️  Table load timeout - will try to scrape anyway")

# Get table headers
headers = []
try:
    header_cells = driver.find_elements(By.CSS_SELECTOR, 'table thead th, .table thead th, th')
    headers = [cell.text.strip() for cell in header_cells if cell.text.strip()]
    print(f"\n📋 Table columns ({len(headers)}): {', '.join(headers)}")
except:
    print("⚠️  Could not read headers")

# Scrape ALL pages
all_requisitions = []
page_num = 1
max_jobs = 1000

while len(all_requisitions) < max_jobs:
    print(f"\n📄 Scraping page {page_num}...")
    time.sleep(2)

    # Find rows
    rows = driver.find_elements(By.CSS_SELECTOR, 'table tbody tr, .table tbody tr, tbody tr')
    rows = [r for r in rows if r.find_elements(By.TAG_NAME, 'td')]

    if not rows:
        print("No more rows found")
        break

    print(f"  Found {len(rows)} rows on page {page_num}")

    for idx, row in enumerate(rows):
        if len(all_requisitions) >= max_jobs:
            break

        try:
            cells = row.find_elements(By.TAG_NAME, 'td')
            if len(cells) < 2:
                continue

            # Extract ALL cell data
            req_data = {}
            for cell_idx, cell in enumerate(cells):
                cell_text = cell.text.strip()
                if headers and cell_idx < len(headers):
                    key = headers[cell_idx].lower().replace(' ', '_').replace('-', '_')
                else:
                    key = f'col_{cell_idx}'
                req_data[key] = cell_text

            all_requisitions.append(req_data)

            if len(all_requisitions) % 10 == 0:
                print(f"  ... scraped {len(all_requisitions)} total requisitions")

        except Exception as e:
            print(f"  Error parsing row {idx}: {e}")
            continue

    # Try to go to next page
    has_next = False
    for selector in ['button[aria-label="Next"]', 'a[aria-label="Next"]', '.pagination .next a', 'button.next']:
        try:
            next_btn = driver.find_element(By.CSS_SELECTOR, selector)
            if next_btn.is_enabled() and next_btn.is_displayed():
                next_btn.click()
                has_next = True
                time.sleep(3)
                page_num += 1
                break
        except:
            continue

    if not has_next:
        print("✓ Reached last page")
        break

print(f"\n✅ Scraped {len(all_requisitions)} total requisitions")
driver.quit()

if len(all_requisitions) == 0:
    print("\n❌ No requisitions found. Exiting.")
    exit(1)

# Show sample
print("\n📊 Sample requisition:")
print(json.dumps(all_requisitions[0], indent=2))

# Now save to MongoDB
print("\n" + "="*80)
print("💾 SAVING TO MONGODB")
print("="*80)

try:
    print(f"Connecting to MongoDB: {MONGODB_URI}")
    client = MongoClient(MONGODB_URI)
    db = client.get_database()
    jobs_collection = db['unifiedjobs']

    print("✓ Connected to MongoDB")

    # Transform and insert jobs
    added = 0
    updated = 0
    skipped = 0

    for req in all_requisitions:
        try:
            # Extract key fields (adapt based on your column names)
            # Common column patterns: Req ID, Job Title, Location, Status, etc.

            # Try to extract title
            title = (req.get('job_title') or req.get('title') or
                    req.get('position') or req.get('col_4') or 'Unknown Position')

            # Try to extract location
            location = (req.get('location') or req.get('city') or
                       req.get('col_6') or 'Unknown Location')

            # Try to extract status
            status_text = (req.get('status') or req.get('col_0') or 'open')
            status_map = {
                'open': 'open',
                'active': 'open',
                'filled': 'filled',
                'closed': 'closed',
                'on hold': 'on_hold'
            }
            status = status_map.get(status_text.lower(), 'open')

            # Generate source ID
            req_id = req.get('req_id') or req.get('requisition_id') or req.get('col_1') or str(time.time())
            source_id = f"ILABOR360-{req_id}"

            # Check if already exists
            existing = jobs_collection.find_one({
                'sources.type': 'ilabor360',
                'sources.id': source_id
            })

            if existing:
                # Update
                jobs_collection.update_one(
                    {'_id': existing['_id']},
                    {
                        '$set': {
                            'title': title,
                            'location': location,
                            'status': status,
                            'sources.$.syncDate': datetime.utcnow()
                        }
                    }
                )
                updated += 1
            else:
                # Insert new
                new_job = {
                    'title': title,
                    'description': f"Job from iLabor360: {title}",
                    'company': 'iLabor360',
                    'requiredSkills': [],
                    'niceToHaveSkills': [],
                    'experienceYears': {'min': 0, 'max': 10},
                    'experienceLevel': 'Mid',
                    'location': location,
                    'locationType': 'onsite',
                    'sources': [{
                        'type': 'ilabor360',
                        'id': source_id,
                        'url': '',
                        'syncDate': datetime.utcnow(),
                        'metadata': req
                    }],
                    'source': 'ilabor360',
                    'status': status,
                    'postedDate': datetime.utcnow(),
                    'positions': 1,
                    'priority': 'medium',
                    'applicationsCount': 0,
                    'viewsCount': 0,
                    'tags': ['ilabor360'],
                    'archived': False,
                    'createdAt': datetime.utcnow(),
                    'updatedAt': datetime.utcnow()
                }

                jobs_collection.insert_one(new_job)
                added += 1

            if (added + updated) % 10 == 0:
                print(f"  ... processed {added + updated} jobs")

        except Exception as e:
            print(f"  Error saving job: {e}")
            skipped += 1
            continue

    print(f"\n✅ DONE!")
    print(f"   📥 Added: {added}")
    print(f"   ♻️  Updated: {updated}")
    print(f"   ⏭️  Skipped: {skipped}")
    print("\n" + "="*80)
    print("🎉 Jobs are now in MongoDB!")
    print("   Go to Job Pipeline and filter by 'ILabor' to see them.")
    print("="*80 + "\n")

    client.close()

except Exception as e:
    print(f"\n❌ MongoDB error: {e}")
    print("Check your MONGODB_URI in .env file")
    exit(1)
