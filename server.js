const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://usuario:senha@localhost:5432/forcin_pizzaria'
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Middleware de Autenticação Admin
function authAdmin(req, res, next) {
  const pass = req.headers['x-admin-password'];
  if (pass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }
  next();
}

// Inicialização do Banco de Dados
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      categoria VARCHAR(50) NOT NULL,
      subcategoria VARCHAR(50),
      descricao TEXT,
      preco_broto DECIMAL(10,2),
      preco_media DECIMAL(10,2),
      preco_grande DECIMAL(10,2),
      preco_familia DECIMAL(10,2),
      preco_ituana DECIMAL(10,2),
      preco_unico DECIMAL(10,2),
      ordem INT DEFAULT 0,
      destaque BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS comandas (
      id SERIAL PRIMARY KEY,
      cliente JSONB NOT NULL,
      itens JSONB NOT NULL,
      pagamento JSONB NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      frete DECIMAL(10,2) DEFAULT 0.00,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDB().catch(console.error);

// Limpeza automática de comandas com mais de 90 minutos
setInterval(async () => {
  try {
    await pool.query("DELETE FROM comandas WHERE criado_em < NOW() - INTERVAL '90 minutes'");
  } catch (err) {
    console.error('Erro na limpeza de comandas:', err);
  }
}, 5 * 60 * 1000);

// --- ROTAS DA API ---

// Produtos
app.get('/api/produtos', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM produtos ORDER BY ordem ASC, id ASC');
  res.json(rows);
});

app.post('/api/produtos', authAdmin, async (req, res) => {
  const { nome, categoria, subcategoria, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, destaque } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO produtos (nome, categoria, subcategoria, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, destaque)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [nome, categoria, subcategoria, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, destaque || false]
  );
  res.json(rows[0]);
});

app.put('/api/produtos/:id', authAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, subcategoria, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, destaque } = req.body;
  const { rows } = await pool.query(
    `UPDATE produtos SET nome=$1, categoria=$2, subcategoria=$3, descricao=$4, preco_broto=$5, preco_media=$6, preco_grande=$7, preco_familia=$8, preco_ituana=$9, preco_unico=$10, destaque=$11
     WHERE id=$12 RETURNING *`,
    [nome, categoria, subcategoria, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, destaque, id]
  );
  res.json(rows[0]);
});

app.delete('/api/produtos/:id', authAdmin, async (req, res) => {
  await pool.query('DELETE FROM produtos WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

app.put('/api/produtos/reordenar', authAdmin, async (req, res) => {
  const { ordem } = req.body; // Array de IDs na nova ordem
  for (let i = 0; i < ordem.length; i++) {
    await pool.query('UPDATE produtos SET ordem = $1 WHERE id = $2', [i, ordem[i]]);
  }
  res.json({ success: true });
});

// Comandas
app.get('/api/comandas', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM comandas ORDER BY id DESC');
  res.json(rows);
});

app.post('/api/comandas', async (req, res) => {
  const { cliente, itens, pagamento, total, frete } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO comandas (cliente, itens, pagamento, total, frete) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [JSON.stringify(cliente), JSON.stringify(itens), JSON.stringify(pagamento), total, frete || 0]
  );
  res.json(rows[0]);
});

app.put('/api/comandas/:id/frete', async (req, res) => {
  const { frete } = req.body;
  const { rows } = await pool.query(
    'UPDATE comandas SET frete = $1 WHERE id = $2 RETURNING *',
    [frete, req.params.id]
  );
  res.json(rows[0]);
});

app.get('/api/fretes', async (req, res) => {
  const { rows } = await pool.query('SELECT SUM(frete) as total_frete, COUNT(*) as total_comandas FROM comandas');
  res.json(rows[0]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
