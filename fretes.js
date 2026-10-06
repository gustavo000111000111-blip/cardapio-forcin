const API_URL = '/api';

function idParaCodigo(id) {
    let n = parseInt(id, 10);
    if (isNaN(n) || n <= 0) return id;
    let codigo = '';
    while (n > 0) {
        let resto = (n - 1) % 26;
        codigo = String.fromCharCode(65 + resto) + codigo;
        n = Math.floor((n - 1) / 26);
    }
    return codigo;
}

async function carregarFretes() {
    try {
        const resposta = await fetch(`${API_URL}/comandas`);
        const comandas = await resposta.json();
        renderizarPainelFretes(comandas);
    } catch (erro) {
        console.error('Erro ao carregar fretes:', erro);
    }
}

function renderizarPainelFretes(comandas) {
    const tbody = document.getElementById('tabelaFretes');
    const elemTotal = document.getElementById('totalFretesAcumulado');
    const elemQtd = document.getElementById('qtdEntregasFrete');

    if (!tbody || !elemTotal || !elemQtd) return;

    const fretesComandas = comandas.filter(c => Number(c.frete) > 0);

    if (fretesComandas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum frete registrado até ao momento.</td></tr>';
        elemTotal.innerText = 'R$ 0,00';
        elemQtd.innerText = '0';
        return;
    }

    let somaTotalFretes = 0;
    tbody.innerHTML = fretesComandas.map(c => {
        const fVal = Number(c.frete || 0);
        const totalVal = Number(c.total || 0) + fVal;
        somaTotalFretes += fVal;

        const rawData = c.criado_em || c.data || c.timestamp;
        const dataFmt = rawData ? new Date(rawData).toLocaleString('pt-BR') : '--';

        const cliente = typeof c.cliente === 'string' ? JSON.parse(c.cliente) : (c.cliente || {});
        const nomeCliente = cliente.nome || 'Cliente';

        return `
            <tr>
                <td><strong>#${idParaCodigo(c.id)}</strong></td>
                <td>${nomeCliente}</td>
                <td style="color:#27ae60; font-weight:bold;">R$ ${fVal.toFixed(2).replace('.', ',')}</td>
                <td>R$ ${totalVal.toFixed(2).replace('.', ',')}</td>
                <td>${dataFmt}</td>
            </tr>
        `;
    }).join('');

    elemTotal.innerText = `R$ ${somaTotalFretes.toFixed(2).replace('.', ',')}`;
    elemQtd.innerText = fretesComandas.length;
}

document.addEventListener('DOMContentLoaded', () => {
    carregarFretes();
    setInterval(carregarFretes, 10000); // Atualiza os fretes a cada 10 segundos
});
