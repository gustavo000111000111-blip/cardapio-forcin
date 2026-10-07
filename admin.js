const API_URL = '/api';
let adminSenha = '';

function autenticar() {
  const inputPass = document.getElementById('admin-pass');
  if (inputPass) {
    adminSenha = inputPass.value;
  }
  carregarProdutosAdmin();
}

async function carregarProdutosAdmin() {
  try {
    const res = await fetch(`${API_URL}/produtos`);
    const produtos = await res.json();
    renderizarTabelaAdmin(produtos);
  } catch (err) {
    console.error('Erro ao carregar produtos:', err);
  }
}

function renderizarTabelaAdmin(produtos) {
  const tbody = document.getElementById('tabelaProdutos');
  if (!tbody) return;

  if (!produtos || produtos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
    return;
  }

  tbody.innerHTML = produtos.map((p, index) => `
    <tr>
      <td>${p.id}</td>
      <td><strong>${p.nome}</strong><br><small style="color:#666;">${p.descricao || ''}</small></td>
      <td><span class="badge">${p.categoria}</span></td>
      <td>R$ ${Number(p.preco_grande || p.preco_unico || p.preco_broto || 0).toFixed(2)}</td>
      <td style="text-align: right;">
        <button onclick="moverOrdem(${index}, -1)">⬆️</button>
        <button onclick="moverOrdem(${index}, 1)">⬇️</button>
        <button onclick="editarProduto(${p.id})">✏️</button>
        <button onclick="excluirProduto(${p.id})">❌</button>
      </td>
    </tr>
  `).join('');
}

async function salvarProduto(event) {
  if (event) event.preventDefault();

  const produtoData = {
    id: document.getElementById('formProduto').dataset.id || null,
    categoria: document.getElementById('pCategoria').value,
    subcategoria: document.getElementById('pSubcategoria').value,
    nome: document.getElementById('pNome').value,
    descricao: document.getElementById('pDescricao').value,
    preco_broto: parseFloat(document.getElementById('pBroto').value) || 0,
    preco_media: parseFloat(document.getElementById('pMedia').value) || 0,
    preco_grande: parseFloat(document.getElementById('pGrande').value) || 0,
    preco_familia: parseFloat(document.getElementById('pFamilia').value) || 0,
    preco_ituana: parseFloat(document.getElementById('pItuana').value) || 0,
    preco_unico: parseFloat(document.getElementById('pUnico').value) || 0
  };

  const metodo = produtoData.id ? 'PUT' : 'POST';
  const url = produtoData.id ? `${API_URL}/produtos/${produtoData.id}` : `${API_URL}/produtos`;

  try {
    const res = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminSenha
      },
      body: JSON.stringify(produtoData)
    });

    if (res.ok) {
      cancelarEdicao();
      carregarProdutosAdmin();
    } else {
      alert('Erro ao salvar produto. Verifique a senha do admin.');
    }
  } catch (err) {
    console.error('Erro ao salvar:', err);
  }
}

async function excluirProduto(id) {
  if (!confirm('Deseja realmente apagar este produto?')) return;

  try {
    const res = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': adminSenha
      }
    });

    if (res.ok) {
      carregarProdutosAdmin();
    } else {
      alert('Erro ao apagar produto.');
    }
  } catch (err) {
    console.error('Erro ao excluir:', err);
  }
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
      'x-admin-password': 3003
    },
    body: JSON.stringify({ ordem: ordemIds })
  });

  carregarProdutosAdmin();
}

function cancelarEdicao() {
  const form = document.getElementById('formProduto');
  if (form) {
    form.reset();
    delete form.dataset.id;
  }
  const btnCancelar = document.getElementById('btnCancelarForm');
  if (btnCancelar) btnCancelar.style.display = 'none';
  const btnSalvar = document.getElementById('btnSalvarForm');
  if (btnSalvar) btnSalvar.innerText = 'Cadastrar Produto';
  const titulo = document.getElementById('tituloFormulario');
  if (titulo) titulo.innerText = 'Cadastrar Novo Produto';
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutosAdmin();
});
