"""
Debug script to test scraper directly
"""
import sys
sys.path.insert(0, 'ilabor360-scraper')

from scraper_fast import FastILabor360Scraper

print("🧪 Testing Scraper Directly\n")
print("="*60)

scraper = FastILabor360Scraper()

# Test login
print("\n📝 Step 1: Login (manual)")
print("   Username: Matt.s@techgene.com")
print("   URL: https://vendor.ilabor360.com/login")

result = scraper.login(
    username='Matt.s@techgene.com',
    password='Techgene@101',  # You'll need to manually login anyway
    login_url='https://vendor.ilabor360.com/login'
)

if result['success']:
    print(f"✅ Login successful! Session ID: {result['sessionId']}")
    
    session_id = result['sessionId']
    
    # Test scraping
    print("\n🔍 Step 2: Scraping requisitions...")
    scrape_result = scraper.scrape_requisitions(
        session_id=session_id,
        max_items=100,
        status_filter='all'
    )
    
    print(f"\n📊 Results:")
    print(f"   Success: {scrape_result['success']}")
    print(f"   Count: {scrape_result['count']}")
    print(f"   Method: {scrape_result.get('method', 'unknown')}")
    
    if scrape_result['count'] > 0:
        print(f"\n✅ First job:")
        import json
        print(json.dumps(scrape_result['requisitions'][0], indent=2, default=str)[:500])
    else:
        print(f"\n❌ No jobs found!")
        print(f"   Error: {scrape_result.get('error', 'No error message')}")
    
    # Close session
    scraper.close_session(session_id)
    print("\n✅ Session closed")
else:
    print(f"❌ Login failed: {result.get('error', 'Unknown error')}")

print("\n" + "="*60)
