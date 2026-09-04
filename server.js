const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = '21072026'; // Senha do painel administrativo

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Banco de Dados SQLite
const dbFile = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite com sucesso.');
        criarTabelas();
    }
});

function criarTabelas() {
    db.serialize(() => {
        // Tabela de Produtos (Cardápio gerenciado pelo admin)
        db.run(`CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT,
            subcategoria TEXT,
            nome TEXT,
            descricao TEXT,
            preco_broto REAL,
            preco_media REAL,
            preco_grande REAL,
            preco_familia REAL,
            preco_ituana REAL,
            preco_unico REAL
        )`);

        // Tabela de Comandas (expira em 1h30)
        db.run(`CREATE TABLE IF NOT EXISTS comandas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT,
            telefone TEXT,
            endereco TEXT,
            total REAL,
            itens TEXT,
            timestamp INTEGER
        )`, () => {
            popularProdutosIniciais();
        });
    });
}

function popularProdutosIniciais() {
    db.serialize(() => {
        // Verifica se a tabela está vazia. Se estiver, garante que o ID comece do 1.
        db.get("SELECT COUNT(*) as total FROM produtos", (err, row) => {
            if (err) {
                console.error('Erro ao verificar produtos:', err.message);
                return;
            }

            if (row.total > 0) {
                console.log('Cardápio já populado anteriormente. Mantendo os IDs atuais.');
                return;
            }

            console.log('Inserindo cardápio completo sem numeração e com IDs limpos...');

            // Reseta a sequência do autoincrement para garantir que comece do 1
            db.run("DELETE FROM sqlite_sequence WHERE name='produtos'");

            const stmt = db.prepare(`INSERT INTO produtos (categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            // Grupo 1: Tradicionais (R$ 33,00 / 42,00 / 60,00 / 80,00 / 117,00)
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
            itensG1.forEach((item) => {
                stmt.run('pizza', 'tradicional', item[0], item[1], 33.00, 42.00, 60.00, 80.00, 117.00, 0);
            });

            // Grupo 2: Especiais (R$ 37,00 / 47,00 / 62,00 / 83,00 / 122,00)
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
            itensG2.forEach((item) => {
                stmt.run('pizza', 'especial', item[0], item[1], 37.00, 47.00, 62.00, 83.00, 122.00, 0);
            });

            // Grupo 3: Especiais (R$ 39,00 / 51,00 / 66,00 / 87,00 / 125,00)
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
            itensG3.forEach((item) => {
                stmt.run('pizza', 'especial', item[0], item[1], 39.00, 51.00, 66.00, 87.00, 125.00, 0);
            });

            // Grupo 4: Especiais (R$ 40,00 / 52,00 / 68,00 / 89,00 / 132,00)
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
            itensG4.forEach((item) => {
                stmt.run('pizza', 'especial', item[0], item[1], 40.00, 52.00, 68.00, 89.00, 132.00, 0);
            });

            // Grupo 5: Especiais (R$ 42,00 / 54,00 / 72,00 / 91,00 / 137,00)
            const itensG5 = [
                ['CINCO QUEIJOS', 'Catupiry (Requeijão especial), mussarela, provolone, gorgonzola parmesão e azeitona preta'],
                ['SÓ FRIOS', 'Mussarela, calabresa, presunto, bacon, salame italiano, lombo, peito de peru e azeitona preta']
            ];
            itensG5.forEach((item) => {
                stmt.run('pizza', 'especial', item[0], item[1], 42.00, 54.00, 72.00, 91.00, 137.00, 0);
            });

            // Grupo Promoção (R$ 45,00 e R$ 52,00 Grande)
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
            promoG1.forEach(item => {
                stmt.run('pizza', 'promocao', item[0], item[1], 0, 0, 45.00, 0, 0, 0);
            });

            const promoG2 = [
                ['SE QUE SABE', 'Mussarela, presunto, tomate, ovo e azeitona'],
                ['QUALQUER UMA', 'Mussarela, tomate e azeitona'],
                ['TUDO A VER', 'Mussarela, ervilha, palmito, tomate, cebola, ovo, alho frito e azeitona'],
                ['ESSA MESMO', 'Mussarela, champignon, bacon, tomate e azeitona'],
                ['PODE SER', 'Mussarela, calabresa, batata palha e azeitona'],
                ['NÃO SEI AINDA', 'Mussarela, lombo, tomate, cebola e azeitona']
            ];
            promoG2.forEach(item => {
                stmt.run('pizza', 'promocao', item[0], item[1], 0, 0, 52.00, 0, 0, 0);
            });

            stmt.finalize(() => {
                console.log('Cardápio completo inserido sem numeração e com IDs reiniciados a partir de 1!');
            });
        });
    });
}

// Rotina automática: Limpar comandas com mais de 1h30 (90 minutos) a cada 1 minuto
setInterval(() => {
    const limiteTempo = Date.now() - (90 * 60 * 1000);
    db.run(`DELETE FROM comandas WHERE timestamp < ?`, [limiteTempo], function(err) {
        if (!err && this.changes > 0) {
            console.log(`[Limpeza de Comandas] ${this.changes} comanda(s) expirada(s) (> 1h30) removidas.`);
        }
    });
}, 60000);

// --- ROTAS DA API ---

// Listar produtos do cardápio
app.get('/api/produtos', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// Adicionar produto (Admin)
app.post('/api/produtos', verificarAdmin, (req, res) => {
    const { categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico } = req.body;
    const query = `INSERT INTO produtos (categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ id: this.lastID, mensagem: 'Produto cadastrado!' });
    });
});

// Atualizar produto (Admin)
app.put('/api/produtos/:id', verificarAdmin, (req, res) => {
    const { id } = req.params;
    const { categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico } = req.body;
    const query = `UPDATE produtos SET categoria = ?, subcategoria = ?, nome = ?, descricao = ?, preco_broto = ?, preco_media = ?, preco_grande = ?, preco_familia = ?, preco_ituana = ?, preco_unico = ? WHERE id = ?`;
    db.run(query, [categoria, subcategoria, nome, descricao, preco_broto, preco_media, preco_grande, preco_familia, preco_ituana, preco_unico, id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: 'Produto atualizado!' });
    });
});

// Excluir produto (Admin)
app.delete('/api/produtos/:id', verificarAdmin, (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM produtos WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ mensagem: 'Produto excluído!' });
    });
});

// Listar comandas ativas (limpa automaticamente as com mais de 1h30)
app.get('/api/comandas', (req, res) => {
    const limiteTempo = Date.now() - (90 * 60 * 1000);
    db.run(`DELETE FROM comandas WHERE timestamp < ?`, [limiteTempo], () => {
        db.all("SELECT * FROM comandas ORDER BY timestamp DESC", [], (err, rows) => {
            if (err) return res.status(500).json({ erro: err.message });
            const formatadas = rows.map(c => ({
                ...c,
                itens: JSON.parse(c.itens || '[]'),
                data: c.timestamp
            }));
            res.json(formatadas);
        });
    });
});

// Criar comanda (Checkout do cliente)
app.post('/api/comandas', (req, res) => {
    const { cliente, telefone, endereco, total, itens } = req.body;
    const timestamp = Date.now();
    const query = `INSERT INTO comandas (cliente, telefone, endereco, total, itens, timestamp) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [cliente, telefone, endereco, total, JSON.stringify(itens), timestamp], function(err) {
        if (err) return res.status(500).json({ erro: err.message });
        res.json({ id: this.lastID, mensagem: 'Comanda criada com sucesso!' });
    });
});

// Login Admin
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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/painel.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'painel.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
