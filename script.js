async function carregarCardapioDoBanco() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) return;

        const produtosBanco = await resposta.json();
        console.log('Produtos recebidos do banco:', produtosBanco);

        if (!Array.isArray(produtosBanco) || produtosBanco.length === 0) return;

        // Atualiza as variáveis globais se existirem
        if (typeof SABORES !== 'undefined') SABORES = [];
        if (typeof PROMOCOES !== 'undefined') PROMOCOES = [];
        if (typeof BEBIDAS !== 'undefined') BEBIDAS = [];

        // Filtra por categoria
        const pizzas = produtosBanco.filter(p =>
            p.categoria && p.categoria.toLowerCase() === 'pizza'
        );
        const bebidas = produtosBanco.filter(p =>
            p.categoria && p.categoria.toLowerCase() === 'bebida'
        );
        const promocoes = produtosBanco.filter(p =>
            p.categoria && p.categoria.toLowerCase() === 'promocao'
        );

        // Se existirem as funções de renderização nativas do projeto, executa-as
        if (typeof renderizarCardapio === 'function') {
            if (pizzas.length > 0) renderizarCardapio(pizzas, 'cardapioContainer', 'montador');
            if (promocoes.length > 0) renderizarCardapio(promocoes, 'promocoesContainer', 'promo');
            if (bebidas.length > 0) renderizarCardapio(bebidas, 'bebidasContainer', 'bebida');
        } else {
            // FALLBACK: Se as funções de renderização falharem, desenha diretamente nos containers
            desenharListaDirecta(pizzas, 'cardapioContainer');
            desenharListaDirecta(promocoes, 'promocoesContainer');
            desenharListaDirecta(bebidas, 'bebidasContainer');
        }

    } catch (erro) {
        console.error('Erro ao carregar e renderizar cardápio:', erro);
    }
}

// Função de emergência para desenhar na tela se faltar alguma função no script
function desenharListaDirecta(lista, containerId) {
    const container = document.getElementById(containerId);
    if (!container || lista.length === 0) return;

    container.innerHTML = lista.map(item => `
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fff;">
            <h3 style="margin: 0 0 5px 0;">${item.nome}</h3>
            <p style="margin: 0 0 10px 0; color: #666;">${item.descricao || ''}</p>
            <strong>Preço: R$ ${Number(item.preco_grande || item.preco_unico || item.preco_broto || 0).toFixed(2)}</strong>
        </div>
    `).join('');
}

// Executa o carregamento assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapioDoBanco();
});
