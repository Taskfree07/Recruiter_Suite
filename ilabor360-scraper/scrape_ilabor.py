"""
iLabor360 Direct Scraper - Simple script to scrape jobs and save to MongoDB
Run this with: python scrape_ilabor.py
"""

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
import json
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv

def extract_job_description(driver, job_title):
    """Extract full job description from detail page"""
    print(f"    Extracting description for: {job_title[:50]}...")
    
    try:
        # Wait for page to load
        time.sleep(2)
        
        # Try multiple selectors for job description
        description = ""
        
        # Method 1: Look for common description containers
        for selector in [
            'div.job-description',
            'div.description',
            'div.details',
            'div[class*="description"]',
            'div[class*="job-detail"]',
            'textarea[name*="description"]',
            'div.form-group',
        ]:
            try:
                elem = driver.find_element(By.CSS_SELECTOR, selector)
                text = elem.text.strip()
                if len(text) > len(description):
                    description = text
            except:
                continue
        
        # Method 2: Look for all form fields and labels
        metadata = {}
        try:
            # Get all labeled fields
            labels = driver.find_elements(By.TAG_NAME, 'label')
            for label in labels:
                try:
                    label_text = label.text.strip()
                    if not label_text:
                        continue
                    
                    # Find associated input/textarea/select
                    for_id = label.get_attribute('for')
                    if for_id:
                        try:
                            field = driver.find_element(By.ID, for_id)
                            value = field.get_attribute('value') or field.text.strip()
                            if value:
                                metadata[label_text] = value
                        except:
                            pass
                except:
                    continue
            
            # Get all text areas
            textareas = driver.find_elements(By.TAG_NAME, 'textarea')
            for ta in textareas:
                text = ta.get_attribute('value') or ta.text.strip()
                if len(text) > len(description):
                    description = text
                    
        except Exception as e:
            print(f"      Error extracting metadata: {e}")
        
        # Method 3: Get main content area
        if not description:
            try:
                main = driver.find_element(By.CSS_SELECTOR, 'main, .main-content, .content, #content')
                description = main.text.strip()
            except:
                pass
        
        # Fallback: Get page text
        if not description:
            try:
                body = driver.find_element(By.TAG_NAME, 'body')
                description = body.text.strip()
            except:
                description = "No description found"
        
        print(f"      ✓ Description length: {len(description)} chars")
        return description, metadata
        
    except Exception as e:
        print(f"      ✗ Error: {e}")
        return "Error extracting description", {}

def main():
    load_dotenv('../.env')
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ats-resume-optimizer')

    print("\n" + "="*80)
    print("ILABOR360 JOB SCRAPER WITH FULL DESCRIPTIONS")
    print("="*80)
    print("1. Chrome will open - MANUALLY LOGIN to iLabor360")
    print("2. Script will scrape all requisitions + click into details")
    print("3. Full job descriptions extracted from detail pages")
    print("4. Jobs saved directly to MongoDB")
    print("="*80 + "\n")

    # Open Chrome
    print("Opening Chrome...")
    options = uc.ChromeOptions()
    options.add_argument('--start-maximized')
    driver = uc.Chrome(options=options, headless=False, use_subprocess=False)

    # Go to login
    driver.get("https://vendor.ilabor360.com/logout")
    time.sleep(3)

    # Pre-fill username
    try:
        user_field = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="text"], input#username'))
        )
        driver.execute_script("arguments[0].value = 'Matt.s@techgene.com';", user_field)
        print("Username pre-filled")
    except:
        pass

    print("\n" + "="*80)
    print("PLEASE LOGIN MANUALLY NOW!")
    print("Enter password and click LOGIN button")
    print("="*80 + "\n")

    # Wait for login
    print("Waiting for login...")
    for i in range(150):  # 5 min timeout
        time.sleep(2)
        url = driver.current_url
        print(f"Waiting... ({i*2}s) URL: {url[:50]}...")

        if 'login' not in url.lower() and 'logout' not in url.lower():
            print("\nLOGIN DETECTED!")
            time.sleep(3)
            break

        try:
            driver.find_element(By.PARTIAL_LINK_TEXT, "Requisition")
            print("\nLOGIN DETECTED!")
            time.sleep(3)
            break
        except:
            pass
    else:
        print("\nLogin timeout!")
        driver.quit()
        return

    # Go to requisitions
    print("\nNavigating to Requisitions...")
    try:
        req_link = WebDriverWait(driver, 15).until(
            EC.element_to_be_clickable((By.PARTIAL_LINK_TEXT, "Requisition"))
        )
        req_link.click()
        time.sleep(5)
    except:
        base = driver.current_url.split('/')[0] + '//' + driver.current_url.split('/')[2]
        driver.get(f'{base}/requisitions')
        time.sleep(5)

    print(f"On page: {driver.current_url}")

    # Get headers
    try:
        WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, 'table, tbody'))
        )
        print("Table loaded")
    except:
        print("Table load timeout")

    headers = []
    try:
        header_cells = driver.find_elements(By.CSS_SELECTOR, 'thead th, th')
        headers = [c.text.strip() for c in header_cells if c.text.strip()]
        print(f"Columns: {', '.join(headers[:5])}...")
    except:
        pass

    # Scrape with description extraction
    all_jobs = []
    page = 1
    max_jobs = 50  # Start with 50 for testing, increase to 1000 later

    while len(all_jobs) < max_jobs:
        print(f"\n{'='*80}")
        print(f"PAGE {page} - Scraping up to {max_jobs} jobs")
        print(f"{'='*80}")
        time.sleep(2)

        rows = driver.find_elements(By.CSS_SELECTOR, 'tbody tr')
        rows = [r for r in rows if r.find_elements(By.TAG_NAME, 'td')]

        if not rows:
            print("No rows found")
            break

        print(f"Found {len(rows)} rows on this page")

        for idx, row in enumerate(rows):
            if len(all_jobs) >= max_jobs:
                break

            try:
                cells = row.find_elements(By.TAG_NAME, 'td')
                if len(cells) < 2:
                    continue

                # Extract table data
                job = {}
                for i, cell in enumerate(cells):
                    key = headers[i].lower().replace(' ', '_') if i < len(headers) else f'col_{i}'
                    job[key] = cell.text.strip()

                title = job.get('job_title') or job.get('title') or job.get('col_4') or 'Unknown'
                req_id = job.get('req_id') or job.get('col_1') or f'job_{len(all_jobs)}'

                print(f"\n  [{len(all_jobs)+1}/{max_jobs}] {title[:60]}")
                
                # Find clickable link in the row (usually the title or req ID)
                detail_link = None
                try:
                    # Try clicking on title link
                    for cell in cells:
                        links = cell.find_elements(By.TAG_NAME, 'a')
                        if links:
                            detail_link = links[0]
                            break
                except:
                    pass

                # Click into detail page
                if detail_link:
                    try:
                        # Click the link
                        driver.execute_script("arguments[0].click();", detail_link)
                        time.sleep(3)
                        
                        # Extract description
                        description, metadata = extract_job_description(driver, title)
                        job['full_description'] = description
                        job['detail_metadata'] = metadata
                        
                        # Go back to list
                        driver.back()
                        time.sleep(2)
                        
                        # Re-find the table to avoid stale elements
                        WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, 'tbody'))
                        )
                        
                    except Exception as e:
                        print(f"      Error clicking detail: {e}")
                        job['full_description'] = "Error: Could not extract"
                        job['detail_metadata'] = {}
                else:
                    print(f"      No detail link found")
                    job['full_description'] = "No detail link available"
                    job['detail_metadata'] = {}

                all_jobs.append(job)

            except Exception as e:
                print(f"    Error processing row: {e}")
                continue

        # Next page
        has_next = False
        for sel in ['button[aria-label="Next"]', '.pagination .next a', 'a[rel="next"]']:
            try:
                next_btn = driver.find_element(By.CSS_SELECTOR, sel)
                if next_btn.is_enabled() and next_btn.is_displayed():
                    driver.execute_script("arguments[0].click();", next_btn)
                    has_next = True
                    time.sleep(3)
                    page += 1
                    break
            except:
                continue

        if not has_next:
            print("\nReached last page")
            break

    driver.quit()
    print(f"\n{'='*80}")
    print(f"SCRAPING COMPLETE: {len(all_jobs)} total jobs")
    print(f"{'='*80}\n")

    if not all_jobs:
        print("No jobs found!")
        return

    print("\nSample job with description:")
    sample = all_jobs[0]
    print(f"Title: {sample.get('job_title', 'N/A')}")
    print(f"Description length: {len(sample.get('full_description', ''))}")
    print(f"Description preview: {sample.get('full_description', '')[:200]}...")

    # Save to MongoDB
    print("\n" + "="*80)
    print("SAVING TO MONGODB")
    print("="*80)

    try:
        client = MongoClient(MONGODB_URI)
        db = client.get_database()
        jobs_coll = db['unifiedjobs']
        print("Connected to MongoDB")

        added = 0
        updated = 0

        for job in all_jobs:
            try:
                title = job.get('job_title') or job.get('title') or job.get('col_4') or 'Unknown'
                location = job.get('location') or job.get('city') or job.get('col_6') or 'Unknown'
                status_text = job.get('status') or job.get('col_0') or 'open'
                req_id = job.get('req_id') or job.get('col_1') or str(time.time())
                source_id = f"ILABOR360-{req_id}"
                description = job.get('full_description', 'No description available')

                status = 'open'
                if 'filled' in status_text.lower():
                    status = 'filled'
                elif 'closed' in status_text.lower():
                    status = 'closed'

                existing = jobs_coll.find_one({'sources.type': 'ilabor360', 'sources.id': source_id})

                if existing:
                    jobs_coll.update_one(
                        {'_id': existing['_id']},
                        {'$set': {
                            'title': title,
                            'description': description,
                            'location': location,
                            'status': status,
                            'updatedAt': datetime.utcnow()
                        }}
                    )
                    updated += 1
                else:
                    new_job = {
                        'title': title,
                        'description': description,
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
                            'metadata': job
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
                    jobs_coll.insert_one(new_job)
                    added += 1

                if (added + updated) % 10 == 0:
                    print(f"  ... processed {added + updated} jobs")
            except Exception as e:
                print(f"Error saving job: {e}")
                continue

        print(f"\n{'='*80}")
        print(f"DONE!")
        print(f"  Added: {added}")
        print(f"  Updated: {updated}")
        print(f"{'='*80}")
        print("\nGo to Job Pipeline and filter by 'iLabor360' to see jobs WITH descriptions!\n")

        client.close()
    except Exception as e:
        print(f"\nMongoDB error: {e}")

if __name__ == '__main__':
    main()
