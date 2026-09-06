const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = '21072026'; // Senha do painel administrativo

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Conexão com o Banco de Dados PostgreSQL (Externo)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao PostgreSQL:', err.message);
    } else {
        console.log('Conectado ao PostgreSQL com sucesso.');
        criarTabelas();
    }
});

async function criarTabelas() {
    try {
        // Tabela de Produtos
        await pool.query(`CREATE TABLE IF NOT EXISTS produtos (
            id SERIAL PRIMARY KEY,
            categoria VARCHAR(50),
            subcategoria VARCHAR(50),
            nome VARCHAR(100),
            descricao TEXT,
            preco_broto DOUBLE PRECISION,
            preco_media DOUBLE PRECISION,
            preco_grande DOUBLE PRECISION,
            preco_familia DOUBLE PRECISION,
            preco_ituana DOUBLE PRECISION,
            preco_unico DOUBLE PRECISION
        )`);

        // Tabela de Comandas (expira em 1h30)
        await pool.query(`CREATE TABLE IF NOT EXISTS comandas (
            id SERIAL PRIMARY KEY,
            cliente VARCHAR(100),
            telefone VARCHAR(20),
            endereco TEXT,
            total DOUBLE PRECISION,
            itens TEXT,
            timestamp BIGINT
        )`);

        await popularProdutosIniciais();
    } catch (err) {
        console.error('Erro ao criar tabelas:', err.message);
    }
}

async function popularProdutosIniciais() {
    try {
        const { rows } = await pool.query("SELECT COUNT(*) as total FROM produtos");
        if (parseInt(rows[0].total) > 0) {
            console.log('Cardápio já populado anteriormente.');
            return;
        }

        console.log('Inserindo cardápio completo...');
        await pool.query("TRUNCATE TABLE produtos RESTART IDENTITY CASCADE");

        const query = `INSERT INTO produtos (categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

        const inserir = async (cat, sub, itens, pB, pM, pG, pF, pI, pU) => {
            for (let item of itens) {
                await pool.query(query, [cat, sub, item[0], item[1], pB, pM, pG, pF, pI, pU]);
            }
        };

        // Grupo 1: Tradicionais
        const itensG1 = [
            ['ALHO AO AZEITE', 'Mussarela, alho ao azeite, tomate e azeitona preta'],
            ['BACON', 'Mussarela, bacon, tomate e azeitona preta'],
            ['BRÓCOLIS', 'Mussarela, brócolis, tomate e azeitona preta'],
            ['CALABRESA', 'Mussarela, calabresa, cebola e azeitona preta'],
            ['CATUPIRY COM CALABRESA', 'Catupiry (Requeijão especial), calabresa, cebola e azeitona preta'],
            ['ESCAROLA', 'Mussarela, escarola, tomate e azeitona preta'],
            ['FRANGO', 'Mussarela, frango, tomate e azeitona preta'],
            ['CATUPIRY COM FRANGO', 'Catupiry (Requeijão especial), frango, tomate e azeitona preta'],
            ['LOMBO (CANADENSE)', 'Mussarela, lombo, tomate, cebola e azeitona preta'],
            ['CATUPIRY C/ LOMBO (CANADENSE)', 'Catupiry (Requeijão especial), lombo, tomate, cebola e azeitona preta'],
            ['MILHO', 'Mussarela, milho, tomate, e azeitona preta'],
            ['CATUPIRY C/ MILHO', 'Catupiry (Requeijão especial), milho, tomate e azeitona preta'],
            ['MUSSARELA', 'Mussarela, tomate e azeitona preta'],
            ['PALMITO', 'Mussarela, palmito, tomate e azeitona preta'],
            ['CATUPIRY C/ PALMITO', 'Catupiry (Requeijão especial), palmito, tomate e azeitona preta'],
            ['PEITO DE PERU', 'Mussarela, peito de peru, tomate, cebola e azeitona preta'],
            ['CATUPIRY C/ PEITO DE PERU', 'Catupiry (Requeijão especial), peito de peru, tomate, cebola e azeitona preta'],
            ['PRESUNTO', 'Mussarela, presunto, tomate e azeitona preta']
        ];
        await inserir('pizza', 'tradicional', itensG1, 33.0, 42.0, 60.0, 80.0, 117.0, 0);

        // Grupo 2: Especiais
        const itensG2 = [
            ['ALIXE', 'Mussarela, alixe, tomate e azeitona preta'],
            ['ATUM', 'Mussarela, atum, cebola e azeitona preta'],
            ['CATUPIRY C/ ATUM', 'Catupiry (Requeijão especial), atum, cebola e azeitona preta'],
            ['BRÓCOLIS ESPECIAL', 'Mussarela, brócolis, palmito, ervilha, ovo, cebola, tomate, azeitona preta e verde'],
            ['CREME DE MILHO', 'Mussarela, creme branco, milho e azeitona preta'],
            ['DOIS QUEIJOS', 'Catupiry (Requeijão especial), mussarela e azeitona preta'],
            ['ESCAROLA ESPECIAL', 'Mussarela, escarola, palmito, ovo, ervilha, cebola, tomate, azeitona preta e verde'],
            ['FILÉ MIGNON', 'Mussarela, filé mignon desfiado, tomate, cebola e azeitona preta'],
            ['CATUPIRY COM FILÉ MIGNON', 'Catupiry (Requeijão especial), filé mignon desfiado, tomate, cebola e azeitona preta'],
            ['FIORENTINA', 'Mussarela, presunto, parmesão, tomate, cebola, azeitona preta e verde'],
            ['FRUTAS', 'Base de mussarela, pêssego, figo, abacaxi e azeitona preta'],
            ['MAIONESE', 'Mussarela, palmito, ervilha, tomate, ovo, cebola, maionese, azeitona preta e verde'],
            ['NAPOLITANA', 'Mussarela, tomate, parmesão e azeitona preta'],
            ['QUENTINHA', 'Mussarela, calabresa, tomate, cebola, pimenta e azeitona preta'],
            ['SALAME ITALIANO', 'Mussarela, salame italiano, tomate, cebola e azeitona preta'],
            ['VEGETARIANA', 'Mussarela, brócolis, escarola, tomate, champignon, azeitona preta e verde']
        ];
        await inserir('pizza', 'especial', itensG2, 37.0, 47.0, 62.0, 83.0, 122.0, 0);

        // Grupo 3: Especiais
        const itensG3 = [
            ['ALHO-PORÓ', 'Mussarela, alho-poró, palmito, bacon e azeitona preta'],
            ['ALPINA', 'Mussarela, atum, ovo, ervilha, cebola, maionese e azeitona preta'],
            ['BATATINHA COM FILÉ MIGNON', 'Mussarela, batata palha, filé mignon desfiado, azeitona preta e verde'],
            ['CATUPIRY C/ BATATINHA E FILÉ MIGNON', 'Catupiry (Requeijão especial), batata palha, filé mignon desfiado, azeitona preta e verde'],
            ['BOLONHESA', 'Mussarela, carne moída ao sugo, parmesão, azeitona preta e verde'],
            ['CATUPIRY À CAIPIRA', 'Catupiry (Requeijão especial), frango, milho e azeitona preta'],
            ['CATUPIRY C/ BATATINHA E FRANGO', 'Catupiry (Requeijão especial), batata palha, frango, azeitona preta e verde'],
            ['CREME DE MILHO À CAIPIRA', 'Catupiry (Requeijão especial), creme branco, milho, frango e azeitona preta'],
            ['FRANGO ESPECIAL', 'Mussarela, frango, palmito, ervilha, ovo, tomate, cebola, azeitona preta e verde'],
            ['FRANGO C/ CATUPIRY', 'Catupiry (Requeijão especial), frango, palmito, ervilha, ovo, tomate, cebola, azeitona preta e verde'],
            ['GALETO', 'Catupiry (Requeijão especial), frango, palmito e azeitona preta'],
            ['IBÉRICA', 'Catupiry (Requeijão especial), atum, gorgonzola, ervilha e azeitona preta'],
            ['MARGUERITA', 'Mussarela, tomate, manjericão, parmesão e azeitona preta'],
            ['NATIVA', 'Catupiry, palmito, champignon, milho, ervilha, tomate e azeitona preta e verde'],
            ['NATURAL', 'Mussarela, champignon, bacon, ervilha, cebola, azeitona preta e verde'],
            ['SUPIMPA', 'Mussarela, presunto, bacon, abacaxi e azeitona preta'],
            ['TOMATE SECO C/ RÚCULA', 'Mussarela, tomate seco, rúcula e azeitona preta'],
            ['TRÊS QUEIJOS', 'Catupiry (Requeijão especial), mussarela, provolone e azeitona preta'],
            ['VENEZA', 'Mussarela, parmesão, alixe, tomate, azeitona preta e verde']
        ];
        await inserir('pizza', 'especial', itensG3, 39.0, 51.0, 66.0, 87.0, 125.0, 0);

        // Grupo 4: Especiais
        const itensG4 = [
            ['À MODA DA CASA', 'Mussarela, presunto, calabresa, ovo, palmito, ervilha, cebola, tomate, azeitona preta e verde'],
            ['CATUPIRY À MODA DA CASA', 'Catupiry (Requeijão especial), presunto, calabresa, ovo, palmito, ervilha, cebola, tomate, azeitona preta e verde'],
            ['BOLONHESA ESPECIAL', 'Mussarela, carne moída ao sugo, palmito, ovo, ervilha, cebola, tomate, parmesão, azeitona preta e verde'],
            ['BRÓCOLIS C/ BACON', 'Mussarela, brócolis, bacon, alho, parmesão, azeitona preta e verde'],
            ['CATUPIRY C/ BRÓCOLIS E BACON', 'Catupiry (Requeijão especial), brócolis, bacon, alho, parmesão, azeitona preta e verde'],
            ['ESCAROLA C/ BACON', 'Mussarela, escarola, bacon, alho, parmesão, azeitona preta e verde'],
            ['CATUPIRY C/ ESCAROLA E BACON', 'Catupiry (Requeijão especial), escarola, bacon, alho, parmesão, azeitona preta e verde'],
            ['FILÉ MIGNON ESPECIAL', 'Mussarela, filé mignon desfiado, palmito, ovo, ervilha, cebola, tomate, azeitona preta e verde'],
            ['FILÉ MIGNON C/ CATUPIRY ESPECIAL 2', 'Catupiry (Requeijão especial), filé mignon desfiado, palmito, ovo, ervilha, cebola, tomate, azeitona preta e verde'],
            ['FRANGO DOCE', 'Catupiry (Requeijão especial), frango, pêssego, figo, abacaxi e azeitona preta'],
            ['LA ROQUE', 'Mussarela, atum, palmito, tomate, ovo, ervilha, cebola, azeitona preta e verde'],
            ['CATUPIRY A LA ROQUE', 'Catupiry (Requeijão especial), atum, palmito, tomate, ovo, ervilha, cebola, azeitona preta e verde'],
            ['LOMBO CANADENSE ESPECIAL', 'Mussarela, lombo, palmito, tomate, ovo, ervilha, cebola, azeitona preta e verde'],
            ['LOMBO C/ CATUPIRY ESPECIAL 2', 'Catupiry (Requeijão especial), lombo, palmito, tomate, ovo, ervilha, cebola, azeitona preta e verde'],
            ['CATUPIRY C/ LOMBO E FRUTAS', 'Catupiry (Requeijão especial), lombo, pêssego, figo, abacaxi e azeitona preta'],
            ['PEITO DE PERU C/ CATUPIRY ESPECIAL 2', 'Catupiry (Requeijão especial), peito de peru, palmito, ovo, ervilha, tomate, cebola, azeitona preta e verde'],
            ['CATUPIRY C/ PEITO DE PERU E FRUTAS', 'Catupiry (Requeijão especial), peito de peru, pêssego, figo, abacaxi, e azeitona preta'],
            ['QUATRO QUEIJOS', 'Catupiry (Requeijão especial), mussarela, provolone, gorgonzola e azeitona preta'],
            ['SALAME ITALIANO ESPECIAL', 'Mussarela, salame italiano, palmito, ervilha, ovo, cebola, tomate, azeitona preta e verde'],
            ['TOMATE SECO ESPECIAL', 'Mussarela, tomate seco, bacon, presunto, parmesão e azeitona preta']
        ];
        await inserir('pizza', 'especial', itensG4, 40.0, 52.0, 68.0, 89.0, 132.0, 0);

        // Grupo 5: Especiais
        const itensG5 = [
            ['CINCO QUEIJOS', 'Catupiry (Requeijão especial), mussarela, provolone, gorgonzola parmesão e azeitona preta'],
            ['SÓ FRIOS', 'Mussarela, calabresa, presunto, bacon, salame italiano, lombo, peito de peru e azeitona preta']
        ];
        await inserir('pizza', 'especial', itensG5, 42.0, 54.0, 72.0, 91.0, 137.0, 0);

        // Grupo Promoção
        const promoG1 = [
            ['CALABRESA', 'Catupiry (Requeijão especial) OU Mussarela, calabresa, cebola e azeitona'],
            ['MILHO', 'Catupiry (Requeijão especial), milho, tomate e azeitona'],
            ['PALMITO', 'Catupiry (Requeijão especial), palmito, tomate e azeitona'],
            ['DOIS QUEIJOS', 'Catupiry (Requeijão especial), mussarela e azeitona'],
            ['FRANGO', 'Catupiry (Requeijão especial), frango, tomate e azeitona'],
            ['BAURU', 'Catupiry (Requeijão especial) OU Mussarela, presunto, tomate e azeitona'],
            ['PORTUGUESINHA', 'Mussarela, presunto, ervilha, ovo, cebola e azeitona'],
            ['BRASILEIRINHA', 'Mussarela, milho, ervilha, ovo, cebola e azeitona'],
            ['MANJERICÃO', 'Mussarela, manjericão, tomate e azeitona'],
            ['ROMANA', 'Catupiry (Requeijão especial), presunto, milho e azeitona'],
            ['CROCANTE', 'Catupiry (Requeijão especial), frango, batata palha e azeitona']
        ];
        await inserir('pizza', 'promocao', promoG1, 0, 0, 45.0, 0, 0, 0);

        const promoG2 = [
            ['SE QUE SABE', 'Mussarela, presunto, tomate, ovo e azeitona'],
            ['QUALQUER UMA', 'Mussarela, tomate e azeitona'],
            ['TUDO A VER', 'Mussarela, ervilha, palmito, tomate, cebola, ovo, alho frito e azeitona'],
            ['ESSA MESMO', 'Mussarela, champignon, bacon, tomate e azeitona'],
            ['PODE SER', 'Mussarela, calabresa, batata palha e azeitona'],
            ['NÃO SEI AINDA', 'Mussarela, lombo, tomate, cebola e azeitona']
        ];
        await inserir('pizza', 'promocao', promoG2, 0, 0, 52.0, 0, 0, 0);

        console.log('Cardápio inserido no PostgreSQL com sucesso!');
    } catch (err) {
        console.error('Erro ao popular dados iniciais:', err.message);
    }
}

// Rotina automática: Limpar comandas com mais de 1h30 a cada 1 minuto
setInterval(async () => {
    const limiteTempo = Date.now() - (90 * 60 * 1000);
    try {
        const { rowCount } = await pool.query(`DELETE FROM comandas WHERE timestamp < $1`, [limiteTempo]);
        if (rowCount > 0) {
            console.log(`[Limpeza de Comandas] ${rowCount} comanda(s) expirada(s) removida(s).`);
        }
    } catch (err) {
        console.error('Erro ao limpar comandas antigas:', err.message);
    }
}, 60000);

// --- ROTAS DA API ---

app.get('/api/produtos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM produtos');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.post('/api/produtos', verificarAdmin, async (req, res) => {
    const { categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico } = req.body;
    const query = `INSERT INTO produtos (categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`;
    try {
        const { rows } = await pool.query(query, [categoria, subcategoria, nome, descricao, preco_broto || 0, preco_media || 0, preco_grande || 0, preco_familia || 0, preco_ituana || 0, preco_unico || 0]);
        res.status(200).json({ mensagem: 'Salvo com sucesso!', id: rows[0].id });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.put('/api/produtos/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico } = req.body;
    const query = `UPDATE produtos SET categoria = $1, subcategoria = $2, nome = $3, descricao = $4, preco_broto = $5, preco_media = $6, preco_grande = $7, preco_familia = $8, preco_ituana = $9, preco_unico = $10 WHERE id = $11`;
    try {
        await pool.query(query, [categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, id]);
        res.json({ mensagem: 'Produto atualizado!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.delete('/api/produtos/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(`DELETE FROM produtos WHERE id = $1`, [id]);
        res.json({ mensagem: 'Produto excluído!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.get('/api/comandas', async (req, res) => {
    const limiteTempo = Date.now() - (90 * 60 * 1000);
    try {
        await pool.query(`DELETE FROM comandas WHERE timestamp < $1`, [limiteTempo]);
        const { rows } = await pool.query("SELECT * FROM comandas ORDER BY timestamp DESC");
        const formatadas = rows.map(c => ({
            ...c,
            itens: JSON.parse(c.itens || '[]'),
            data: parseInt(c.timestamp)
        }));
        res.json(formatadas);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.post('/api/comandas', async (req, res) => {
    const { cliente, telefone, endereco, total, itens } = req.body;
    const timestamp = Date.now();
    const query = `INSERT INTO comandas (cliente, telefone, endereco, total, itens, timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`;
    try {
        const { rows } = await pool.query(query, [cliente, telefone, endereco, total, JSON.stringify(itens), timestamp]);
        res.json({ id: rows[0].id, mensagem: 'Comanda criada com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.post('/api/admin/login', (req, res) => {
    const { senha } = req.body;
    if (senha === ADMIN_PASSWORD) {
        res.json({ sucesso: true });
    } else {
        res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta' });
    }
});

function verificarAdmin(req, res, next) {
    const senha = req.headers['x-admin-password'];
    if (senha === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(403).json({ erro: 'Acesso negado.' });
    }
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/painel.html', (req, res) => res.sendFile(path.join(__dirname, 'painel.html')));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
