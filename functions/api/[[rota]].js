import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const pathParts = params.rota || [];
  const recurso = pathParts[0]; // 'produtos' ou 'comandas'
  const idOuAcao = pathParts[1]; // ':id' ou 'reordenar'
  const subAcao = pathParts[2]; // 'frete'

  // Cabeçalhos CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const jsonResponse = (data, status = 200) =>
    Response.json(data, { status, headers: corsHeaders });

  // Verificação de senha do Admin
  const verificarAdmin = () => {
    const senha = request.headers.get('x-admin-password');
    return env.ADMIN_PASSWORD && senha === env.ADMIN_PASSWORD;
  };

  try {
    if (!env.DATABASE_URL) {
      return jsonResponse({ erro: 'DATABASE_URL não configurada no painel da Cloudflare.' }, 500);
    }

    const sql = neon(env.DATABASE_URL);

    // ==========================================
    // ROTAS DE PRODUTOS (/api/produtos)
    // ==========================================
    if (recurso === 'produtos') {
      // GET /api/produtos
      if (method === 'GET') {
        const rows = await sql`SELECT * FROM produtos ORDER BY ordem ASC, id ASC`;
        return jsonResponse(rows);
      }

      // Todas as rotas abaixo exigem senha de Admin
      if (!verificarAdmin()) {
        return jsonResponse({ erro: 'Acesso negado.' }, 403);
      }

      // POST /api/produtos
      if (method === 'POST') {
        const body = await request.json();
        const {
          categoria, subcategoria, nome, descricao,
          preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico
        } = body;

        const rows = await sql`
          INSERT INTO produtos (
            categoria, subcategoria, nome, descricao,
            preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico
          ) VALUES (
            ${categoria || 'pizza'},
            ${subcategoria || 'tradicional'},
            ${nome},
            ${descricao || ''},
            ${preco_broto || 0},
            ${preco_media || 0},
            ${preco_grande || 0},
            ${preco_familia || 0},
            ${preco_ituana || 0},
            ${preco_unico || 0}
          ) RETURNING *
        `;
        return jsonResponse(rows[0]);
      }

      // PUT /api/produtos/reordenar
      if (method === 'PUT' && idOuAcao === 'reordenar') {
        const body = await request.json();
        const lista = body.itens || body.ordem;

        if (Array.isArray(lista)) {
          for (let i = 0; i < lista.length; i++) {
            const item = lista[i];
            if (typeof item === 'object' && item.id && item.ordem !== undefined) {
              await sql`UPDATE produtos SET ordem = ${item.ordem} WHERE id = ${item.id}`;
            } else {
              await sql`UPDATE produtos SET ordem = ${i} WHERE id = ${item}`;
            }
          }
        }
        return jsonResponse({ sucesso: true });
      }

      // PUT /api/produtos/:id
      if (method === 'PUT' && idOuAcao) {
        const body = await request.json();
        const {
          categoria, subcategoria, nome, descricao,
          preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico
        } = body;

        await sql`
          UPDATE produtos SET
            categoria = ${categoria || 'pizza'},
            subcategoria = ${subcategoria || 'tradicional'},
            nome = ${nome},
            descricao = ${descricao || ''},
            preco_broto = ${preco_broto || 0},
            preco_media = ${preco_media || 0},
            preco_grande = ${preco_grande || 0},
            preco_familia = ${preco_familia || 0},
            preco_ituana = ${preco_ituana || 0},
            preco_unico = ${preco_unico || 0}
          WHERE id = ${idOuAcao}
        `;
        return jsonResponse({ sucesso: true });
      }

      // DELETE /api/produtos/:id
      if (method === 'DELETE' && idOuAcao) {
        await sql`DELETE FROM produtos WHERE id = ${idOuAcao}`;
        return jsonResponse({ sucesso: true });
      }
    }

    // ==========================================
    // ROTAS DE COMANDAS (/api/comandas)
    // ==========================================
    if (recurso === 'comandas') {
      // GET /api/comandas (Já limpa comandas com mais de 90 min automaticamente)
      if (method === 'GET') {
        const limiteTempo = Date.now() - (90 * 60 * 1000);
        await sql`DELETE FROM comandas WHERE timestamp < ${limiteTempo}`;

        const rows = await sql`SELECT * FROM comandas ORDER BY timestamp DESC`;
        const formatadas = rows.map(c => ({
          ...c,
          frete: Number(c.frete || 0),
          cliente: typeof c.cliente === 'string' && c.cliente.startsWith('{')
            ? JSON.parse(c.cliente)
            : { nome: c.cliente, telefone: c.telefone, endereco: c.endereco },
          pagamento: typeof c.pagamento === 'string' && c.pagamento.startsWith('{')
            ? JSON.parse(c.pagamento)
            : { metodo: c.pagamento || 'Não informado' },
          itens: typeof c.itens === 'string' ? JSON.parse(c.itens || '[]') : c.itens,
          data: parseInt(c.timestamp || Date.now())
        }));

        return jsonResponse(formatadas);
      }

      // POST /api/comandas
      if (method === 'POST') {
        const body = await request.json();
        const { cliente, telefone, endereco, total, itens, pagamento } = body;
        const timestamp = Date.now();

        const clienteObj = typeof cliente === 'object'
          ? JSON.stringify(cliente)
          : JSON.stringify({ nome: cliente, telefone, endereco });

        const pagamentoObj = typeof pagamento === 'object'
          ? JSON.stringify(pagamento)
          : JSON.stringify({ metodo: pagamento || 'Não informado' });

        const itensStr = JSON.stringify(itens || []);

        const rows = await sql`
          INSERT INTO comandas (cliente, telefone, endereco, total, frete, pagamento, itens, timestamp)
          VALUES (${clienteObj}, ${telefone || ''}, ${endereco || ''}, ${total || 0}, 0, ${pagamentoObj}, ${itensStr}, ${timestamp})
          RETURNING id
        `;

        return jsonResponse({ id: rows[0].id, mensagem: 'Comanda criada com sucesso!' });
      }

      // PUT /api/comandas/:id/frete
      if (method === 'PUT' && idOuAcao && subAcao === 'frete') {
        const body = await request.json();
        const valorFrete = parseFloat(body.frete) || 0;
        await sql`UPDATE comandas SET frete = ${valorFrete} WHERE id = ${idOuAcao}`;
        return jsonResponse({ sucesso: true, mensagem: 'Frete salvo com sucesso!' });
      }
    }

    return jsonResponse({ erro: 'Rota não encontrada.' }, 404);
  } catch (err) {
    return jsonResponse({ erro: err.message }, 500);
  }
}
