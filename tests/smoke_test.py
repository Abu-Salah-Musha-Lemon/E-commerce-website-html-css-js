"""Basic browser smoke checks. Run: python tests/smoke_test.py (requires playwright)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from base64 import b64encode
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / 'tests' / 'screenshots'



def load_local_page(page, saved=None):
    """Load exact project HTML/CSS/JS without web navigation, which this test sandbox blocks.

    The test runtime's about:blank origin has no localStorage, so a lightweight in-memory
    storage shim is used. In a normal deployed site native localStorage is used.
    """
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    css = (ROOT / 'style.css').read_text(encoding='utf-8')
    js = (ROOT / 'script.js').read_text(encoding='utf-8')
    html = re.sub(r'<link[^>]*href="https://fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>', '', html)
    html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>{css}</style>')
    for file in (ROOT / 'assets').glob('*.svg'):
        uri = 'data:image/svg+xml;base64,'+b64encode(file.read_bytes()).decode()
        html = html.replace('"assets/'+file.name+'"', '"'+uri+'"')
    # Product SVG URLs are JS data, so patch the literal strings inside the test page only.
    for file in (ROOT / 'assets').glob('*.svg'):
        uri = 'data:image/svg+xml;base64,'+b64encode(file.read_bytes()).decode()
        js = js.replace("'assets/"+file.name+"'", "'"+uri+"'")
    html = html.replace('<script src="script.js" defer></script>', '<script>'+js+'</script>')
    page.evaluate("""(initial) => {
        const store = initial ? {'morrow-storefront-v1': initial} : {};
        Object.defineProperty(window, 'localStorage', {configurable: true, value: {
            getItem(key) {return Object.prototype.hasOwnProperty.call(store,key)?store[key]:null},
            setItem(key, value) {store[key]=String(value)},
            removeItem(key) {delete store[key]}
        }});
    }""", saved)
    page.set_content(html, wait_until='domcontentloaded')

def run():
    errors=[]
    with sync_playwright() as pw:
            chromium_path = shutil.which('chromium') or shutil.which('google-chrome')
            launch_args = {'headless': True, 'args': ['--no-sandbox']}
            if chromium_path:
                launch_args['executable_path'] = chromium_path
            browser = pw.chromium.launch(**launch_args)
            desktop = browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1)
            page=desktop.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.set_default_timeout(8000)
            load_local_page(page)
            page.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')")
            page.wait_for_function("[...document.images].every(img=>img.complete && img.naturalWidth > 0)")
            page.locator('.product-card').first.wait_for()
            assert page.locator('.product-card').count() == 12, '12 initial products'
            assert page.locator('#resultCount').inner_text()=='12 products'
            assert page.evaluate("[...document.images].every(img => img.complete && img.naturalWidth > 0)"), 'local SVG images rendered'
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'desktop horizontal scroll overflow'
            SCREENSHOTS.mkdir(exist_ok=True)
            page.screenshot(path=str(SCREENSHOTS/'desktop.png'),full_page=True,animations='disabled')

            # search and reset
            page.locator('#searchInput').fill('headphones')
            assert page.locator('.product-card').count()==1
            assert 'Headphones' in page.locator('.product-name').inner_text()
            page.locator('#resetFilters').count() # no reset while not empty, use empty term
            page.locator('#searchInput').fill('made-up-product-xyz')
            assert page.locator('#emptyState').is_visible()
            page.locator('#resetFilters').click()
            assert page.locator('.product-card').count()==12

            # filters, order
            page.get_by_role('button',name='Tech',exact=True).click()
            assert page.locator('.product-card').count()==3
            page.locator('#sortSelect').select_option('price-asc')
            assert 'Compact Bluetooth Speaker' in page.locator('.product-card').first.inner_text()
            page.get_by_role('button',name='All products').click()
            assert page.locator('.product-card').count()==12

            # add to cart and quantity changes
            page.locator('[data-product-id="portable-speaker"] [data-action="add"]').click()
            assert page.locator('#cartCount').inner_text()=='1'
            page.locator('#cartToggle').click()
            assert page.locator('#cartDrawer').get_attribute('aria-hidden') == 'false'
            assert page.locator('#cartSubtotal').inner_text() == '$85.00' # currently sorted price-asc
            page.locator('#cartItems [data-action="increase"]').click()
            assert page.locator('#cartSubtotal').inner_text() == '$170.00'
            assert 'unlocked free shipping' in page.locator('#shippingInfo').inner_text()
            page.keyboard.press('Escape')
            assert page.locator('#cartDrawer').get_attribute('aria-hidden') == 'true'
            saved = page.evaluate("localStorage.getItem('morrow-storefront-v1')")
            another = desktop.new_page()
            another.on('pageerror', lambda error: errors.append(str(error)))
            load_local_page(another, saved)
            assert another.locator('#cartCount').inner_text()=='2', 'cart persistence'
            page.close()
            page = another
            page.locator('#cartToggle').click()
            page.locator('#cartItems [data-action="remove"]').click()
            assert page.locator('#cartSubtotal').inner_text()=='$0.00'
            assert page.locator('#checkoutButton').is_disabled()
            page.locator('#closeCart').click()

            # wishlists and quick view
            first=page.locator('.product-card').first
            first.locator('[data-action="wishlist"]').click()
            assert page.locator('#wishlistCount').inner_text()=='1'
            page.locator('#wishlistToggle').click()
            assert page.locator('.product-card').count()==1
            page.locator('#wishlistToggle').click()
            page.locator('.product-card').first.locator('[data-action="quick"]').first.click()
            assert page.locator('#quickView').evaluate('(d)=>d.open')
            page.locator('#quickAdd').click()
            assert page.locator('#cartDrawer').get_attribute('aria-hidden')=='false'
            page.locator('#continueShopping').click()

            # newsletter should state demo limitation; must not fake signup
            page.locator('#newsletterEmail').fill('abc')
            page.locator('#newsletterForm button').click()
            assert 'valid email' in page.locator('#newsletterMessage').inner_text()
            page.locator('#newsletterEmail').fill('person@example.com')
            page.locator('#newsletterForm button').click()
            assert 'Demo mode' in page.locator('#newsletterMessage').inner_text()

            # mobile sanity, open nav and category navigation
            mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
            mobile_page=mobile.new_page()
            mobile_page.on('pageerror',lambda error:errors.append(str(error)))
            load_local_page(mobile_page)
            mobile_page.locator('.product-card').first.wait_for()
            assert mobile_page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), 'mobile horizontal overflow'
            assert mobile_page.locator('.product-card').count()==12
            mobile_page.locator('#menuToggle').click()
            assert mobile_page.locator('#mobileNav').is_visible()
            mobile_page.locator('#mobileNav').get_by_text('Categories').click()
            assert not mobile_page.locator('#mobileNav').is_visible()
            mobile_page.screenshot(path=str(SCREENSHOTS/'mobile.png'),full_page=True,animations='disabled')
            mobile_page.locator('[data-category="Home"]').click()
            assert mobile_page.locator('.product-card').count()==3
            # Verify narrow phones and tablets do not get unwanted horizontal scrolling.
            for width in (320, 375, 768, 1024):
                responsive = browser.new_page(viewport={'width':width,'height':760})
                responsive.set_default_timeout(8000)
                load_local_page(responsive)
                assert responsive.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), f'overflow at {width}px'
                assert responsive.locator('.product-card').count()==12
                responsive.close()
            assert not errors, f'JS runtime errors: {errors}'
            browser.close()
    print('PASS: catalog, assets, filtering, sorting, search, empty state, cart, quantity, shipping, persistence, wishlist, quick view, demo messaging, responsive nav, overflow, console errors')
    print('Screenshots:', SCREENSHOTS)
if __name__=='__main__': run()
