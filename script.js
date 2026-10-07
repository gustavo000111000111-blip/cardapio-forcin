async function carregarCardapioDoBanco() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) return;

        const produtosBanco = await resposta.json();

        if (!Array.isArray(produtosBanco) || produtosBanco.length === 0) return;

        // Separação por categorias
        const pizzas = produtosBanco.filter(p => p.categoria && p.categoria.toLowerCase() === 'pizza');
        const bebidas = produtosBanco.filter(p => p.categoria && p.categoria.toLowerCase() === 'bebida');
        const promocoes = produtosBanco.filter(p => p.categoria && p.categoria.toLowerCase() === 'promocao');

        if (typeof renderizarCardapio === 'function') {
            if (pizzas.length > 0) renderizarCardapio(pizzas, 'cardapioContainer', 'montador');
            if (promocoes.length > 0) renderizarCardapio(promocoes, 'promocoesContainer', 'promo');
            if (bebidas.length > 0) renderizarCardapio(bebidas, 'bebidasContainer', 'bebida');
        } else {
            desenharListaDirecta(pizzas, 'cardapioContainer');
            desenharListaDirecta(promocoes, 'promocoesContainer');
            desenharListaDirecta(bebidas, 'bebidasContainer');
        }

    } catch (erro) {
        console.error('Erro ao carregar cardápio:', erro);
    }
}

function desenharListaDirecta(lista, containerId) {
    const container = document.getElementById(containerId);
    if (!container || lista.length === 0) return;

    container.innerHTML = lista.map(item => `
        <div class="menu-item">
            <div class="menu-item-left">
                <div class="menu-item-info">
                    <strong>${item.nome}</strong>
                    <small>${item.descricao || ''}</small>
                    <div class="menu-item-price">R$ ${Number(item.preco_grande || item.preco_unico || item.preco_broto || 0).toFixed(2)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCardapioDoBanco();
});
