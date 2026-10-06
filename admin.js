const API_URL = '/api';
let adminSenha = '';

function autenticar() {
  adminSenha = document.getElementById('admin-pass').value;
  carregarProdutosAdmin();
}

async function carregarProdutosAdmin() {
  const res = await fetch(`${API_URL}/produtos`);
  const produtos = await res.json();
  renderizarTabelaAdmin(produtos);
}

function renderizarTabelaAdmin(produtos) {
const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = produtos.map((p, index) => `
    <tr>
      <td>${p.nome}</td>
      <td>${p.categoria}</td>
      <td>R$ ${p.preco_grande || p.preco_unico || 0}</td>
      <td>
        <button onclick="moverOrdem(${index}, -1)">⬆️</button>
        <button onclick="moverOrdem(${index}, 1)">⬇️</button>
      </td>
      <td>
        <button onclick="editarProduto(${p.id})">✏️</button>
        <button onclick="excluirProduto(${p.id})">❌</button>
      </td>
    </tr>
  `).join('');
}

async function salvarProduto(produtoData) {
  const metodo = produtoData.id ? 'PUT' : 'POST';
  const url = produtoData.id ? `${API_URL}/produtos/${produtoData.id}` : `${API_URL}/produtos`;

  await fetch(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminSenha
    },
    body: JSON.stringify(produtoData)
  });

  carregarProdutosAdmin();
}

async function moverOrdem(index, direcao) {
  const res = await fetch(`${API_URL}/produtos`);
  let produtos = await res.json();

  const novoIndex = index + direcao;
  if (novoIndex < 0 || novoIndex >= produtos.length) return;

  const temp = produtos[index];
  produtos[index] = produtos[novoIndex];
  produtos[novoIndex] = temp;

  const ordemIds = produtos.map(p => p.id);

  await fetch(`${API_URL}/produtos/reordenar`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': adminSenha
    },
    body: JSON.stringify({ ordem: ordemIds })
  });

  carregarProdutosAdmin();
}
