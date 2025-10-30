"""
PRODUCTION-GRADE iLabor360 Scraper
Extracts ALL data including job descriptions from detail pages
"""

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, StaleElementReferenceException
import time
import uuid
import logging
from typing import Dict, List, Optional
import json

logger = logging.getLogger(__name__)

class ILabor360ScraperV2:
    def __init__(self):
        self.sessions = {}
        self.default_timeout = 30

    def _create_driver(self, headless=True):
        """Create undetected Chrome WebDriver"""
        options = uc.ChromeOptions()
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

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
        """Login with manual intervention - same as before"""
        driver = None
        try:
            logger.info('Creating browser session for MANUAL login')
            print("\n" + "="*80)
            print("🪟 OPENING CHROME BROWSER WINDOW FOR MANUAL LOGIN")
            print("="*80)

            driver = self._create_driver(headless=False)
            driver.execute_script("document.title = '🔐 iLabor360 Manual Login - DO NOT CLOSE';")

            logger.info(f'Navigating to: {login_url}')
            driver.get(login_url)
            time.sleep(3)

            # Find and pre-fill username
            username_selectors = [
                (By.ID, 'username'), (By.ID, 'email'),
                (By.NAME, 'username'), (By.NAME, 'email'),
                (By.CSS_SELECTOR, 'input[type="text"]'),
                (By.CSS_SELECTOR, 'input[type="email"]')
            ]

            username_field = None
            for by, selector in username_selectors:
                try:
                    username_field = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((by, selector))
                    )
                    logger.info(f'Found username field: {by}={selector}')
                    break
                except TimeoutException:
                    continue

            if not username_field:
                raise Exception('Could not find username field')

            # Find password field
            password_selectors = [
                (By.ID, 'password'), (By.NAME, 'password'),
                (By.CSS_SELECTOR, 'input[type="password"]')
            ]

            password_field = None
            for by, selector in password_selectors:
                try:
                    password_field = driver.find_element(by, selector)
                    logger.info(f'Found password field: {by}={selector}')
                    break
                except NoSuchElementException:
                    continue

            if not password_field:
                raise Exception('Could not find password field')

            # Pre-fill credentials
            try:
                driver.execute_script("arguments[0].value = arguments[1];", username_field, username)
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", username_field)
                time.sleep(0.5)

                driver.execute_script("arguments[0].value = arguments[1];", password_field, password)
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", password_field)
                time.sleep(0.5)
            except Exception as e:
                logger.warning(f'Could not pre-fill credentials: {e}')

            # Wait for manual login
            print("\n" + "="*80)
            print("⏳ WAITING FOR YOU TO LOGIN MANUALLY IN THE BROWSER WINDOW")
            print("="*80)
            print("👉 CLICK THE LOGIN BUTTON IN THE CHROME WINDOW NOW!")
            print("="*80 + "\n")

            max_wait_time = 300
            check_interval = 2
            elapsed_time = 0

            while elapsed_time < max_wait_time:
                time.sleep(check_interval)
                elapsed_time += check_interval
                current_url = driver.current_url

                if 'login' not in current_url.lower() and 'logout' not in current_url.lower():
                    logger.info('✓ Login detected! URL changed.')
                    time.sleep(3)
                    break

                # Check for dashboard elements
                try:
                    dashboard_indicators = [
                        (By.LINK_TEXT, 'Requisitions'),
                        (By.PARTIAL_LINK_TEXT, 'Requisition'),
                        (By.XPATH, '//a[contains(text(), "Dashboard")]')
                    ]
                    for by, selector in dashboard_indicators:
                        try:
                            element = driver.find_element(by, selector)
                            if element.is_displayed():
                                logger.info(f'✓ Login detected! Found: {selector}')
                                elapsed_time = max_wait_time
                                break
                        except:
                            continue
                except:
                    pass

            current_url = driver.current_url
            if 'login' in current_url.lower() or 'logout' in current_url.lower():
                print("\n❌ LOGIN TIMEOUT OR FAILED")
                driver.quit()
                return {'success': False, 'error': 'Manual login timeout'}

            session_id = str(uuid.uuid4())
            self.sessions[session_id] = {
                'driver': driver,
                'created_at': time.time(),
                'username': username
            }

            print("\n✅ LOGIN SUCCESSFUL!")
            print(f"Session ID: {session_id}\n")

            return {
                'success': True,
                'sessionId': session_id,
                'dashboardUrl': current_url
            }

        except Exception as e:
            logger.error(f'Login error: {str(e)}', exc_info=True)
            if driver:
                driver.quit()
            return {'success': False, 'error': str(e)}

    def scrape_requisitions(self, session_id: str, max_items: int = 1000, status_filter: str = 'all') -> Dict:
        """
        Scrape requisitions WITH full job descriptions from detail pages
        """
        try:
            if session_id not in self.sessions:
                return {'success': False, 'error': 'Invalid session ID'}

            driver = self.sessions[session_id]['driver']
            requisitions = []

            print("\n" + "="*80)
            print("🔍 SCRAPING REQUISITIONS WITH FULL DETAILS FROM ILABOR360")
            print("="*80)

            # Navigate to requisitions page
            logger.info('Navigating to requisitions page')
            link_selectors = [
                (By.LINK_TEXT, 'Requisitions'),
                (By.PARTIAL_LINK_TEXT, 'Requisition'),
                (By.CSS_SELECTOR, 'a[href*="requisition"]')
            ]

            for by, selector in link_selectors:
                try:
                    link = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((by, selector))
                    )
                    logger.info(f'✓ Found requisitions link: {by}={selector}')
                    link.click()
                    time.sleep(5)
                    break
                except TimeoutException:
                    continue

            print(f"📍 On page: {driver.current_url}")

            # Wait for table
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'table, .table, tbody'))
            )
            print("✓ Requisitions table loaded")

            # Extract table data with JavaScript
            items_scraped = 0
            page_num = 1

            while items_scraped < max_items:
                print(f"\n📄 Processing page {page_num}...")
                time.sleep(2)

                # Get table data
                table_extract_script = """
                function extractTableData() {
                    const table = document.querySelector('table, .table');
                    if (!table) return { headers: [], rows: [] };

                    const headerCells = table.querySelectorAll('thead th, thead td');
                    const headers = Array.from(headerCells).map(cell => ({
                        text: (cell.innerText || cell.textContent || '').trim(),
                        visible: window.getComputedStyle(cell).display !== 'none'
                    }));

                    const bodyRows = table.querySelectorAll('tbody tr');
                    const rows = [];

                    bodyRows.forEach((row, idx) => {
                        const cells = row.querySelectorAll('td');
                        const rowData = Array.from(cells).map(cell => ({
                            text: (cell.innerText || cell.textContent || '').trim(),
                            visible: window.getComputedStyle(cell).display !== 'none'
                        }));

                        // Find clickable link in row
                        const link = row.querySelector('a[href*="requisition"], a[href*="req"]');
                        const linkHref = link ? link.getAttribute('href') : null;

                        rows.push({
                            data: rowData,
                            linkHref: linkHref,
                            rowIndex: idx
                        });
                    });

                    return { headers, rows };
                }
                return extractTableData();
                """

                table_data = driver.execute_script(table_extract_script)

                if not table_data or not table_data.get('rows'):
                    print("⚠️  No data found on page")
                    break

                headers = [h['text'] for h in table_data['headers']]

                if items_scraped == 0:
                    print(f"\n📋 Found {len(headers)} columns:")
                    for idx, header in enumerate(headers):
                        vis = "✓" if table_data['headers'][idx]['visible'] else "✗"
                        print(f"  {vis} [{idx:2d}] {header}")
                    print()

                rows_on_page = table_data['rows']
                print(f"✓ Found {len(rows_on_page)} requisitions on this page")

                # Process each row
                for row_info in rows_on_page:
                    if items_scraped >= max_items:
                        break

                    try:
                        # Extract table row data
                        row_data = {}
                        for idx, cell in enumerate(row_info['data']):
                            if idx < len(headers):
                                key = self._normalize_key(headers[idx])
                                row_data[key] = cell['text']
                            else:
                                row_data[f'column_{idx}'] = cell['text']

                        # Apply status filter
                        if status_filter != 'all':
                            status_val = row_data.get('status', '').lower()
                            if status_val != status_filter.lower():
                                continue

                        # NOW CLICK INTO THE DETAIL PAGE
                        detail_data = {}
                        if row_info['linkHref']:
                            print(f"  🔗 Clicking into requisition {row_data.get('req_id', 'unknown')}...")
                            detail_data = self._scrape_requisition_details(driver, row_info['linkHref'])

                        # Merge table data with detail data
                        complete_requisition = {
                            **row_data,
                            **detail_data,
                            '_headers': headers,
                            '_source': 'ilabor360_v2'
                        }

                        # Log first one
                        if items_scraped == 0:
                            print("\n" + "="*80)
                            print("📊 FIRST COMPLETE REQUISITION:")
                            print("="*80)
                            print(json.dumps(complete_requisition, indent=2, default=str))
                            print("="*80 + "\n")

                        requisitions.append(complete_requisition)
                        items_scraped += 1

                        if items_scraped % 5 == 0:
                            print(f"  ... extracted {items_scraped} complete requisitions")

                    except Exception as e:
                        logger.error(f'Error processing requisition: {e}', exc_info=True)
                        continue

                # Try next page
                if items_scraped >= max_items:
                    break

                has_next = False
                next_selectors = [
                    'button[aria-label*="Next"]',
                    'a[aria-label*="Next"]',
                    '.pagination .next:not(.disabled) a',
                    'button.next:not(:disabled)'
                ]

                for selector in next_selectors:
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

            print(f"\n✅ Successfully extracted {len(requisitions)} complete requisitions")
            print("="*80 + "\n")

            return {
                'success': True,
                'requisitions': requisitions,
                'count': len(requisitions)
            }

        except Exception as e:
            logger.error(f'Scrape error: {str(e)}', exc_info=True)
            print(f"\n❌ Error: {str(e)}\n")
            return {
                'success': False,
                'error': str(e),
                'requisitions': []
            }

    def _scrape_requisition_details(self, driver, link_href: str) -> Dict:
        """
        Click into requisition detail page and extract ALL information
        including job description, requirements, etc.
        """
        original_window = driver.current_window_handle
        detail_data = {}

        try:
            # Navigate to detail page
            if link_href.startswith('http'):
                driver.get(link_href)
            else:
                base_url = '/'.join(driver.current_url.split('/')[:3])
                driver.get(f"{base_url}{link_href}")

            time.sleep(3)

            # Extract ALL text content from the detail page
            extract_script = """
            function extractDetails() {
                const data = {};

                // Get ALL text from the page
                data.fullPageText = document.body.innerText;

                // Try to find job description
                const descSelectors = [
                    '[class*="description"]',
                    '[id*="description"]',
                    '[class*="job-desc"]',
                    '[class*="details"]',
                    'textarea',
                    '.form-control'
                ];

                let description = '';
                for (const selector of descSelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.innerText && el.innerText.length > 50) {
                        description = el.innerText;
                        break;
                    }
                }
                data.jobDescription = description;

                // Extract all form fields
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    const label = input.labels && input.labels[0] ? input.labels[0].innerText : '';
                    const name = input.name || input.id || label;
                    const value = input.value || input.innerText;
                    if (name && value) {
                        data[name] = value;
                    }
                });

                // Extract all labeled data
                const labels = document.querySelectorAll('label, dt, .label, [class*="label"]');
                labels.forEach(label => {
                    const text = label.innerText;
                    let value = '';

                    // Try to find associated value
                    if (label.nextElementSibling) {
                        value = label.nextElementSibling.innerText || label.nextElementSibling.value;
                    }

                    if (text && value) {
                        data[text.replace(':', '').trim()] = value;
                    }
                });

                return data;
            }
            return extractDetails();
            """

            detail_data = driver.execute_script(extract_script)

            # Go back to list
            driver.back()
            time.sleep(2)

            # Normalize keys
            normalized_detail = {}
            for key, value in detail_data.items():
                normalized_key = self._normalize_key(key)
                normalized_detail[normalized_key] = value

            return normalized_detail

        except Exception as e:
            logger.warning(f'Error scraping detail page: {e}')
            try:
                driver.back()
                time.sleep(1)
            except:
                pass
            return detail_data

    def _normalize_key(self, key: str) -> str:
        """Normalize key to snake_case"""
        return key.lower().replace(' ', '_').replace('#', 'num').replace('&', 'and').replace('-', '_').replace('.', '').replace(':', '').replace('/', '_')

    def _safe_get_text(self, cells: List, index: int) -> str:
        """Safely get text from cell"""
        try:
            if index < len(cells):
                return cells[index].text.strip()
        except:
            pass
        return ''

    def close_session(self, session_id: str):
        """Close browser session"""
        if session_id in self.sessions:
            try:
                self.sessions[session_id]['driver'].quit()
                del self.sessions[session_id]
                logger.info(f'Session {session_id} closed')
            except Exception as e:
                logger.error(f'Error closing session: {str(e)}')

    def cleanup_old_sessions(self, max_age_seconds: int = 3600):
        """Close sessions older than max_age_seconds"""
        current_time = time.time()
        to_remove = []

        for session_id, session in self.sessions.items():
            if current_time - session['created_at'] > max_age_seconds:
                to_remove.append(session_id)

        for session_id in to_remove:
            self.close_session(session_id)
