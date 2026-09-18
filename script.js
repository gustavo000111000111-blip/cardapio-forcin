let database = { roupas: [], acessorios: [], bebidas: [] };
let currentTab = 'roupas';
let cart = [];
let activeProduct = null;
let currentImageIndex = 0;
let selectedSize = null;

// 1. CARREGAR PRODUTOS DO BACKEND
async function loadProductsFromBackend() {
    try {
        const response = await fetch('/api/produtos');
        if (!response.ok) throw new Error('Falha na requisição');

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            database = {
                roupas: data.filter(p => p.categoria === 'roupas').map(formatProduct),
                acessorios: data.filter(p => p.categoria === 'acessorios').map(formatProduct),
                bebidas: data.filter(p => p.categoria === 'bebidas').map(formatProduct)
            };
        }
    } catch (error) {
        console.warn('API indisponível. Verifique a conexão.');
    } finally {
        renderProducts(currentTab);
    }
}

function formatProduct(p) {
    let images = p.imgs;
    if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch { images = [images]; }
    }
    if (!Array.isArray(images) || images.length === 0) {
        images = ['https://via.placeholder.com/600'];
    }

    const valorPreco = p.preco !== undefined ? p.preco : p.price;

    let tamanhosFormatados = [];
    if (p.tamanhos) {
        if (Array.isArray(p.tamanhos)) {
            tamanhosFormatados = p.tamanhos;
        } else if (typeof p.tamanhos === 'string') {
            try { tamanhosFormatados = JSON.parse(p.tamanhos); } catch { tamanhosFormatados = []; }
        }
    }

    return {
        id: p.id,
        name: p.name || p.nome,
        price: typeof valorPreco === 'number' ? `R$ ${valorPreco.toFixed(2).replace('.', ',')}` : valorPreco,
        imgs: images,
        tamanhos: tamanhosFormatados,
        cor: p.cor || ''
    };
}

// 2. RENDERIZAÇÃO
function renderProducts(category) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    const items = database[category] || [];

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#888; padding:30px 0;">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }

    items.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.04}s`;
        card.onclick = () => openProductModal(product);

        const firstImage = (product.imgs && product.imgs.length > 0) ? product.imgs[0] : 'https://via.placeholder.com/600';

        card.innerHTML = `
            <div class="product-image-container">
                <img src="${firstImage}" alt="${product.name}">
            </div>
            <div class="product-info">
                <span class="product-title">${product.name}</span>
                <span class="product-price">${product.price}</span>
                <button class="buy-btn" onclick="event.stopPropagation(); openProductModal(database['${category}'][${index}])">
                    Ver Detalhes
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function switchTab(category, btnElement) {
    if (currentTab === category) return;
    currentTab = category;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btnElement) {
        btnElement.classList.add('active');
    }
    renderProducts(category);
}

// 3. MODAL DE PRODUTO
function openProductModal(product) {
    activeProduct = product;
    currentImageIndex = 0;
    selectedSize = null;

    updateModalImage();

    document.getElementById('modalTitle').innerText = product.name;
    document.getElementById('modalPrice').innerText = product.price;

    // Cor
    const colorEl = document.getElementById('modalColor');
    if (product.cor) {
        colorEl.innerText = `Cor: ${product.cor}`;
        colorEl.style.display = 'block';
    } else {
        colorEl.style.display = 'none';
    }

    // Tamanho
    const sizesContainer = document.getElementById('modalSizesContainer');
    const sizesDiv = document.getElementById('modalSizes');

    if (product.tamanhos && product.tamanhos.length > 0) {
        sizesContainer.style.display = 'block';
        sizesDiv.innerHTML = product.tamanhos.map(size =>
            `<button type="button" class="size-btn" onclick="selectSize('${size}', this)">${size}</button>`
        ).join('');
    } else {
        sizesContainer.style.display = 'none';
        sizesDiv.innerHTML = '';
    }

    document.getElementById('productModal').classList.add('open');
    document.getElementById('productModalOverlay').classList.add('open');
}

function selectSize(size, btnElement) {
    selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
    document.getElementById('productModalOverlay').classList.remove('open');
}

function updateModalImage() {
    if (!activeProduct || !activeProduct.imgs || activeProduct.imgs.length === 0) return;
    const imgEl = document.getElementById('modalImg');
    imgEl.style.opacity = '0.3';
    setTimeout(() => {
        imgEl.src = activeProduct.imgs[currentImageIndex];
        imgEl.style.opacity = '1';
    }, 100);
}

function nextImage() {
    if (!activeProduct || !activeProduct.imgs) return;
    currentImageIndex = (currentImageIndex + 1) % activeProduct.imgs.length;
    updateModalImage();
}

function prevImage() {
    if (!activeProduct || !activeProduct.imgs) return;
    currentImageIndex = (currentImageIndex - 1 + activeProduct.imgs.length) % activeProduct.imgs.length;
    updateModalImage();
}

function addModalProductToCart() {
    if (!activeProduct) return;

    if (activeProduct.tamanhos && activeProduct.tamanhos.length > 0 && !selectedSize) {
        alert("Por favor, selecione um tamanho antes de adicionar à sacola.");
        return;
    }

    const mainImg = activeProduct.imgs[0] || '';
    addToCart(activeProduct.name, activeProduct.price, mainImg, selectedSize, activeProduct.cor);
    closeProductModal();
    openUpsellModal();
}

// 4. ANÚNCIO / UPSELL
function openUpsellModal() {
    document.getElementById('upsellModal').classList.add('open');
    document.getElementById('upsellModalOverlay').classList.add('open');
}

function closeUpsellModal() {
    document.getElementById('upsellModal').classList.remove('open');
    document.getElementById('upsellModalOverlay').classList.remove('open');
}

function goToBebidas() {
    closeUpsellModal();
    const tabBebidasBtn = document.getElementById('tabBebidas');
    switchTab('bebidas', tabBebidasBtn);
}

// 5. CARRINHO
function addToCart(name, price, img, size = null, color = null) {
    cart.push({ name, price, img, size, color });
    updateCartUI();

    const cartBtn = document.querySelector('.cart-btn');
    if (cartBtn) {
        cartBtn.classList.add('pulse');
        setTimeout(() => cartBtn.classList.remove('pulse'), 400);
    }

    showToast();
}

function showToast() {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function updateCartUI() {
    document.getElementById('cartCount').innerText = cart.length;
    const container = document.getElementById('cartItemsContainer');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">Sua sacola está vazia.</p>';
        return;
    }

    let html = '';
    let total = 0;

    cart.forEach((item, index) => {
        const numericPrice = parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
        total += numericPrice;

        const sizeTxt = item.size ? ` (Tam: ${item.size})` : '';
        const colorTxt = item.color ? ` - Cor: ${item.color}` : '';

        html += `
            <div class="cart-item">
                <div style="display:flex; align-items:center; gap:10px;">
                    ${item.img ? `<img src="${item.img}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">` : ''}
                    <span>
                        <b>${item.name}</b><br>
                        <small style="color:#666;">${sizeTxt}${colorTxt}</small><br>
                        <small style="color:var(--accent-gold); font-weight:bold;">${item.price}</small>
                    </span>
                </div>
                <button onclick="removeItem(${index})" style="background:none; border:none; color:#e76f51; cursor:pointer; font-weight:bold; font-size:12px;">Remover</button>
            </div>
        `;
    });

    html += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:15px; padding-top:10px; border-top:1px dashed var(--border-color); font-weight:bold;">
            <span>Total:</span>
            <span style="color:var(--accent-gold); font-size:16px;">R$ ${total.toFixed(2).replace('.', ',')}</span>
        </div>
    `;

    container.innerHTML = html;
}

function removeItem(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function toggleCart() {
    document.getElementById('cartDrawer').classList.toggle('open');
    document.getElementById('cartOverlay').classList.toggle('open');
}

// 6. WHATSAPP
function checkoutWhatsApp() {
    if (cart.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }

    let total = 0;
    let message = "Olá! Gostaria de finalizar a compra dos seguintes itens na *Loja Borboleta*:\n\n";

    cart.forEach((item, idx) => {
        const sizeInfo = item.size ? ` (Tamanho: ${item.size})` : '';
        const colorInfo = item.color ? ` (Cor: ${item.color})` : '';
        message += `${idx + 1}. *${item.name}*${sizeInfo}${colorInfo} - ${item.price}\n`;
        const numericPrice = parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
        total += numericPrice;
    });

    message += `\n*Total do Pedido:* R$ ${total.toFixed(2).replace('.', ',')}`;

    const phone = "5511943935765";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

loadProductsFromBackend();
