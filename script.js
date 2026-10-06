async function carregarCardapioDoBanco() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) return;

        const produtosBanco = await resposta.json();
        console.log('Dados recebidos da API:', produtosBanco);

        if (Array.isArray(produtosBanco) && produtosBanco.length > 0) {
            SABORES = [];
            PROMOCOES = [];
            BEBIDAS = [];

            produtosBanco.forEach(p => {
                const cat = String(p.categoria || '').trim().toLowerCase();
                const subcat = String(p.subcategoria || '').trim().toLowerCase();

                const precoBase = Number(p.preco_unico || p.preco_grande || p.preco_media || p.preco_broto || 0);

                const item = {
                    id: p.id,
                    categoria: subcat || 'tradicional',
                    nome: p.nome,
                    desc: p.descricao || '',
                    precos: {
                        broto: Number(p.preco_broto || precoBase),
                        media: Number(p.preco_media || precoBase),
                        grande: Number(p.preco_grande || precoBase),
                        familia: Number(p.preco_familia || precoBase),
                        ituana: Number(p.preco_ituana || precoBase)
                    },
                    preco: precoBase
                };

                if (cat === 'bebida') {
                    BEBIDAS.push(item);
                } else if (cat === 'promocao' || subcat === 'promocao') {
                    PROMOCOES.push(item);
                } else {
                    SABORES.push(item);
                }
            });

            // Força a renderização das listas
            if (typeof renderizarDestaques === 'function') renderizarDestaques();
            if (typeof renderizarCardapio === 'function') {
                renderizarCardapio(SABORES, 'cardapioContainer', 'montador');
                renderizarCardapio(PROMOCOES, 'promocoesContainer', 'promo');
                renderizarCardapio(BEBIDAS, 'bebidasContainer', 'bebida');
            }
        }
    } catch (erro) {
        console.error('Erro ao processar cardápio:', erro);
    }
}
