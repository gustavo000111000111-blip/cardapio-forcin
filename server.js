const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = '21072026';

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

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
            preco_unico DOUBLE PRECISION,
            ordem INT DEFAULT 0
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS comandas (
            id SERIAL PRIMARY KEY,
            cliente VARCHAR(100),
            telefone VARCHAR(20),
            endereco TEXT,
            total DOUBLE PRECISION,
            frete DOUBLE PRECISION DEFAULT 0,
            itens TEXT,
            timestamp BIGINT
        )`);

        await pool.query(`ALTER TABLE comandas ADD COLUMN IF NOT EXISTS frete DOUBLE PRECISION DEFAULT 0`);

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

        const query = `INSERT INTO produtos (categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, ordem) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

        let contadorOrdem = 1;
        const inserir = async (cat, sub, itens, pB, pM, pG, pF, pI, pU) => {
            for (let item of itens) {
                await pool.query(query, [cat, sub, item[0], item[1], pB, pM, pG, pF, pI, pU, contadorOrdem++]);
            }
        };

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

        console.log('Cardápio inserido no PostgreSQL com sucesso!');
    } catch (err) {
        console.error('Erro ao popular dados iniciais:', err.message);
    }
}

// Limpeza periódica de comandas antigas
setInterval(async () => {
    const limiteTempo = Date.now() - (90 * 60 * 1000);
    try {
        await pool.query(`DELETE FROM comandas WHERE timestamp < $1`, [limiteTempo]);
    } catch (err) {
        console.error('Erro ao limpar comandas antigas:', err.message);
    }
}, 60000);

// --- ROTAS DA API ---

app.get('/api/produtos', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM produtos ORDER BY ordem ASC, id ASC');
        res.json(rows);
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
            frete: Number(c.frete || 0),
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
    const query = `INSERT INTO comandas (cliente, telefone, endereco, total, frete, itens, timestamp) VALUES ($1, $2, $3, $4, 0, $5, $6) RETURNING id`;
    try {
        const { rows } = await pool.query(query, [cliente, telefone, endereco, total, JSON.stringify(itens), timestamp]);
        res.json({ id: rows[0].id, mensagem: 'Comanda criada com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Atualizar valor do frete na comanda
app.put('/api/comandas/:id/frete', async (req, res) => {
    const { id } = req.params;
    const { frete } = req.body;
    const valorFrete = parseFloat(frete) || 0;
    try {
        await pool.query('UPDATE comandas SET frete = $1 WHERE id = $2', [valorFrete, id]);
        res.json({ sucesso: true, mensagem: 'Frete salvo com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Obter fretes armazenados
app.get('/api/fretes', async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, cliente, endereco, total, frete, timestamp FROM comandas WHERE frete > 0 ORDER BY timestamp DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
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
