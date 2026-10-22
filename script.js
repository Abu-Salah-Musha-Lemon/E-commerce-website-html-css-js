'use strict';

/**
 * Morrow demo storefront.
 * Product catalog lives here; cart and wishlist are stored in this browser only.
 * No payments, user accounts, order processing, or email submission is performed.
 */
const PRODUCTS = [
  { id: 'arc-lamp', name: 'Arc Table Lamp', category: 'Home', price: 79, originalPrice: 99, rating: 4.9, reviews: 128, image: 'assets/lamp.svg', color: 'sand', badge: 'Bestseller', description: 'Soft, beautiful light meets an elegant silhouette. The little design detail that makes any corner feel like home.' },
  { id: 'studio-headphones', name: 'Studio Wireless Headphones', category: 'Tech', price: 129, originalPrice: 159, rating: 4.8, reviews: 246, image: 'assets/headphones.svg', color: 'mint', badge: 'Popular', description: 'Your soundtrack, uninterrupted. Minimal design and a cushioned fit made for all-day listening.' },
  { id: 'daily-sneakers', name: 'Everyday Canvas Sneakers', category: 'Fashion', price: 92, originalPrice: null, rating: 4.8, reviews: 89, image: 'assets/sneaker.svg', color: 'sand', badge: 'New', description: 'Easygoing style with a comfortable step. Your new go-to for wherever the day takes you.' },
  { id: 'classic-watch', name: 'Minimal Analog Watch', category: 'Accessories', price: 145, originalPrice: 185, rating: 4.9, reviews: 173, image: 'assets/watch.svg', color: 'lilac', badge: 'Sale', description: 'A clean dial, thoughtfully chosen details, and timeless style you can reach for every day.' },
  { id: 'ceramic-vase', name: 'Sculpted Ceramic Vase', category: 'Home', price: 48, originalPrice: null, rating: 4.7, reviews: 62, image: 'assets/vase.svg', color: 'peach', badge: '', description: 'Artful with or without flowers. Its beautifully imperfect texture adds a warm, handmade feeling to any shelf.' },
  { id: 'portable-speaker', name: 'Compact Bluetooth Speaker', category: 'Tech', price: 85, originalPrice: 105, rating: 4.8, reviews: 193, image: 'assets/speaker.svg', color: 'blue', badge: 'Bestseller', description: 'A portable sound companion with room-filling audio and an understated form that looks good anywhere.' },
  { id: 'canvas-tote', name: 'Everyday Canvas Tote', category: 'Fashion', price: 39, originalPrice: null, rating: 4.9, reviews: 114, image: 'assets/tote.svg', color: 'sand', badge: '', description: 'Made for errands, books, and spontaneous plans. A spacious, go-with-everything everyday essential.' },
  { id: 'sunglasses', name: 'Retro Frame Sunglasses', category: 'Accessories', price: 68, originalPrice: 85, rating: 4.7, reviews: 77, image: 'assets/sunglasses.svg', color: 'peach', badge: 'Sale', description: 'A little vintage attitude, a lot of everyday versatility. Add the finishing touch to a sunny-day outfit.' },
  { id: 'accent-chair', name: 'Modern Lounge Chair', category: 'Home', price: 249, originalPrice: null, rating: 4.9, reviews: 58, image: 'assets/chair.svg', color: 'mint', badge: 'New', description: 'A beautiful place to pause. Soft upholstery and gently curved lines designed for quiet moments.' },
  { id: 'instant-camera', name: 'Pocket Instant Camera', category: 'Tech', price: 179, originalPrice: null, rating: 4.8, reviews: 121, image: 'assets/camera.svg', color: 'lilac', badge: '', description: 'Make your favorite memories tangible with a cheerful compact camera built for spontaneous adventures.' },
  { id: 'crossbody-bag', name: 'City Crossbody Bag', category: 'Fashion', price: 89, originalPrice: 112, rating: 4.7, reviews: 96, image: 'assets/bag.svg', color: 'peach', badge: 'Sale', description: 'Just the right amount of space in a pared-back shape. Hands-free style from morning to evening.' },
  { id: 'cotton-cap', name: 'Essential Cotton Cap', category: 'Accessories', price: 34, originalPrice: null, rating: 4.8, reviews: 65, image: 'assets/cap.svg', color: 'blue', badge: '', description: 'An easy finishing touch made from soft cotton. Comfortable, versatile, and ready for every season.' }
];

const SHIPPING_THRESHOLD = 100;
const STORAGE_KEY = 'morrow-storefront-v1';
const money = amount => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'}).format(amount);
const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const findProduct = id => PRODUCTS.find(product => product.id === id);

function readPersistedState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored || typeof stored !== 'object') return {cart:{}, wishlist:[]};
    const cart = {};
    if (stored.cart && typeof stored.cart === 'object') {
      Object.entries(stored.cart).forEach(([id, count]) => {
        if (findProduct(id) && Number.isInteger(count) && count > 0) cart[id] = Math.min(count, 99);
      });
    }
    const wishlist = Array.isArray(stored.wishlist) ? [...new Set(stored.wishlist.filter(id => typeof id === 'string' && findProduct(id)))]:[];
    return {cart, wishlist};
  } catch (_error) {
    return {cart:{}, wishlist:[]};
  }
}

const storedState = readPersistedState();
const state = { cart:storedState.cart, wishlist:storedState.wishlist, category:'All', search:'', sort:'featured', wishlistOnly:false };
let toastTimer;
let lastCartFocus;
let currentQuickProduct = null;
let cartIsOpen = false;

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({cart:state.cart, wishlist:state.wishlist})); }
  catch (_error) { /* The demo continues to work without storage permission. */ }
}

function showToast(message) {
  const toast = $('#toast');
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function getVisibleProducts() {
  const query = state.search.trim().toLowerCase();
  const result = PRODUCTS.filter(product => {
    const matchingCategory = state.category === 'All' || product.category === state.category;
    const matchingWishlist = !state.wishlistOnly || state.wishlist.includes(product.id);
    const matchingSearch = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query);
    return matchingCategory && matchingWishlist && matchingSearch;
  });
  if (state.sort === 'price-asc') result.sort((a,b) => a.price - b.price);
  if (state.sort === 'price-desc') result.sort((a,b) => b.price - a.price);
  if (state.sort === 'rating') result.sort((a,b) => b.rating - a.rating || b.reviews - a.reviews);
  return result;
}

function createProductCard(product) {
  const liked = state.wishlist.includes(product.id);
  return `<article class="product-card" data-product-id="${product.id}">
    <div class="product-media color-${product.color}">
      <img src="${product.image}" width="350" height="350" alt="${product.name}" >
      ${product.badge ? `<span class="product-badge ${product.badge === 'Sale' ? 'sale' : ''}">${product.badge}</span>` : ''}
      <button class="heart-button ${liked ? 'is-active' : ''}" type="button" data-action="wishlist" data-id="${product.id}" aria-label="${liked ? 'Remove' : 'Add'} ${product.name} ${liked ? 'from' : 'to'} wishlist" aria-pressed="${liked}">${icon('heart')}</button>
      <div class="product-actions"><button type="button" class="product-add" data-action="add" data-id="${product.id}">Add to bag ${icon('plus')}</button><button type="button" class="product-quick" data-action="quick" data-id="${product.id}" aria-label="View details for ${product.name}">${icon('search')}</button></div>
    </div>
    <div class="product-info"><div class="product-category">${product.category}</div><h3 class="product-name"><button type="button" data-action="quick" data-id="${product.id}">${product.name}</button></h3>
      <div class="product-rating" aria-label="${product.rating} out of 5 stars">★★★★★ <small>(${product.reviews})</small></div>
      <div class="product-price">${money(product.price)} ${product.originalPrice ? `<span class="old-price">${money(product.originalPrice)}</span>` : ''}</div>
    </div>
  </article>`;
}

function renderProducts() {
  const products = getVisibleProducts();
  $('#productGrid').innerHTML = products.map(createProductCard).join('');
  $('#emptyState').hidden = products.length > 0;
  $('#resultCount').textContent = `${products.length} ${products.length === 1 ? 'product' : 'products'}`;
  $$('.filter-tab').forEach(button => {
    const active = button.dataset.filter === state.category;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#wishlistToggle').setAttribute('aria-pressed', String(state.wishlistOnly));
  $('#wishlistToggle').classList.toggle('wishlist-selected', state.wishlistOnly);
}

function selectCategory(category) {
  state.category = category;
  state.wishlistOnly = false;
  state.search = '';
  $('#searchInput').value = '';
  renderProducts();
  $('#products').scrollIntoView({behavior:'smooth', block:'start'});
}

function updateCounts() {
  const cartCount = Object.values(state.cart).reduce((sum, qty) => sum + qty, 0);
  const wishlistCount = state.wishlist.length;
  $('#cartCount').textContent = cartCount;
  $('#cartCount').hidden = cartCount === 0;
  $('#wishlistCount').textContent = wishlistCount;
  $('#wishlistCount').hidden = wishlistCount === 0;
  $('#drawerCount').textContent = `(${cartCount})`;
  $('#cartToggle').setAttribute('aria-label', `Open shopping bag, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`);
}

function changeQuantity(id, change) {
  const product = findProduct(id);
  if (!product) return;
  const current = state.cart[id] || 0;
  const next = Math.min(99, Math.max(0, current + change));
  if (next === 0) delete state.cart[id]; else state.cart[id] = next;
  persist(); updateCounts(); renderCart();
  if (change > 0 && current === 0) showToast(`${product.name} added to your bag`);
}

function toggleWishlist(id) {
  const product = findProduct(id);
  if (!product) return;
  const exists = state.wishlist.includes(id);
  if (exists) state.wishlist = state.wishlist.filter(item => item !== id);
  else state.wishlist.push(id);
  persist(); updateCounts(); renderProducts();
  showToast(`${product.name} ${exists ? 'removed from' : 'added to'} wishlist`);
}

function renderCart() {
  const lines = PRODUCTS.filter(product => state.cart[product.id]);
  const subtotal = lines.reduce((sum,product) => sum + product.price * state.cart[product.id], 0);
  const container = $('#cartItems');
  if (lines.length === 0) {
    container.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon">${icon('bag')}</div><h3>It's a little quiet here.</h3><p>Your bag is empty. Let's find something you love.</p><button type="button" class="button button-dark" data-action="continue">Explore products ${icon('arrow')}</button></div>`;
  } else {
    container.innerHTML = lines.map(product => `<div class="cart-line"><img src="${product.image}" alt="${product.name}" width="85" height="93"><div class="cart-line-main"><strong>${product.name}</strong><div class="cart-line-meta">${product.category}</div><div class="cart-line-cost">${money(product.price * state.cart[product.id])}</div><div class="cart-line-bottom"><div class="quantity-stepper" aria-label="Quantity for ${product.name}"><button type="button" data-action="decrease" data-id="${product.id}" aria-label="Decrease ${product.name} quantity">${icon('minus')}</button><span>${state.cart[product.id]}</span><button type="button" data-action="increase" data-id="${product.id}" aria-label="Increase ${product.name} quantity" ${state.cart[product.id] >= 99 ? 'disabled' : ''}>${icon('plus')}</button></div><button class="cart-remove" type="button" data-action="remove" data-id="${product.id}" aria-label="Remove ${product.name}">${icon('trash')}</button></div></div></div>`).join('');
  }
  $('#cartSubtotal').textContent = money(subtotal);
  $('#checkoutButton').disabled = lines.length === 0;
  $('#shippingInfo').innerHTML = subtotal >= SHIPPING_THRESHOLD ? `${icon('check')} <span>You've unlocked free shipping!</span>` : `${icon('truck')} <span>${money(SHIPPING_THRESHOLD - subtotal)} away from free shipping</span>`;
}

function openCart() {
  if (cartIsOpen) return;
  cartIsOpen = true;
  lastCartFocus = document.activeElement;
  renderCart();
  const drawer = $('#cartDrawer');
  drawer.inert = false;
  drawer.setAttribute('aria-hidden','false');
  $('#drawerScrim').hidden = false;
  document.body.classList.add('no-scroll');
  requestAnimationFrame(() => {drawer.classList.add('is-open');$('#drawerScrim').classList.add('is-visible');});
  $('#closeCart').focus();
}
function closeCart() {
  if (!cartIsOpen) return;
  cartIsOpen = false;
  const drawer = $('#cartDrawer');
  drawer.classList.remove('is-open');
  $('#drawerScrim').classList.remove('is-visible');
  if (lastCartFocus && lastCartFocus.isConnected) lastCartFocus.focus();
  drawer.inert = true;
  drawer.setAttribute('aria-hidden','true');
  document.body.classList.remove('no-scroll');
  setTimeout(() => {if (!cartIsOpen) $('#drawerScrim').hidden = true;}, 300);
}

function showQuickView(id) {
  const product = findProduct(id);
  if (!product) return;
  currentQuickProduct = product;
  $('#quickImage').innerHTML = `<img src="${product.image}" alt="${product.name}" width="350" height="350">`;
  $('#quickCategory').textContent = product.category;
  $('#quickViewTitle').textContent = product.name;
  $('#quickRating').innerHTML = `★★★★★ <span>${product.rating} / 5 · ${product.reviews} reviews</span>`;
  $('#quickDescription').textContent = product.description;
  $('#quickPrice').innerHTML = `${money(product.price)} ${product.originalPrice ? `<del>${money(product.originalPrice)}</del>` : ''}`;
  $('#quickView').showModal();
}

function handleGridAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {action, id} = button.dataset;
  if (action === 'add') changeQuantity(id, 1);
  if (action === 'wishlist') toggleWishlist(id);
  if (action === 'quick') showQuickView(id);
}
function handleCartAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const {action, id} = button.dataset;
  if (action === 'increase') changeQuantity(id, 1);
  if (action === 'decrease') changeQuantity(id, -1);
  if (action === 'remove') changeQuantity(id, -(state.cart[id] || 0));
  if (action === 'continue') closeCart();
}

function init() {
  $('#currentYear').textContent = new Date().getFullYear();
  renderProducts(); updateCounts(); renderCart();
  $('#productGrid').addEventListener('click', handleGridAction);
  $('#cartItems').addEventListener('click', handleCartAction);
  $$('.filter-tab').forEach(button => button.addEventListener('click', () => {state.category = button.dataset.filter;state.wishlistOnly = false;renderProducts();}));
  $$('.category-card').forEach(button => button.addEventListener('click', () => selectCategory(button.dataset.category)));
  $$('[data-footer-filter]').forEach(link => link.addEventListener('click', () => selectCategory(link.dataset.footerFilter)));
  $('#viewAllCategories').addEventListener('click', () => selectCategory('All'));
  $('#sortSelect').addEventListener('change', event => {state.sort = event.target.value;renderProducts();});
  $('#searchInput').addEventListener('input', event => {state.search = event.target.value;state.wishlistOnly = false;renderProducts();});
  $('#headerSearch').addEventListener('submit', event => {event.preventDefault();$('#products').scrollIntoView({behavior:'smooth'});});
  $('#resetFilters').addEventListener('click', () => {state.category = 'All';state.search = '';state.wishlistOnly = false;$('#searchInput').value='';renderProducts();});
  $('#wishlistToggle').addEventListener('click', () => {state.wishlistOnly = !state.wishlistOnly;state.category='All';state.search='';$('#searchInput').value='';renderProducts();$('#products').scrollIntoView({behavior:'smooth'});if(state.wishlistOnly && state.wishlist.length===0)showToast('Tap a heart to save your favorite products');});
  $('#cartToggle').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  $('#drawerScrim').addEventListener('click', closeCart);
  $('#continueShopping').addEventListener('click', closeCart);
  $('#checkoutButton').addEventListener('click', () => showToast('Demo store: connect a payment provider and backend to enable checkout.'));
  $('#quickClose').addEventListener('click', () => $('#quickView').close());
  $('#quickAdd').addEventListener('click', () => {if(currentQuickProduct){changeQuantity(currentQuickProduct.id,1);$('#quickView').close();openCart();}});
  $('#quickView').addEventListener('click', event => {if(event.target === $('#quickView'))$('#quickView').close();});
  const mobileNav = $('#mobileNav'), menuButton = $('#menuToggle');
  menuButton.addEventListener('click', () => {const expanded = menuButton.getAttribute('aria-expanded') === 'true';menuButton.setAttribute('aria-expanded',String(!expanded));menuButton.setAttribute('aria-label',expanded?'Open navigation':'Close navigation');mobileNav.hidden = expanded;});
  mobileNav.addEventListener('click', event => {if(event.target.closest('a')){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');}});
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {if(cartIsOpen)closeCart(); if(!mobileNav.hidden){mobileNav.hidden=true;menuButton.setAttribute('aria-expanded','false');}}
    if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName) && !$('#quickView').open && !cartIsOpen) {event.preventDefault();$('#searchInput').focus();}
    if (event.key === 'Tab' && cartIsOpen) {
      const focusables = $$('#cartDrawer button:not(:disabled), #cartDrawer a[href], #cartDrawer input:not(:disabled)');
      const first=focusables[0],last=focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
    }
  });
  $('#newsletterForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = $('#newsletterEmail'), message = $('#newsletterMessage');
    if (!input.value.trim() || !input.validity.valid) {
      message.textContent = 'Enter a valid email address.';
      message.className = 'form-message error'; input.focus(); return;
    }
    message.textContent = 'Demo mode: newsletter signup needs an email-service integration.';
    message.className = 'form-message';
  });
}

document.addEventListener('DOMContentLoaded', init);
