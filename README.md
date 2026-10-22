# Morrow — Modern E-commerce Storefront

A polished, responsive, **plain HTML + CSS + JavaScript** shopping storefront. This is a redesigned and repaired version of the uploaded `.Store` sample. The original files are preserved under `legacy-original/` for comparison; the new working website is at the project root.

![Desktop screenshot](tests/screenshots/desktop.png)

## Quick start

### Option A: open directly

Double-click `index.html` in your browser. Since all product artwork is bundled locally and there is no build step, the UI works without a development server. Some browser privacy settings may restrict localStorage for `file://` pages; in that case the cart still works until you close or reload the page.

### Option B: use a local server (recommended)

**Python:**

```bash
cd E-commerce-website-html-css-js-main
python -m http.server 5500
```

Browse to `http://localhost:5500`.

**VS Code:** Open the project folder, install the **Live Server** extension, and choose **Open with Live Server** on `index.html`.

**GitHub Pages:** Upload the root files and `assets/` folder into a GitHub repository, then enable **Settings → Pages → Deploy from a branch**. The website uses relative file paths and does not require a server runtime.

## What's included

- Professional desktop, tablet, and mobile layouts; modern editorial hero and promotional sections.
- **12 editable demo products** across Home, Tech, Fashion, and Accessories.
- Search across name, category, and description (type in the search bar, or press `/` to focus it).
- Category filters and sorting by featured, price, and rating.
- Working wishlist toggle, count, and wishlist-only view.
- Shopping bag drawer with add, remove, quantity controls, subtotal, and free-shipping progress.
- Cart and wishlist saved in browser **localStorage**, with invalid stored entries safely discarded.
- Product quick-view dialog with an Add to Bag action.
- Mobile navigation, accessible button labels, Escape-to-close, focus handling, and reduced-motion CSS.
- Bundled editable SVG illustrations, so no external image hosting is needed.
- Automated Playwright smoke checks covering core UI flows and viewport sizes.

## Project structure

```text
E-commerce-website-html-css-js-main/
├── index.html                  Main storefront HTML, semantic sections and dialogs
├── style.css                   Design system, styling, and responsive breakpoints
├── script.js                   Product catalog, app state, UI behavior, browser storage
├── assets/                     14 local, editable SVG illustrations
│   ├── hero-room.svg           Main banner illustration
│   ├── story-scene.svg         Editorial section illustration
│   ├── lamp.svg ...            Product / category illustrations
├── docs/
│   └── CHANGES.md              Repair notes, design changes, limitations
├── tests/
│   ├── smoke_test.py           Browser checks using Playwright for Python
│   └── screenshots/           Example desktop and mobile preview screenshots
├── legacy-original/           Original uploaded 2023 website (not in use)
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── README.md
└── README.md                   This guide
```

## Edit products, prices, and images

1. Open `script.js`.
2. At the top, edit the `PRODUCTS` array. Each product has a unique `id`, `name`, `category`, `price`, optional `originalPrice`, `rating`, `reviews`, `image`, `color`, `badge`, and `description`.
3. Add or replace an illustration inside `assets/` and update the corresponding `image` path.
4. Keep `id` unique and **stable**: browser carts and wishlists refer to product IDs.
5. Supported category names are `Home`, `Tech`, `Fashion`, and `Accessories`. To introduce another category, update the filter buttons and category tiles in `index.html` as well.
6. Supported card colors include `sand`, `mint`, `peach`, `lilac`, and `blue` (editable in `style.css`).

Sample product:

```js
{
  id: 'my-new-product',
  name: 'My New Product',
  category: 'Home',
  price: 49,
  originalPrice: 69,
  rating: 4.8,
  reviews: 20,
  image: 'assets/my-new-product.svg',
  color: 'sand',
  badge: 'New',
  description: 'A helpful description of this product.'
}
```

## Change the design

- **Branding and content:** edit the hero, menus, story, footer, and text in `index.html`.
- **Colors:** change the `:root` CSS custom properties near the start of `style.css` (`--ink`, `--accent`, `--paper`, `--border`, etc.).
- **Typography:** currently uses web fonts *Manrope* and *DM Sans*, with local system-font fallbacks. The site remains usable without network access.
- **Layout:** responsive breakpoints are at `1160px`, `900px`, `650px`, and `380px`.
- **Currency:** change the `money` formatter at the top of `script.js`. Changing the symbol does **not** convert your prices or taxes.
- **Shipping threshold:** change `SHIPPING_THRESHOLD` in `script.js`.

## Tests

Run the lightweight syntax check:

```bash
node --check script.js
```

For browser smoke tests, install [Playwright for Python](https://playwright.dev/python/docs/intro) and its Chromium browser:

```bash
python -m pip install playwright
python -m playwright install chromium
python tests/smoke_test.py
```

The smoke-test harness embeds the actual HTML, CSS, JavaScript, and SVG artwork in a browser page because some restricted environments block all test navigation. It uses a small in-memory localStorage stand-in solely in tests; the actual deployed site uses native localStorage.

Tests cover catalog rendering, image loading, live search, no-results handling, filters, sorting, cart subtotal, quantity changes, free-shipping progress, state rehydration, wishlist, quick view, newsletter validation, mobile navigation, and horizontal overflow checks at **320, 375, 390, 768, 1024, and 1440 px**. Previews are written into `tests/screenshots/`.

## Important: prototype vs. production

**This is a front-end demo, not a live commerce backend.** It does **not** charge customers, accept orders, store customer accounts, process payments, or send email subscriptions. The checkout button explicitly explains the missing integration, and the newsletter form does not pretend to sign anyone up.

All products, prices, ratings, review counts, store policies, shipping offers, and brand claims are **illustrative placeholders**. Replace them with your own verified inventory and business policies before launching a real shop. Also replace `hello@example.com` in `index.html` with your real support address.

For production you would typically add:

1. A catalog/inventory API and persistent order database.
2. Server-side validation of product prices, quantities, discounts, shipping, and tax.
3. A hosted payment flow from your chosen provider (do **not** process card numbers in client JavaScript).
4. Authentication, order status, addresses, transactional emails, and customer support.
5. Server-side newsletter integration with explicit consent and an unsubscribe link.
6. Real product photos, legal policies, fulfillment rules, and verified testimonials.

## Notes about original project

The original version's navigation relied on copying large chunks of markup into off-canvas containers, had malformed CSS, repeated placeholder products, partial mobile interactions, and no cart state management. This rewrite uses a product data array, consistent CSS styles, and small event handlers. See `docs/CHANGES.md` for details.
