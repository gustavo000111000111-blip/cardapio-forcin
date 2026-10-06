async function carregarCardapioDoBanco() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) return;

        const produtosBanco = await resposta.json();

        if (Array.isArray(produtosBanco) && produtosBanco.length > 0) {
            // Filtra pizzas tolerando variações de maiúsculas/minúsculas
            const pizzasBanco = produtosBanco.filter(p =>
                p.categoria && p.categoria.toLowerCase() === 'pizza' &&
                (!p.subcategoria || p.subcategoria.toLowerCase() !== 'promocao')
            );

            if (pizzasBanco.length > 0) {
                SABORES = pizzasBanco.map(p => ({
                    id: p.id,
                    categoria: (p.subcategoria || 'tradicional').toLowerCase(),
                    nome: p.nome,
                    desc: p.descricao || '',
                    precos: {
                        broto: Number(p.preco_broto || 0),
                        media: Number(p.preco_media || 0),
                        grande: Number(p.preco_grande || 0),
                        familia: Number(p.preco_familia || 0),
                        ituana: Number(p.preco_ituana || 0)
                    }
                }));
            }

            // Filtra promoções
            const promosBanco = produtosBanco.filter(p =>
                (p.categoria && p.categoria.toLowerCase() === 'promocao') ||
                (p.subcategoria && p.subcategoria.toLowerCase() === 'promocao')
            );

            if (promosBanco.length > 0) {
                PROMOCOES = promosBanco.map(p => {
                    const preco = Number(p.preco_unico || p.preco_grande || 0);
                    return {
                        id: p.id,
                        nome: p.nome,
                        desc: p.descricao || '',
                        precos: { broto: preco, media: preco, grande: preco, familia: preco, ituana: preco }
                    };
                });
            }

            // Filtra bebidas
            const bebidasBanco = produtosBanco.filter(p =>
                p.categoria && p.categoria.toLowerCase() === 'bebida'
            );

            if (bebidasBanco.length > 0) {
                BEBIDAS = bebidasBanco.map(p => {
                    const preco = Number(p.preco_unico || p.preco_grande || 0);
                    return {
                        id: p.id,
                        nome: p.nome,
                        desc: p.descricao || '',
                        precos: { broto: preco, media: preco, grande: preco, familia: preco, ituana: preco }
                    };
                });
            }

            // Renderização no DOM
            renderizarDestaques();
            renderizarCardapio(ordenarPorPreco(SABORES), 'cardapioContainer', 'montador');
            renderizarCardapio(ordenarPorPreco(PROMOCOES), 'promocoesContainer', 'promo');
            renderizarCardapio(BEBIDAS, 'bebidasContainer', 'bebida');
        }
    } catch (erro) {
        console.error('Erro ao conectar com a API do banco:', erro);
    }
}
