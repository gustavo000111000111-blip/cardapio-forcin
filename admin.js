const SENHA_ADMIN = '21072026';
let todosProdutos = [];
let idEditando = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
});

function sairPainel() {
    window.location.href = '/';
}

async function carregarProdutos() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) throw new Error('Falha ao buscar produtos');

        todosProdutos = await resposta.json();
        renderizarTabela(todosProdutos);
    } catch (erro) {
        console.error('Erro ao carregar lista de produtos:', erro);
        alert('Não foi possível carregar a lista de produtos do servidor.');
    }
}

function renderizarTabela(lista) {
    const tabela = document.getElementById('tabelaProdutos');
    if (!tabela) return;

    if (lista.length === 0) {
        tabela.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    tabela.innerHTML = lista.map((p, index) => {
        const precoExibicao = p.preco_unico > 0 
            ? `R$ ${Number(p.preco_unico).toFixed(2)}` 
            : `G: R$ ${Number(p.preco_grande || 0).toFixed(2)}`;

        return `
            <tr>
                <td><strong>#${p.id}</strong></td>
                <td>
                    <strong>${p.nome}</strong><br>
                    <small style="color:#666;">${p.descricao || 'Sem descrição'}</small>
                </td>
                <td><span class="badge">${p.categoria}</span> ${p.subcategoria ? `(${p.subcategoria})` : ''}</td>
                <td>${precoExibicao}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button onclick="moverProduto(${index}, -1)" title="Subir na lista" style="background:#2c3e50; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-right:3px;">⬆️</button>
                    <button onclick="moverProduto(${index}, 1)" title="Descer na lista" style="background:#2c3e50; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-right:8px;">⬇️</button>
                    <button onclick="prepararEdicao(${p.id})" style="background:#27ae60; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-right:5px;">Editar</button>
                    <button onclick="excluirProduto(${p.id})" style="background:#c0392b; color:#fff; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Excluir</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Move o produto para cima (-1) ou para baixo (+1) na ordem
async function moverProduto(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= todosProdutos.length) return;

    // Troca elementos de posição
    const temp = todosProdutos[index];
    todosProdutos[index] = todosProdutos[novoIndex];
    todosProdutos[novoIndex] = temp;

    // Atualiza a propriedade ordem
    const payload = todosProdutos.map((p, idx) => ({
        id: p.id,
        ordem: idx + 1
    }));

    renderizarTabela(todosProdutos);

    try {
        const resposta = await fetch('/api/produtos/reordenar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': SENHA_ADMIN
            },
            body: JSON.stringify({ itens: payload })
        });

        if (!resposta.ok) {
            alert('Erro ao salvar nova ordem no servidor.');
            carregarProdutos();
        }
    } catch (erro) {
        console.error('Erro na reordenação:', erro);
        carregarProdutos();
    }
}

function filtrarProdutos() {
    const termo = document.getElementById('inputBusca')?.value.toLowerCase() || '';
    const filtrados = todosProdutos.filter(p => 
        p.nome.toLowerCase().includes(termo) || 
        p.categoria.toLowerCase().includes(termo)
    );
    renderizarTabela(filtrados);
}

function prepararEdicao(id) {
    const produto = todosProdutos.find(p => Number(p.id) === Number(id));
    if (!produto) return;

    idEditando = id;

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

    document.getElementById('tituloFormulario').innerText = `Editando Produto #${id}`;
    document.getElementById('btnSalvarForm').innerText = 'Salvar Alterações';
    document.getElementById('btnCancelarForm').style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    idEditando = null;
    document.getElementById('formProduto').reset();

    document.getElementById('tituloFormulario').innerText = 'Cadastrar Novo Produto';
    document.getElementById('btnSalvarForm').innerText = 'Cadastrar Produto';
    document.getElementById('btnCancelarForm').style.display = 'none';
}

function obterNumero(idInput) {
    const val = parseFloat(document.getElementById(idInput)?.value);
    return isNaN(val) ? 0 : val;
}

async function salvarProduto(event) {
    if (event) event.preventDefault();

    const dados = {
        categoria: document.getElementById('pCategoria').value,
        subcategoria: document.getElementById('pSubcategoria').value,
        nome: document.getElementById('pNome').value.trim(),
        descricao: document.getElementById('pDescricao').value.trim(),
        preco_broto: obterNumero('pBroto'),
        preco_media: obterNumero('pMedia'),
        preco_grande: obterNumero('pGrande'),
        preco_familia: obterNumero('pGrande') ? obterNumero('pFamilia') : 0,
        preco_ituana: obterNumero('pItuana'),
        preco_unico: obterNumero('pUnico')
    };

    if (!dados.nome) {
        alert('Por favor, digite o nome do produto.');
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
            alert(`Erro no servidor (${resposta.status}): ${resData.erro || resData.mensagem || 'Falha ao salvar'}`);
        }
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        alert('Erro ao se comunicar com o servidor.');
    }
}

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
            alert('Produto excluído com sucesso!');
            carregarProdutos();
        } else {
            const resData = await resposta.json();
            alert(`Erro ao excluir: ${resData.erro || 'Acesso negado'}`);
        }
    } catch (erro) {
        console.error('Erro ao excluir:', erro);
        alert('Falha de conexão ao tentar excluir.');
    }
}
