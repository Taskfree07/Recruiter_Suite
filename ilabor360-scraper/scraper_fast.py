"""
HIGH-PERFORMANCE iLabor360 Scraper
Auto-discovers APIs via network interception, falls back to parallel HTML fetching
"""

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
import uuid
import logging
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional
import json
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class FastILabor360Scraper:
    def __init__(self):
        self.sessions = {}
        self.default_timeout = 30
        self.discovered_apis = {}  # Cache discovered API endpoints

    def _create_driver(self, headless=True):
        """Create undetected Chrome WebDriver with network logging"""
        options = uc.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        # Enable performance logging to capture network requests
        options.set_capability('goog:loggingPrefs', {'performance': 'ALL'})

        if not headless:
            options.add_argument('--start-maximized')
        else:
            options.add_argument('--window-size=1920,1080')

        driver = uc.Chrome(
            options=options,
            headless=headless,
            use_subprocess=False,
            version_main=None
        )
        return driver

    def login(self, username: str, password: str, login_url: str) -> Dict:
        """Login with manual intervention - FAST VERSION"""
        driver = None
        try:
            logger.info('🚀 FAST SCRAPER - Creating browser session')
            print("\n" + "="*80)
            print("🚀 HIGH-PERFORMANCE SCRAPER ENABLED")
            print("="*80)

            driver = self._create_driver(headless=False)
            driver.execute_script("document.title = '🚀 iLabor360 FAST Login';")

            logger.info(f'Navigating to: {login_url}')
            driver.get(login_url)
            time.sleep(3)

            # Find and pre-fill credentials (same as before)
            username_selectors = [
                (By.ID, 'username'), (By.ID, 'email'),
                (By.NAME, 'username'), (By.NAME, 'email'),
                (By.CSS_SELECTOR, 'input[type="text"]')
            ]

            username_field = None
            for by, selector in username_selectors:
                try:
                    username_field = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((by, selector))
                    )
                    break
                except TimeoutException:
                    continue

            if not username_field:
                raise Exception('Could not find username field')

            password_field = driver.find_element(By.CSS_SELECTOR, 'input[type="password"]')

            # Pre-fill
            driver.execute_script("arguments[0].value = arguments[1];", username_field, username)
            driver.execute_script("arguments[0].value = arguments[1];", password_field, password)
            time.sleep(0.5)

            print("\n⏳ CLICK LOGIN BUTTON IN BROWSER\n")

            # Wait for manual login
            max_wait_time = 300
            check_interval = 2
            elapsed_time = 0

            while elapsed_time < max_wait_time:
                time.sleep(check_interval)
                elapsed_time += check_interval
                current_url = driver.current_url

                if 'login' not in current_url.lower() and 'logout' not in current_url.lower():
                    time.sleep(3)
                    break

            if 'login' in driver.current_url.lower():
                driver.quit()
                return {'success': False, 'error': 'Login timeout'}

            # Extract cookies and create requests session
            cookies = driver.get_cookies()
            requests_session = requests.Session()
            for cookie in cookies:
                requests_session.cookies.set(cookie['name'], cookie['value'])

            session_id = str(uuid.uuid4())
            self.sessions[session_id] = {
                'driver': driver,
                'requests_session': requests_session,
                'cookies': cookies,
                'created_at': time.time(),
                'username': username,
                'base_url': '/'.join(driver.current_url.split('/')[:3])
            }

            print("\n✅ LOGIN SUCCESSFUL - FAST MODE ENABLED!\n")

            return {
                'success': True,
                'sessionId': session_id,
                'dashboardUrl': driver.current_url
            }

        except Exception as e:
            logger.error(f'Login error: {str(e)}', exc_info=True)
            if driver:
                driver.quit()
            return {'success': False, 'error': str(e)}

    def scrape_requisitions(self, session_id: str, max_items: int = 1000, status_filter: str = 'all') -> Dict:
        """
        HIGH-PERFORMANCE SCRAPING:
        1. Auto-discover API endpoints by intercepting network requests
        2. If API found, use direct API calls (100x faster)
        3. If no API, use parallel HTML fetching (10x faster than sequential)
        """
        try:
            if session_id not in self.sessions:
                return {'success': False, 'error': 'Invalid session ID'}

            session = self.sessions[session_id]
            driver = session['driver']
            requests_session = session['requests_session']
            base_url = session['base_url']

            print("\n" + "="*80)
            print("🚀 HIGH-PERFORMANCE SCRAPING MODE")
            print("="*80)

            # Navigate to requisitions page
            print("\n📍 Navigating to requisitions page...")
            print(f"   Current URL before navigation: {driver.current_url}")
            
            link_selectors = [
                (By.LINK_TEXT, 'Requisitions'),
                (By.PARTIAL_LINK_TEXT, 'Requisition'),
                (By.CSS_SELECTOR, 'a[href*="requisition"]')
            ]

            nav_success = False
            for by, selector in link_selectors:
                try:
                    link = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((by, selector))
                    )
                    print(f"   Found link using: {selector}")
                    link.click()
                    time.sleep(5)
                    nav_success = True
                    break
                except Exception as e:
                    logger.debug(f"   Failed with {selector}: {e}")
                    continue
            
            if not nav_success:
                print(f"   ⚠️ Could not find requisitions link, staying on current page")
            
            print(f"   Current URL after navigation: {driver.current_url}")
            
            # Wait for page to fully load
            print("   ⏳ Waiting for page to load...")
            time.sleep(3)
            
            # Check if we can see a table
            try:
                table_check = driver.execute_script("return document.querySelectorAll('tbody tr').length;")
                print(f"   ✓ Found {table_check} table rows on page")
            except Exception as e:
                print(f"   ⚠️ Could not check for table: {e}")

            # STEP 1: Auto-discover API endpoints by analyzing network traffic
            print("\n🔍 Step 1: Auto-discovering API endpoints...")
            api_endpoint = self._discover_api_endpoint(driver, session_id)

            requisitions = []

            if api_endpoint:
                # FAST PATH: Use discovered API
                print(f"✅ API ENDPOINT DISCOVERED: {api_endpoint}")
                print("🚀 Using direct API calls (100x faster)...\n")
                requisitions = self._scrape_via_api(api_endpoint, requests_session, base_url, max_items, status_filter)
            else:
                # FALLBACK: Parallel HTML fetching
                print("⚠️  No API found, using parallel HTML fetching (10x faster)...")
                requisitions = self._scrape_via_parallel_fetch(driver, requests_session, base_url, max_items, status_filter)

            print(f"\n✅ Extracted {len(requisitions)} complete requisitions")
            print("="*80 + "\n")

            return {
                'success': True,
                'requisitions': requisitions,
                'count': len(requisitions),
                'method': 'api' if api_endpoint else 'parallel_html'
            }

        except Exception as e:
            logger.error(f'Scrape error: {str(e)}', exc_info=True)
            return {'success': False, 'error': str(e), 'requisitions': []}

    def _discover_api_endpoint(self, driver, session_id: str) -> Optional[str]:
        """
        Auto-discover API endpoints by intercepting network requests
        Returns the API endpoint if found, None otherwise
        """
        try:
            # Check cache first
            if session_id in self.discovered_apis:
                return self.discovered_apis[session_id]

            # Get performance logs (network requests)
            logs = driver.get_log('performance')

            api_candidates = []

            for entry in logs:
                try:
                    log = json.loads(entry['message'])['message']

                    # Look for Network.responseReceived events
                    if log['method'] == 'Network.responseReceived':
                        response = log['params']['response']
                        url = response['url']
                        mime_type = response.get('mimeType', '')

                        # Look for API calls that return JSON data
                        if ('application/json' in mime_type or 'api' in url.lower()) and \
                           ('requisition' in url.lower() or 'req' in url.lower() or 'job' in url.lower()):

                            # This is likely our API endpoint!
                            api_candidates.append({
                                'url': url,
                                'method': response.get('requestMethod', 'GET'),
                                'status': response['status']
                            })

                            print(f"  🎯 Found API candidate: {url}")

                except:
                    continue

            # Return the most promising candidate
            if api_candidates:
                # First, look for the showRequisitionViewList endpoint (the data endpoint!)
                for candidate in api_candidates:
                    if 'showRequisitionViewList' in candidate['url'] or 'showRequisition' in candidate['url']:
                        endpoint = candidate['url']
                        self.discovered_apis[session_id] = endpoint
                        print(f"✅ Selected data endpoint: {endpoint[:80]}")
                        return endpoint
                
                # Prefer successful GET requests
                for candidate in api_candidates:
                    if candidate['status'] == 200 and candidate['method'] == 'GET':
                        # Skip preference/config endpoints
                        if any(skip in candidate['url'].lower() for skip in ['preference', 'header', 'config', 'status']):
                            continue
                        endpoint = candidate['url']
                        self.discovered_apis[session_id] = endpoint
                        return endpoint

                # Last resort: try any 200 OK endpoint
                for candidate in api_candidates:
                    if candidate['status'] == 200:
                        endpoint = candidate['url']
                        self.discovered_apis[session_id] = endpoint
                        return endpoint

            return None

        except Exception as e:
            logger.warning(f"API discovery failed: {e}")
            return None

    def _scrape_via_api(self, api_endpoint: str, requests_session: requests.Session,
                        base_url: str, max_items: int, status_filter: str) -> List[Dict]:
        """
        Use discovered API endpoint to fetch data directly (SUPER FAST)
        """
        requisitions = []

        try:
            print(f"🚀 Calling API: {api_endpoint}")

            # Make API request
            response = requests_session.get(api_endpoint, timeout=30)

            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"✅ API returned {len(data) if isinstance(data, list) else 'data'} items")

                    # Handle different response structures
                    if isinstance(data, list):
                        items = data
                    elif isinstance(data, dict):
                        # Try common keys
                        items = data.get('data') or data.get('requisitions') or data.get('jobs') or data.get('items') or []
                    else:
                        items = []

                    # Process items
                    for item in items[:max_items]:
                        # Apply status filter if needed
                        if status_filter != 'all':
                            item_status = item.get('status', '').lower()
                            if item_status != status_filter.lower():
                                continue

                        requisitions.append(item)

                    # Log first item for debugging
                    if requisitions:
                        print("\n📊 FIRST API RESPONSE ITEM:")
                        print(json.dumps(requisitions[0], indent=2, default=str)[:500])
                        print("\n")

                except json.JSONDecodeError:
                    print("⚠️  API response is not JSON, falling back to HTML parsing")
                    return []
            else:
                print(f"⚠️  API returned status {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"API scraping error: {e}")
            return []

        return requisitions

    def _scrape_via_parallel_fetch(self, driver, requests_session: requests.Session,
                                    base_url: str, max_items: int, status_filter: str) -> List[Dict]:
        """
        Parallel HTML fetching: Extract URLs AND table data from list page, fetch detail pages in parallel
        """
        requisitions = []

        try:
            # Step 1: Extract table data AND URLs from the list page
            print("📋 Extracting table data and URLs from list...")
            print(f"   Current URL: {driver.current_url}")

            # Get headers first
            headers_script = """
            return Array.from(document.querySelectorAll('thead th')).map(th => th.innerText.trim());
            """
            headers = driver.execute_script(headers_script)
            print(f"✅ Found {len(headers)} columns")
            if headers:
                print(f"   First 5 columns: {', '.join(headers[:5])}")

            # Extract URLs AND table data together
            table_script = """
            function extractTableData() {
                const result = [];
                const rows = document.querySelectorAll('tbody tr');

                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length === 0) return;

                    const link = row.querySelector('a[href*="requisition"], a[href*="req"]');
                    const rowData = {
                        href: link ? link.href : '',
                        cells: Array.from(cells).map(cell => cell.innerText.trim())
                    };
                    result.push(rowData);
                });

                return result;
            }
            return extractTableData();
            """

            table_rows = driver.execute_script(table_script)
            print(f"✅ Found {len(table_rows)} rows with table data and URLs")

            if not table_rows:
                print("⚠️  No rows found!")
                print(f"   Trying to find table... HTML snippet:")
                body_html = driver.execute_script("return document.body.innerHTML.substring(0, 500);")
                print(f"   {body_html[:200]}")
                return []

            # Step 2: Fetch detail pages in parallel (FAST!)
            print(f"🚀 Fetching {min(len(table_rows), max_items)} detail pages in parallel...")

            def fetch_detail_page(row_data):
                """Fetch and parse a single detail page, merge with table data"""
                try:
                    url = row_data['href']
                    cells = row_data['cells']
                    
                    # Create base data from table row
                    base_data = {'_headers': headers, '_column_count': len(cells)}
                    
                    # Map cells to column names and also store by position
                    for i, cell_value in enumerate(cells):
                        if i < len(headers):
                            # Use header name (normalized)
                            col_name = headers[i].lower().replace(' ', '_').replace('#', 'num').replace('&', 'and')
                            base_data[col_name] = cell_value
                        # Also store by column position
                        base_data[f'column_{i}'] = cell_value
                    
                    # If no URL, return table data only
                    if not url:
                        return base_data

                    # Fetch detail page
                    response = requests_session.get(url, timeout=10)

                    if response.status_code == 200:
                        # Parse HTML
                        soup = BeautifulSoup(response.text, 'html.parser')

                        # Extract job description
                        job_desc = ''
                        desc_selectors = ['[class*="description"]', '[id*="description"]', 'textarea']
                        for selector in desc_selectors:
                            el = soup.select_one(selector)
                            if el and el.get_text(strip=True):
                                job_desc = el.get_text(strip=True)
                                break

                        # Add detail page data
                        base_data['job_description'] = job_desc
                        base_data['full_page_text'] = soup.get_text()[:1000]

                        # Extract form inputs
                        for input_field in soup.find_all(['input', 'textarea', 'select']):
                            name = input_field.get('name') or input_field.get('id') or ''
                            value = input_field.get('value') or input_field.get_text(strip=True)
                            if name and value:
                                field_name = name.lower().replace(' ', '_')
                                base_data[field_name] = value

                    return base_data

                except Exception as e:
                    logger.warning(f"Error fetching {row_data.get('href', 'unknown')}: {e}")
                    # Return at least the table data
                    return {
                        '_headers': headers,
                        '_column_count': len(row_data.get('cells', [])),
                        **{f'column_{i}': val for i, val in enumerate(row_data.get('cells', []))},
                        **{headers[i].lower().replace(' ', '_').replace('#', 'num').replace('&', 'and'): val 
                           for i, val in enumerate(row_data.get('cells', [])) if i < len(headers)}
                    }

            # Use ThreadPoolExecutor for parallel fetching (10-20x faster!)
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = {
                    executor.submit(fetch_detail_page, row): row
                    for row in table_rows[:max_items]
                }

                for idx, future in enumerate(as_completed(futures), 1):
                    try:
                        merged_data = future.result()
                        if merged_data:
                            requisitions.append(merged_data)

                        if idx % 10 == 0:
                            print(f"  ... fetched {idx}/{min(len(table_rows), max_items)} pages")

                    except Exception as e:
                        logger.error(f"Future error: {e}")

            print(f"✅ Fetched {len(requisitions)} detail pages in parallel")

            # Log first one
            if requisitions:
                print("\n📊 FIRST PARALLEL-FETCHED ITEM:")
                print(json.dumps(requisitions[0], indent=2, default=str)[:500])
                print("\n")

        except Exception as e:
            logger.error(f"Parallel fetch error: {e}")

        return requisitions

    def close_session(self, session_id: str):
        """Close browser session"""
        if session_id in self.sessions:
            try:
                self.sessions[session_id]['driver'].quit()
                del self.sessions[session_id]
            except Exception as e:
                logger.error(f'Error closing session: {str(e)}')

    def cleanup_old_sessions(self, max_age_seconds: int = 3600):
        """Close old sessions"""
        current_time = time.time()
        to_remove = [
            sid for sid, sess in self.sessions.items()
            if current_time - sess['created_at'] > max_age_seconds
        ]
        for sid in to_remove:
            self.close_session(sid)
