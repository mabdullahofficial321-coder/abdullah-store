/* === Cart Management === */

function getLocalCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveLocalCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

function getCartCount() { return getLocalCart().reduce((sum, i) => sum + i.quantity, 0); }

function updateCartBadge() {
    const badge = document.querySelector('.cart-count');
    const count = getCartCount();
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

async function addToCart(productId, name, price, image) {
    if (isLoggedIn()) {
        try {
            await api.post('/cart', { product_id: productId, quantity: 1 });
            showToast(`"${name}" added to cart! 🛒`, 'success');
            await syncCartFromServer();
        } catch (err) {
            showToast(err.message || 'Failed to add to cart', 'error');
        }
    } else {
        // Local cart for guest users
        let cart = getLocalCart();
        const idx = cart.findIndex(i => i.product_id === productId);
        if (idx >= 0) cart[idx].quantity++;
        else cart.push({ product_id: productId, name, price, image, quantity: 1, id: Date.now() });
        saveLocalCart(cart);
        updateCartBadge();
        showToast(`"${name}" added to cart! 🛒`, 'success');
    }
}

async function syncCartFromServer() {
    if (!isLoggedIn()) { updateCartBadge(); return; }
    try {
        const items = await api.get('/cart');
        saveLocalCart(items);
        updateCartBadge();
    } catch { updateCartBadge(); }
}

async function mergeGuestCart() {
    if (!isLoggedIn()) return;
    const localCart = getLocalCart();
    if (!localCart.length) return;
    for (const item of localCart) {
        try {
            await api.post('/cart', { product_id: item.product_id, quantity: item.quantity });
        } catch { }
    }
    await syncCartFromServer();
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
    syncCartFromServer();
});
