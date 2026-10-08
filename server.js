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
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
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
            cliente TEXT,
            telefone VARCHAR(20),
            endereco TEXT,
            total DOUBLE PRECISION,
            frete DOUBLE PRECISION DEFAULT 0,
            pagamento TEXT,
            itens TEXT,
            timestamp BIGINT,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await pool.query(`ALTER TABLE comandas ADD COLUMN IF NOT EXISTS frete DOUBLE PRECISION DEFAULT 0`);
        await pool.query(`ALTER TABLE comandas ADD COLUMN IF NOT EXISTS pagamento TEXT`);
        await pool.query(`ALTER TABLE comandas ADD COLUMN IF NOT EXISTS criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    } catch (err) {
        console.error('Erro ao criar tabelas:', err.message);
    }
}

// Limpeza automática de comandas com mais de 90 minutos
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

app.post('/api/produtos', verificarAdmin, async (req, res) => {
    const { categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO produtos (categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                categoria || 'pizza',
                subcategoria || 'tradicional',
                nome,
                descricao || '',
                preco_broto || 0,
                preco_media || 0,
                preco_grande || 0,
                preco_familia || 0,
                preco_ituana || 0,
                preco_unico || 0
            ]
        );
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.put('/api/produtos/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico } = req.body;
    try {
        await pool.query(
            `UPDATE produtos SET categoria=$1, subcategoria=$2, nome=$3, descricao=$4, preco_broto=$5, preco_media=$6, preco_grande=$7, preco_familia=$8, preco_ituana=$9, preco_unico=$10 WHERE id=$11`,
            [
                categoria || 'pizza',
                subcategoria || 'tradicional',
                nome,
                descricao || '',
                preco_broto || 0,
                preco_media || 0,
                preco_grande || 0,
                preco_familia || 0,
                preco_ituana || 0,
                preco_unico || 0,
                id
            ]
        );
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.delete('/api/produtos/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

app.put('/api/produtos/reordenar', verificarAdmin, async (req, res) => {
    const { itens, ordem } = req.body;
    try {
        const lista = itens || ordem;
        if (Array.isArray(lista)) {
            for (let item of lista) {
                if (typeof item === 'object' && item.id && item.ordem !== undefined) {
                    await pool.query('UPDATE produtos SET ordem = $1 WHERE id = $2', [item.ordem, item.id]);
                } else {
                    const index = lista.indexOf(item);
                    await pool.query('UPDATE produtos SET ordem = $1 WHERE id = $2', [index, item]);
                }
            }
        }
        res.json({ sucesso: true });
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
            cliente: typeof c.cliente === 'string' && c.cliente.startsWith('{') ? JSON.parse(c.cliente) : { nome: c.cliente, telefone: c.telefone, endereco: c.endereco },
            pagamento: typeof c.pagamento === 'string' && c.pagamento.startsWith('{') ? JSON.parse(c.pagamento) : { metodo: c.pagamento || 'Não informado' },
            itens: typeof c.itens === 'string' ? JSON.parse(c.itens || '[]') : c.itens,
            data: parseInt(c.timestamp || Date.now())
        }));
        res.json(formatadas);
    } catch (err) {
        console.error('Erro ao buscar comandas:', err.message);
        res.status(500).json({ erro: err.message });
    }
});

app.post('/api/comandas', async (req, res) => {
    const { cliente, telefone, endereco, total, itens, pagamento } = req.body;
    const timestamp = Date.now();

    const clienteObj = typeof cliente === 'object' ? JSON.stringify(cliente) : JSON.stringify({ nome: cliente, telefone, endereco });
    const pagamentoObj = typeof pagamento === 'object' ? JSON.stringify(pagamento) : JSON.stringify({ metodo: pagamento || 'Não informado' });

    const query = `INSERT INTO comandas (cliente, telefone, endereco, total, frete, pagamento, itens, timestamp) VALUES ($1, $2, $3, $4, 0, $5, $6, $7) RETURNING id`;
    try {
        const { rows } = await pool.query(query, [clienteObj, telefone || '', endereco || '', total || 0, pagamentoObj, JSON.stringify(itens || []), timestamp]);
        res.json({ id: rows[0].id, mensagem: 'Comanda criada com sucesso!' });
    } catch (err) {
        console.error('Erro ao inserir comanda:', err.message);
        res.status(500).json({ erro: err.message });
    }
});

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

function verificarAdmin(req, res, next) {
    const senha = req.headers['x-admin-password'];
    if (senha === ADMIN_PASSWORD) {
        next();
    } else {
        res.status(403).json({ erro: 'Acesso negado.' });
    }
}

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/painel.html', (req, res) => res.sendFile(path.join(__dirname, 'painel.html')));
app.get('/fretes.html', (req, res) => res.sendFile(path.join(__dirname, 'fretes.html')));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
