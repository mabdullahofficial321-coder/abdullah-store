/* === API Helper === */
const API_BASE = '/api';

function getToken() { return localStorage.getItem('token'); }

async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    } catch (err) {
        throw err;
    }
}

const api = {
    get: (endpoint) => apiRequest(endpoint),
    post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

/* === Toast Notifications === */
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

/* === Helpers === */
function formatPrice(amount) {
    return '₨' + Number(amount).toLocaleString('en-PK');
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let stars = '★'.repeat(full);
    if (half) stars += '☆';
    stars += '☆'.repeat(5 - Math.ceil(rating));
    return stars;
}

function getDiscount(price, original) {
    if (!original || original <= price) return null;
    return Math.round((1 - price / original) * 100) + '% OFF';
}

function renderProductCard(p, showBadge = true) {
    const discount = getDiscount(p.price, p.original_price);
    return `
    <div class="product-card" id="product-${p.id}">
      <div class="product-image-wrap">
        <a href="/product-detail.html?id=${p.id}">
          <img src="${p.image || 'https://via.placeholder.com/400x300'}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=Product'">
        </a>
        ${discount && showBadge ? `<div class="product-badge">${discount}</div>` : ''}
        <button class="product-wishlist ${isWishlisted(p.id) ? 'active' : ''}" onclick="toggleWishlist(${p.id}, '${p.name.replace(/'/g, "\\'")}', '${p.image}', ${p.price})" title="Wishlist">
          ${isWishlisted(p.id) ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="product-body">
        <div class="product-category">${p.category_name || ''}</div>
        <div class="product-name"><a href="/product-detail.html?id=${p.id}">${p.name}</a></div>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating || 4)}</span>
          <span class="rating-count">(${p.reviews_count || 0})</span>
        </div>
        <div class="product-footer">
          <div class="product-price">
            <span class="price-current">${formatPrice(p.price)}</span>
            ${p.original_price ? `<span class="price-original">${formatPrice(p.original_price)}</span>` : ''}
            ${discount ? `<div class="price-discount">${discount}</div>` : ''}
          </div>
          <button class="btn-add-cart" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
            🛒 Add
          </button>
        </div>
      </div>
    </div>
  `;
}

/* === Wishlist === */
function getWishlist() { return JSON.parse(localStorage.getItem('wishlist') || '[]'); }
function isWishlisted(id) { return getWishlist().some(i => i.id === id); }
function toggleWishlist(id, name, image, price) {
    let wl = getWishlist();
    const idx = wl.findIndex(i => i.id === id);
    if (idx >= 0) { wl.splice(idx, 1); showToast('Removed from wishlist', 'info'); }
    else { wl.push({ id, name, image, price }); showToast('Added to wishlist ❤️', 'success'); }
    localStorage.setItem('wishlist', JSON.stringify(wl));
    // Refresh button
    const btn = document.querySelector(`#product-${id} .product-wishlist`);
    if (btn) {
        btn.classList.toggle('active', idx < 0);
        btn.innerHTML = idx < 0 ? '❤️' : '🤍';
    }
}
