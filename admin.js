const SENHA_ADMIN = '21072026'; // Senha idêntica à configurada no server.js
let todosProdutos = [];
let idEditando = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
});

// ================= AUTENTICAÇÃO =================
function verificarLogin() {
    const senhaSalva = localStorage.getItem('admin_password');

    if (senhaSalva === SENHA_ADMIN) {
        carregarProdutos();
    } else {
        const senhaDigitada = prompt('Digite a senha do Painel Administrativo:');
        if (senhaDigitada === SENHA_ADMIN) {
            localStorage.setItem('admin_password', senhaDigitada);
            carregarProdutos();
        } else {
            alert('Senha incorreta! Acesso negado.');
            window.location.href = '/';
        }
    }
}

function sairPainel() {
    localStorage.removeItem('admin_password');
    window.location.href = '/';
}

// ================= CARREGAR E EXIBIR PRODUTOS =================
async function carregarProdutos() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) throw new Error('Erro ao buscar produtos');

        todosProdutos = await resposta.json();
        renderizarTabela(todosProdutos);
    } catch (erro) {
        console.error('Erro ao carregar lista de produtos:', erro);
        alert('Não foi possível carregar os itens do cardápio.');
    }
}

function renderizarTabela(lista) {
    const tabela = document.getElementById('tabelaProdutos');
    if (!tabela) return;

    if (lista.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    tabela.innerHTML = lista.map(p => {
        const precoExibicao = p.preco_unico > 0 
            ? `R$ ${p.preco_unico.toFixed(2)}` 
            : `G: R$ ${(p.preco_grande || 0).toFixed(2)}`;

        return `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>
                    <strong>${p.nome}</strong><br>
                    <small style="color:#666;">${p.descricao || 'Sem descrição'}</small>
                </td>
                <td><span class="badge">${p.categoria}</span> ${p.subcategoria ? `(${p.subcategoria})` : ''}</td>
                <td>${precoExibicao}</td>
                <td style="text-align: right;">
                    <button onclick="prepararEdicao(${p.id})" style="background:#27ae60; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-right:5px;">Editar</button>
                    <button onclick="excluirProduto(${p.id})" style="background:#c0392b; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ================= FILTRO DE BUSCA =================
function filtrarProdutos() {
    const termo = document.getElementById('inputBusca')?.value.toLowerCase() || '';
    const filtrados = todosProdutos.filter(p => 
        p.nome.toLowerCase().includes(termo) || 
        p.categoria.toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
}

// ================= PREPARAR FORMULÁRIO DE EDIÇÃO =================
function prepararEdicao(id) {
    const produto = todosProdutos.find(p => p.id === id);
    if (!produto) return;

    idEditando = id;

    // Preenche os campos do formulário
    document.getElementById('pCategoria').value = produto.categoria || 'pizza';
    document.getElementById('pSubcategoria').value = produto.subcategoria || 'tradicional';
    document.getElementById('pNome').value = produto.nome || '';
    document.getElementById('pDescricao').value = produto.descricao || '';
    
    document.getElementById('pBroto').value = produto.preco_broto || 0;
    document.getElementById('pMedia').value = produto.preco_media || 0;
    document.getElementById('pGrande').value = produto.preco_grande || 0;
    document.getElementById('pFamilia').value = produto.preco_familia || 0;
    document.getElementById('pItuana').value = produto.preco_ituana || 0;
    document.getElementById('pUnico').value = produto.preco_unico || 0;

    // Ajusta os botões e títulos da tela
    const tituloForm = document.getElementById('tituloFormulario');
    const btnSalvar = document.getElementById('btnSalvarForm');
    const btnCancelar = document.getElementById('btnCancelarForm');

    if (tituloForm) tituloForm.innerText = `Editando Produto #${id}`;
    if (btnSalvar) btnSalvar.innerText = 'Atualizar Produto';
    if (btnCancelar) btnCancelar.style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    idEditando = null;
    document.getElementById('formProduto').reset();

    const tituloForm = document.getElementById('tituloFormulario');
    const btnSalvar = document.getElementById('btnSalvarForm');
    const btnCancelar = document.getElementById('btnCancelarForm');

    if (tituloForm) tituloForm.innerText = 'Cadastrar Novo Produto';
    if (btnSalvar) btnSalvar.innerText = 'Cadastrar Produto';
    if (btnCancelar) btnCancelar.style.display = 'none';
}

// ================= SALVAR (CRIAR OU ATUALIZAR) =================
async function salvarProduto(event) {
    if (event) event.preventDefault();

    const dados = {
        categoria: document.getElementById('pCategoria').value,
        subcategoria: document.getElementById('pSubcategoria').value,
        nome: document.getElementById('pNome').value.trim(),
        descricao: document.getElementById('pDescricao').value.trim(),
        preco_broto: parseFloat(document.getElementById('pBroto').value) || 0,
        preco_media: parseFloat(document.getElementById('pMedia').value) || 0,
        preco_grande: parseFloat(document.getElementById('pGrande').value) || 0,
        preco_familia: parseFloat(document.getElementById('pFamilia').value) || 0,
        preco_ituana: parseFloat(document.getElementById('pItuana').value) || 0,
        preco_unico: parseFloat(document.getElementById('pUnico').value) || 0
    };

    if (!dados.nome) {
        alert('Por favor, informe o nome do produto.');
        return;
    }

    const url = idEditando ? `/api/produtos/${idEditando}` : '/api/produtos';
    const metodo = idEditando ? 'PUT' : 'POST';

    try {
        const resposta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': SENHA_ADMIN
            },
            body: JSON.stringify(dados)
        });

        const resData = await resposta.json();

        if (resposta.ok) {
            alert(idEditando ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
            cancelarEdicao();
            carregarProdutos();
        } else {
            alert(`Erro do servidor: ${resData.erro || 'Falha ao salvar'}`);
        }
    } catch (erro) {
        console.error('Erro ao enviar requisição:', erro);
        alert('Erro ao se comunicar com o servidor.');
    }
}

// ================= EXCLUIR PRODUTO =================
async function excluirProduto(id) {
    if (!confirm(`Tem certeza que deseja excluir o produto #${id}?`)) return;

    try {
        const resposta = await fetch(`/api/produtos/${id}`, {
            method: 'DELETE',
            headers: {
                'x-admin-password': SENHA_ADMIN
            }
        });

        if (resposta.ok) {
            alert('Produto removido!');
            carregarProdutos();
        } else {
            const resData = await resposta.json();
            alert(`Erro: ${resData.erro}`);
        }
    } catch (erro) {
        console.error('Erro ao excluir:', erro);
        alert('Falha ao tentar excluir o produto.');
    }
}
