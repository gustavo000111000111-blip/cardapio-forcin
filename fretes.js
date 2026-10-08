const API_URL = '/api';
let listaComandasGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarFretes();
    setInterval(carregarFretes, 15000);
});

function mudarAba(nomeAba, elementoBotao) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`aba-${nomeAba}`).classList.add('active');
    elementoBotao.classList.add('active');
}

async function carregarFretes() {
    try {
        const resposta = await fetch(`${API_URL}/comandas`);
        if (!resposta.ok) throw new Error('Falha ao buscar comandas');

        listaComandasGlobal = await resposta.json();
        processarDadosFretes(listaComandasGlobal);
    } catch (erro) {
        console.error('Erro ao carregar dados de frete:', erro);
    }
}

function processarDadosFretes(comandas) {
    // 1. Extrair epopular os bairros dinamicamente
    const selectBairro = document.getElementById('filtroBairro');
    if (!selectBairro) return;

    const bairroSelecionadoAtual = selectBairro.value;

    // Extrair bairros únicos a partir dos endereços (ex: pegando o texto após vírgula ou hífen, ou listando endereços únicos)
    const bairrosSet = new Set();
    comandas.forEach(c => {
        let cliente = {};
        try {
            cliente = typeof c.cliente === 'string' ? JSON.parse(c.cliente) : (c.cliente || {});
        } catch (e) {
            cliente = { endereco: c.endereco || '' };
        }
        let end = cliente.endereco || c.endereco || '';
        if (end && end !== 'Retirada no Balcão') {
            bairrosSet.add(end.trim());
        }
    });

    let opcoesHtml = '<option value="todos">-- Todos os Bairros / Endereços Salvos --</option>';
    bairrosSet.forEach(bairro => {
        opcoesHtml += `<option value="${bairro}">${bairro}</option>`;
    });
    selectBairro.innerHTML = opcoesHtml;
    selectBairro.value = bairroSelecionadoAtual;

    filtrarPorBairro();
    atualizarMetricas(comandas);
}

function filtrarPorBairro() {
    const bairroFiltro = document.getElementById('filtroBairro').value;
    const tbody = document.getElementById('tabelaBairros');
    if (!tbody) return;

    const filtradas = listaComandasGlobal.filter(c => {
        let cliente = {};
        try {
            cliente = typeof c.cliente === 'string' ? JSON.parse(c.cliente) : (c.cliente || {});
        } catch (e) {
            cliente = { endereco: c.endereco || '' };
        }
        let end = cliente.endereco || c.endereco || '';
        if (bairroFiltro === 'todos') return true;
        return end.trim() === bairroFiltro;
    });

    if (filtradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhum registo encontrado para este endereço/bairro.</td></tr>';
        return;
    }

    tbody.innerHTML = filtradas.map(c => {
        let cliente = {};
        try {
            cliente = typeof c.cliente === 'string' ? JSON.parse(c.cliente) : (c.cliente || {});
        } catch (e) {
            cliente = { endereco: c.endereco || '' };
        }
        let enderecoCompleto = cliente.endereco || c.endereco || 'Retirada no Balcão';
        let valorFrete = Number(c.frete || 0);
        let valorPedido = Number(c.total || 0);

        return `
            <tr>
                <td>📍 ${enderecoCompleto}</td>
                <td style="color:#27ae60; font-weight:bold;">R$ ${valorFrete.toFixed(2).replace('.', ',')}</td>
                <td style="font-weight:bold;">R$ ${valorPedido.toFixed(2).replace('.', ',')}</td>
            </tr>
        `;
    }).join('');
}

function atualizarMetricas(comandas) {
    const elemQtd = document.getElementById('qtdTotalPedidos');
    const elemValorTotal = document.getElementById('valorTotalPedidos');
    const elemValorFrete = document.getElementById('valorTotalFretes');

    if (!elemQtd || !elemValorTotal || !elemValorFrete) return;

    let qtdTotal = comandas.length;
    let somaPedidos = 0;
    let somaFretes = 0;

    comandas.forEach(c => {
        somaPedidos += Number(c.total || 0);
        somaFretes += Number(c.frete || 0);
    });

    elemQtd.innerText = qtdTotal;
    elemValorTotal.innerText = `R$ ${somaPedidos.toFixed(2).replace('.', ',')}`;
    elemValorFrete.innerText = `R$ ${somaFretes.toFixed(2).replace('.', ',')}`;
}

function alterarSenhaAdministrativa() {
    const novaSenha = document.getElementById('novaSenhaInput')?.value.trim();
    if (!novaSenha) {
        alert('Por favor, digite uma senha válida.');
        return;
    }

    // Armazena a senha localmente no navegador ou avisa para atualizar no servidor
    localStorage.setItem('forcin_admin_pass', novaSenha);
    alert('Senha alterada com sucesso! Lembre-se de atualizar também a constante de senha no seu servidor, se necessário.');
    document.getElementById('novaSenhaInput').value = '';
}
