"""
Selenium-based scraper for iLabor360
Handles login, navigation, and data extraction
"""

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
import uuid
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class ILabor360Scraper:
    def __init__(self):
        self.sessions = {}  # Store active browser sessions
        self.default_timeout = 30
        
    def _create_driver(self, headless=True):
        """Create a new undetected Chrome WebDriver instance"""
        options = uc.ChromeOptions()

        # Basic options
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        if not headless:
            # For manual login - maximize window and make it prominent
            options.add_argument('--start-maximized')
        else:
            options.add_argument('--window-size=1920,1080')

        # Create undetected chromedriver instance
        # This automatically handles anti-detection measures
        driver = uc.Chrome(
            options=options,
            headless=headless,
            use_subprocess=False,
            version_main=None  # Auto-detect Chrome version
        )

        return driver
    
    def login(self, username: str, password: str, login_url: str) -> Dict:
        """
        Login to iLabor360

        MANUAL LOGIN MODE:
        - Opens a visible browser window
        - Fills in username and password
        - YOU MUST MANUALLY CLICK THE LOGIN BUTTON
        - Once logged in, the scraper will detect it and continue automatically

        Returns:
            {
                'success': bool,
                'sessionId': str,
                'dashboardUrl': str,
                'error': str (if failed)
            }
        """
        driver = None
        try:
            logger.info(f'Creating browser session for MANUAL login')
            logger.info('***** MANUAL LOGIN MODE ENABLED *****')
            logger.info('A browser window will open. Please complete the login manually.')
            
            print("\n" + "="*80)
            print("🪟 OPENING CHROME BROWSER WINDOW FOR MANUAL LOGIN")
            print("="*80)
            print("Please look for a Chrome window that should open now...")
            print("="*80 + "\n")
            
            driver = self._create_driver(headless=False)  # Non-headless mode
            
            # Set window title for easy identification
            driver.execute_script("document.title = '🔐 iLabor360 Manual Login - DO NOT CLOSE';")
            
            # Navigate to login page
            logger.info(f'Navigating to: {login_url}')
            driver.get(login_url)
            
            # Wait for page to load
            time.sleep(3)
            
            # Try to find username field (multiple possible selectors)
            username_field = None
            username_selectors = [
                (By.ID, 'username'),
                (By.ID, 'email'),
                (By.NAME, 'username'),
                (By.NAME, 'email'),
                (By.CSS_SELECTOR, 'input[type="text"]'),
                (By.CSS_SELECTOR, 'input[type="email"]'),
                (By.XPATH, '//input[@placeholder="Username" or @placeholder="Email"]')
            ]
            
            for by, selector in username_selectors:
                try:
                    username_field = WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((by, selector))
                    )
                    logger.info(f'Found username field using: {by}={selector}')
                    break
                except TimeoutException:
                    continue
            
            if not username_field:
                raise Exception('Could not find username field. Page may have loaded incorrectly.')
            
            # Try to find password field
            password_field = None
            password_selectors = [
                (By.ID, 'password'),
                (By.NAME, 'password'),
                (By.CSS_SELECTOR, 'input[type="password"]'),
                (By.XPATH, '//input[@placeholder="Password"]')
            ]
            
            for by, selector in password_selectors:
                try:
                    password_field = driver.find_element(by, selector)
                    logger.info(f'Found password field using: {by}={selector}')
                    break
                except NoSuchElementException:
                    continue
            
            if not password_field:
                raise Exception('Could not find password field')
            
            # Pre-fill credentials for user convenience
            logger.info('Pre-filling credentials...')
            try:
                # Pre-fill username using JavaScript (more reliable)
                driver.execute_script("arguments[0].value = arguments[1];", username_field, username)
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", username_field)
                logger.info(f'Username pre-filled: {username}')
                time.sleep(0.5)

                # Pre-fill password using JavaScript
                driver.execute_script("arguments[0].value = arguments[1];", password_field, password)
                driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", password_field)
                logger.info('Password pre-filled')
                time.sleep(0.5)
            except Exception as e:
                logger.warning(f'Could not pre-fill credentials: {e}')
                # Continue anyway - user can fill manually

            # ***** MANUAL LOGIN INTERVENTION *****
            print("\n" + "="*80)
            print("⏳ WAITING FOR YOU TO LOGIN MANUALLY IN THE BROWSER WINDOW")
            print("="*80)
            logger.info('=' * 80)
            logger.info('WAITING FOR MANUAL LOGIN')
            logger.info('=' * 80)
            logger.info('INSTRUCTIONS:')
            logger.info('1. A browser window should now be open with iLabor360 login page')
            logger.info('2. Username and password have been pre-filled')
            logger.info('3. Please click the LOGIN button manually')
            logger.info('4. The scraper will automatically detect when you are logged in')
            logger.info('5. Waiting up to 5 minutes for you to complete login...')
            logger.info('=' * 80)
            print("👉 CLICK THE LOGIN BUTTON IN THE CHROME WINDOW NOW!")
            print("="*80 + "\n")

            # Wait for manual login - check every 2 seconds for up to 5 minutes
            max_wait_time = 300  # 5 minutes
            check_interval = 2  # 2 seconds
            elapsed_time = 0

            while elapsed_time < max_wait_time:
                time.sleep(check_interval)
                elapsed_time += check_interval

                current_url = driver.current_url
                logger.info(f'Checking login status... ({elapsed_time}s elapsed) Current URL: {current_url}')

                # Check if we've navigated away from login/logout page
                if 'login' not in current_url.lower() and 'logout' not in current_url.lower():
                    logger.info('✓ Login detected! URL changed from login page.')
                    # Give it a moment to fully load
                    time.sleep(3)
                    break

                # Also check for dashboard indicators
                try:
                    # Look for common dashboard elements
                    dashboard_indicators = [
                        (By.LINK_TEXT, 'Requisitions'),
                        (By.PARTIAL_LINK_TEXT, 'Requisition'),
                        (By.XPATH, '//a[contains(text(), "Dashboard")]'),
                        (By.CSS_SELECTOR, 'a[href*="requisition"]'),
                        (By.CSS_SELECTOR, 'nav, .navbar, .sidebar')
                    ]

                    for by, selector in dashboard_indicators:
                        try:
                            element = driver.find_element(by, selector)
                            if element.is_displayed():
                                logger.info(f'✓ Login detected! Found dashboard element: {selector}')
                                time.sleep(2)
                                elapsed_time = max_wait_time  # Exit loop
                                break
                        except:
                            continue
                except:
                    pass

            # Check final status
            current_url = driver.current_url
            logger.info(f'Final URL after wait: {current_url}')

            # Take screenshot for verification
            try:
                screenshot_path = f'login_success_{int(time.time())}.png'
                driver.save_screenshot(screenshot_path)
                logger.info(f'Saved screenshot to: {screenshot_path}')
            except:
                pass

            # Check if login was successful
            if 'login' in current_url.lower() or 'logout' in current_url.lower():
                logger.error('Login appears to have failed - still on login/logout page')
                print("\n" + "="*80)
                print("❌ LOGIN TIMEOUT OR FAILED")
                print("="*80)
                print("You either didn't click login or the credentials are incorrect.")
                print("Please try again and make sure to:")
                print("1. Click the LOGIN button in the browser")
                print("2. Check your username and password are correct")
                print("3. Complete any CAPTCHA if present")
                print("="*80 + "\n")
                driver.quit()
                return {
                    'success': False,
                    'error': 'Manual login timeout or failed. Please try again and click the LOGIN button.'
                }
            
            # Login successful - create session
            session_id = str(uuid.uuid4())
            self.sessions[session_id] = {
                'driver': driver,
                'created_at': time.time(),
                'username': username
            }
            
            print("\n" + "="*80)
            print("✅ LOGIN SUCCESSFUL!")
            print("="*80)
            print(f"Session ID: {session_id}")
            print("The browser window will remain open for data scraping.")
            print("="*80 + "\n")
            
            logger.info(f'Login successful! Session ID: {session_id}')
            
            return {
                'success': True,
                'sessionId': session_id,
                'dashboardUrl': current_url
            }
            
        except Exception as e:
            logger.error(f'Login error: {str(e)}', exc_info=True)
            if driver:
                driver.quit()
            return {
                'success': False,
                'error': str(e)
            }
    
    def scrape_requisitions(self, session_id: str, max_items: int = 1000, status_filter: str = 'all') -> Dict:
        """
        Scrape ALL requisitions from iLabor360

        Args:
            session_id: Active session ID from login
            max_items: Maximum number of requisitions to scrape (default: 1000 - gets ALL)
            status_filter: Filter by status ('open', 'filled', 'closed', 'all')

        Returns:
            {
                'success': bool,
                'requisitions': List[Dict],
                'error': str (if failed)
            }
        """
        try:
            if session_id not in self.sessions:
                return {
                    'success': False,
                    'error': 'Invalid session ID. Please login first.'
                }

            driver = self.sessions[session_id]['driver']
            requisitions = []

            print("\n" + "="*80)
            print("🔍 SCRAPING REQUISITIONS FROM ILABOR360")
            print("="*80)

            logger.info('Navigating to requisitions page')

            # Try to find and click Requisitions link
            requisitions_link = None
            link_selectors = [
                (By.LINK_TEXT, 'Requisitions'),
                (By.PARTIAL_LINK_TEXT, 'Requisition'),
                (By.XPATH, '//a[contains(text(), "Requisition")]'),
                (By.CSS_SELECTOR, 'a[href*="requisition"]'),
                (By.CSS_SELECTOR, 'a[href*="req"]')
            ]

            for by, selector in link_selectors:
                try:
                    requisitions_link = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((by, selector))
                    )
                    logger.info(f'✓ Found requisitions link using: {by}={selector}')
                    print(f"✓ Found Requisitions menu")
                    break
                except TimeoutException:
                    continue

            if requisitions_link:
                requisitions_link.click()
                time.sleep(5)  # Give more time for page to load
            else:
                # Try direct URL
                base_url = driver.current_url.split('/')[0] + '//' + driver.current_url.split('/')[2]
                driver.get(f'{base_url}/requisitions')
                time.sleep(5)

            logger.info(f'Current URL: {driver.current_url}')
            print(f"📍 On page: {driver.current_url}")

            # Take screenshot for debugging
            try:
                screenshot_path = f'requisitions_page_{int(time.time())}.png'
                driver.save_screenshot(screenshot_path)
                logger.info(f'Saved screenshot: {screenshot_path}')
            except:
                pass

            # Wait for table to load
            try:
                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'table, .table, [role="table"], tbody'))
                )
                logger.info('✓ Table loaded successfully')
                print("✓ Requisitions table found")
            except TimeoutException:
                logger.warning('Timeout waiting for table to load')
                print("⚠️  Timeout waiting for table - trying alternative selectors")

            # Get table headers to understand column structure
            headers = []
            header_mapping = {}
            try:
                header_cells = driver.find_elements(By.CSS_SELECTOR, 'table thead th, .table thead th, th')
                headers = [cell.text.strip() for cell in header_cells if cell.text.strip()]

                # Create a mapping of normalized header names to original names
                for idx, header in enumerate(headers):
                    normalized_key = header.lower().replace(' ', '_').replace('#', 'num').replace('&', 'and')
                    header_mapping[idx] = {
                        'original': header,
                        'normalized': normalized_key
                    }

                logger.info(f'Found {len(headers)} table headers: {headers}')
                print(f"📋 Found {len(headers)} columns: {', '.join(headers)}")
                print(f"📋 Column mapping: {header_mapping}")
            except Exception as e:
                logger.warning(f'Could not find table headers: {e}')

            # Extract data from ALL pages
            page_num = 1
            items_scraped = 0

            while items_scraped < max_items:
                logger.info(f'Scraping page {page_num}...')
                print(f"\n📄 Scraping page {page_num}...")

                # Wait a moment for page to load
                time.sleep(2)

                # Find all table rows - try multiple selectors
                rows = []
                row_selectors = [
                    'table tbody tr',
                    '.table tbody tr',
                    'tbody tr',
                    'tr[role="row"]',
                    'tr'
                ]

                for selector in row_selectors:
                    rows = driver.find_elements(By.CSS_SELECTOR, selector)
                    if rows:
                        # Filter out header rows
                        rows = [r for r in rows if r.find_elements(By.TAG_NAME, 'td')]
                        if rows:
                            logger.info(f'Found {len(rows)} rows using selector: {selector}')
                            break

                if not rows:
                    logger.warning('No rows found on page')
                    print("⚠️  No rows found on this page")
                    break

                print(f"✓ Found {len(rows)} requisitions on this page")

                # Use JavaScript to extract ALL table data including hidden columns
                try:
                    # Execute JavaScript to get complete table data
                    table_data_script = """
                    function extractTableData() {
                        const table = document.querySelector('table, .table, [role="table"]');
                        if (!table) return { headers: [], rows: [] };

                        // Get ALL headers including hidden ones
                        const headerCells = table.querySelectorAll('thead th, thead td');
                        const headers = Array.from(headerCells).map(cell => ({
                            text: cell.innerText || cell.textContent || '',
                            visible: window.getComputedStyle(cell).display !== 'none',
                            width: cell.offsetWidth
                        }));

                        // Get ALL rows
                        const bodyRows = table.querySelectorAll('tbody tr');
                        const rows = Array.from(bodyRows).map(row => {
                            const cells = row.querySelectorAll('td');
                            return Array.from(cells).map(cell => ({
                                text: cell.innerText || cell.textContent || '',
                                visible: window.getComputedStyle(cell).display !== 'none',
                                width: cell.offsetWidth,
                                html: cell.innerHTML
                            }));
                        });

                        return { headers, rows };
                    }
                    return extractTableData();
                    """

                    table_data = driver.execute_script(table_data_script)

                    if table_data and table_data.get('rows'):
                        js_headers = [h['text'].strip() for h in table_data['headers']]
                        logger.info(f"JavaScript extracted {len(js_headers)} headers: {js_headers}")
                        print(f"\n📋 JavaScript extracted {len(js_headers)} columns (including hidden):")
                        for idx, h in enumerate(table_data['headers']):
                            visible_text = "✓ VISIBLE" if h['visible'] else "✗ HIDDEN"
                            print(f"  [{idx}] {h['text']} - {visible_text} (width: {h['width']}px)")

                        # Use JavaScript-extracted data
                        for row_data in table_data['rows'][:max_items - items_scraped]:
                            try:
                                requisition = {
                                    '_headers': js_headers,
                                    '_column_count': len(row_data)
                                }

                                # Map each cell to header
                                for idx, cell_data in enumerate(row_data):
                                    cell_text = cell_data['text'].strip()

                                    if idx < len(js_headers):
                                        header = js_headers[idx]
                                        normalized_key = header.lower().replace(' ', '_').replace('#', 'num').replace('&', 'and').replace('-', '_').replace('.', '')
                                        requisition[normalized_key] = cell_text
                                        requisition[f'_visible_{idx}'] = cell_data['visible']
                                        requisition[f'_width_{idx}'] = cell_data['width']
                                    else:
                                        requisition[f'column_{idx}'] = cell_text

                                # Log first requisition with ALL details
                                if items_scraped == 0:
                                    print(f"\n" + "="*80)
                                    print("📊 FIRST REQUISITION - COMPLETE DATA:")
                                    print("="*80)
                                    for idx, header in enumerate(js_headers):
                                        key = header.lower().replace(' ', '_').replace('#', 'num').replace('&', 'and').replace('-', '_').replace('.', '')
                                        value = requisition.get(key, '')
                                        visible = requisition.get(f'_visible_{idx}', True)
                                        width = requisition.get(f'_width_{idx}', 0)
                                        vis_marker = "✓" if visible else "✗"
                                        print(f"  {vis_marker} [{idx:2d}] {header:20s} = {value}")
                                    print("="*80 + "\n")

                                # Apply status filter
                                if status_filter != 'all':
                                    status_value = requisition.get('status') or requisition.get('column_3') or ''
                                    if status_value.lower() != status_filter.lower():
                                        continue

                                requisitions.append(requisition)
                                items_scraped += 1

                                if items_scraped % 10 == 0:
                                    print(f"  ... scraped {items_scraped} requisitions so far")

                            except Exception as e:
                                logger.warning(f'Error parsing JS row: {str(e)}')
                                continue
                    else:
                        logger.warning("No data from JavaScript extraction, falling back to Selenium")
                        raise Exception("No JS data")

                except Exception as js_error:
                    logger.warning(f"JavaScript extraction failed: {js_error}, using Selenium fallback")

                    # Fallback to original Selenium method
                    for row_index, row in enumerate(rows):
                        if items_scraped >= max_items:
                            break

                        try:
                            cells = row.find_elements(By.TAG_NAME, 'td')

                            if len(cells) < 2:
                                continue

                            # Extract ALL data from ALL cells with proper header mapping
                            requisition = {
                                '_headers': headers,
                                '_column_count': len(cells)
                            }

                            # Map each cell to its header name
                            for idx, cell in enumerate(cells):
                                cell_text = self._safe_get_text(cells, idx)

                                # Use header mapping if available
                                if idx in header_mapping:
                                    normalized_key = header_mapping[idx]['normalized']
                                    requisition[normalized_key] = cell_text
                                elif headers and idx < len(headers):
                                    key = headers[idx].lower().replace(' ', '_').replace('#', 'num').replace('&', 'and').replace('-', '_')
                                    requisition[key] = cell_text
                                else:
                                    requisition[f'column_{idx}'] = cell_text

                            requisitions.append(requisition)
                            items_scraped += 1

                        except Exception as e:
                            logger.warning(f'Error parsing row {row_index}: {str(e)}')
                            continue

                # Check for next page - try multiple methods
                has_next_page = False
                next_button_selectors = [
                    'button[aria-label="Next"]',
                    'a[aria-label="Next"]',
                    'button:contains("Next")',
                    'a:contains("Next")',
                    '.pagination .next',
                    '.pagination .next a',
                    'li.next:not(.disabled) a',
                    'button.next:not(:disabled)'
                ]

                for selector in next_button_selectors:
                    try:
                        # Try to find and click next button
                        next_button = driver.find_element(By.CSS_SELECTOR, selector)
                        if next_button.is_enabled() and next_button.is_displayed():
                            logger.info(f'Found next button: {selector}')
                            next_button.click()
                            has_next_page = True
                            time.sleep(3)  # Wait for page to load
                            page_num += 1
                            break
                    except:
                        continue

                if not has_next_page:
                    logger.info('No more pages found')
                    print("✓ Reached last page")
                    break

            print(f"\n✅ Successfully scraped {len(requisitions)} total requisitions")
            print("="*80 + "\n")
            logger.info(f'Successfully scraped {len(requisitions)} requisitions')

            # Print sample data for verification
            if requisitions:
                logger.info(f'Sample requisition: {requisitions[0]}')

            return {
                'success': True,
                'requisitions': requisitions
            }

        except Exception as e:
            logger.error(f'Scrape requisitions error: {str(e)}', exc_info=True)
            print(f"\n❌ Error scraping requisitions: {str(e)}")
            print("="*80 + "\n")
            return {
                'success': False,
                'error': str(e),
                'requisitions': []
            }
    
    def scrape_submissions(self, session_id: str, max_items: int = 100, 
                          date_from: Optional[str] = None, date_to: Optional[str] = None) -> Dict:
        """
        Scrape submissions from iLabor360
        
        Args:
            session_id: Active session ID from login
            max_items: Maximum number of submissions to scrape
            date_from: Filter from date (YYYY-MM-DD)
            date_to: Filter to date (YYYY-MM-DD)
        
        Returns:
            {
                'success': bool,
                'submissions': List[Dict],
                'error': str (if failed)
            }
        """
        try:
            if session_id not in self.sessions:
                return {
                    'success': False,
                    'error': 'Invalid session ID. Please login first.'
                }
            
            driver = self.sessions[session_id]['driver']
            submissions = []
            
            logger.info('Navigating to submissions page')
            
            # Try to find and click Submissions link
            submissions_link = None
            link_selectors = [
                (By.LINK_TEXT, 'Submissions'),
                (By.PARTIAL_LINK_TEXT, 'Submission'),
                (By.XPATH, '//a[contains(text(), "Submission")]'),
                (By.CSS_SELECTOR, 'a[href*="submission"]')
            ]
            
            for by, selector in link_selectors:
                try:
                    submissions_link = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((by, selector))
                    )
                    logger.info(f'Found submissions link using: {by}={selector}')
                    break
                except TimeoutException:
                    continue
            
            if submissions_link:
                submissions_link.click()
                time.sleep(3)
            else:
                # Try direct URL
                base_url = driver.current_url.split('/')[0] + '//' + driver.current_url.split('/')[2]
                driver.get(f'{base_url}/submissions')
                time.sleep(3)
            
            logger.info(f'Current URL: {driver.current_url}')
            
            # Wait for table to load
            try:
                WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'table, .table, [role="table"]'))
                )
                logger.info('Table loaded successfully')
            except TimeoutException:
                logger.warning('Timeout waiting for table to load')
            
            # Extract data from table
            page_num = 1
            items_scraped = 0
            
            while items_scraped < max_items:
                logger.info(f'Scraping submissions page {page_num}')
                
                # Find all table rows
                rows = driver.find_elements(By.CSS_SELECTOR, 'table tbody tr, .table tbody tr')
                
                if not rows:
                    logger.warning('No rows found on page')
                    break
                
                logger.info(f'Found {len(rows)} rows on page {page_num}')
                
                for row in rows:
                    if items_scraped >= max_items:
                        break
                    
                    try:
                        cells = row.find_elements(By.TAG_NAME, 'td')
                        
                        if len(cells) < 8:
                            continue
                        
                        # Extract data from cells
                        submission = {
                            'submissionId': self._safe_get_text(cells, 0),
                            'reqId': self._safe_get_text(cells, 1),
                            'refNumber': self._safe_get_text(cells, 2),
                            'client': self._safe_get_text(cells, 3),
                            'customer': self._safe_get_text(cells, 4),
                            'status': self._safe_get_text(cells, 5),
                            'candidateName': self._safe_get_text(cells, 6),
                            'jobTitle': self._safe_get_text(cells, 7),
                            'location': self._safe_get_text(cells, 8) if len(cells) > 8 else '',
                            'provider': self._safe_get_text(cells, 9) if len(cells) > 9 else '',
                            'providerUser': self._safe_get_text(cells, 10) if len(cells) > 10 else '',
                        }
                        
                        submissions.append(submission)
                        items_scraped += 1
                        
                    except Exception as e:
                        logger.warning(f'Error parsing submission row: {str(e)}')
                        continue
                
                # Check for next page
                if items_scraped >= max_items:
                    break
                
                try:
                    next_button = driver.find_element(By.CSS_SELECTOR, 
                        'button:has-text("Next"), a:has-text("Next"), [aria-label="Next"]')
                    if next_button.is_enabled():
                        next_button.click()
                        time.sleep(2)
                        page_num += 1
                    else:
                        break
                except:
                    logger.info('No more pages')
                    break
            
            logger.info(f'Successfully scraped {len(submissions)} submissions')
            
            return {
                'success': True,
                'submissions': submissions
            }
            
        except Exception as e:
            logger.error(f'Scrape submissions error: {str(e)}', exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'submissions': []
            }
    
    def _safe_get_text(self, cells: List, index: int) -> str:
        """Safely get text from cell"""
        try:
            if index < len(cells):
                return cells[index].text.strip()
        except:
            pass
        return ''
    
    def close_session(self, session_id: str):
        """Close a browser session"""
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
            logger.info(f'Cleaned up old session: {session_id}')
