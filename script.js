async function carregarCardapioDoBanco() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) return;

        const produtosBanco = await resposta.json();

        if (Array.isArray(produtosBanco) && produtosBanco.length > 0) {
            SABORES = [];
            PROMOCOES = [];
            BEBIDAS = [];

            produtosBanco.forEach(p => {
                const cat = String(p.categoria || '').trim().toLowerCase();
                const subcat = String(p.subcategoria || '').trim().toLowerCase();

                const item = {
                    id: p.id,
                    categoria: subcat || 'tradicional',
                    nome: p.nome,
                    desc: p.descricao || '',
                    precos: {
                        broto: Number(p.preco_broto || p.preco_unico || 0),
                        media: Number(p.preco_media || p.preco_unico || 0),
                        grande: Number(p.preco_grande || p.preco_unico || 0),
                        familia: Number(p.preco_familia || p.preco_unico || 0),
                        ituana: Number(p.preco_ituana || p.preco_unico || 0)
                    },
                    preco: Number(p.preco_unico || p.preco_grande || 0)
                };

                if (cat === 'bebida') {
                    BEBIDAS.push(item);
                } else if (cat === 'promocao' || subcat === 'promocao') {
                    PROMOCOES.push(item);
                } else {
                    SABORES.push(item);
                }
            });

            // Executa a renderização na página
            if (typeof renderizarDestaques === 'function') renderizarDestaques();
            if (typeof renderizarCardapio === 'function') {
                renderizarCardapio(ordenarPorPreco ? ordenarPorPreco(SABORES) : SABORES, 'cardapioContainer', 'montador');
                renderizarCardapio(ordenarPorPreco ? ordenarPorPreco(PROMOCOES) : PROMOCOES, 'promocoesContainer', 'promo');
                renderizarCardapio(BEBIDAS, 'bebidasContainer', 'bebida');
            }
        }
    } catch (erro) {
        console.error('Erro ao carregar cardápio:', erro);
    }
}

// Dispara o carregamento assim que o navegador abre a página
document.addEventListener('DOMContentLoaded', () => {
    carregarCardapioDoBanco();
});
