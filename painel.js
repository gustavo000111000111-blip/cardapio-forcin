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

async function carregarComandas() {
    try {
        const resposta = await fetch(`${API_URL}/comandas`);
        if (!resposta.ok) return;
        const comandas = await resposta.json();
        renderizarComandas(comandas);
        renderizarPainelFretes(comandas);
    } catch (erro) {
        console.error('Erro ao carregar comandas:', erro);
    }
}

function renderizarComandas(comandas) {
    const container = document.getElementById('gridComandas');
    if (!container) return;

    if (!comandas || comandas.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">Nenhuma comanda recebida ainda.</p>';
        return;
    }

    container.innerHTML = comandas.map(comanda => {
        const rawData = comanda.criado_em || comanda.data || comanda.timestamp;
        const dataHora = rawData ? new Date(rawData).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

        const codigoLetra = idParaCodigo(comanda.id);
        const valorFrete = Number(comanda.frete || 0);
        const valorItens = Number(comanda.total || 0);
        const valorTotalFinal = valorItens + valorFrete;

        // Tratamento seguro do objeto cliente
        let cliente = {};
        try {
            cliente = typeof comanda.cliente === 'string' ? JSON.parse(comanda.cliente) : (comanda.cliente || {});
        } catch (e) {
            cliente = { nome: comanda.cliente || 'Cliente', telefone: comanda.telefone || '', endereco: comanda.endereco || '' };
        }

        const nomeCliente = cliente.nome || 'Cliente';
        const telCliente = cliente.telefone || comanda.telefone || 'Não informado';
        const enderecoFormatado = cliente.endereco || comanda.endereco || 'Retirada no Balcão';

        // Tratamento dos itens
        let itens = [];
        try {
            itens = typeof comanda.itens === 'string' ? JSON.parse(comanda.itens) : (comanda.itens || []);
        } catch (e) {
            itens = [];
        }

        const itensHTML = Array.isArray(itens) ? itens.map(item => `
            <div class="item-box">
                <div class="item-titulo">🍕 ${item.titulo || item.nome || 'Item'} x${item.quantidade || 1}</div>
                ${item.detalhes ? `<div class="item-sub">Detalhes: ${item.detalhes}</div>` : ''}
                ${item.observacao ? `<div class="item-obs">Obs: ${item.observacao}</div>` : ''}
            </div>
        `).join('') : '';

        return `
            <div class="card-comanda" id="comanda-${comanda.id}">
                <!-- VIA COZINHA -->
                <div class="via-cozinha" id="via-cozinha-${comanda.id}">
                    <h3>
                        <span>🍕 COZINHA - #${codigoLetra}</span>
                        <span class="data">${dataHora}</span>
                    </h3>
                    <div class="itens-lista">${itensHTML}</div>
                    <button type="button" class="btn-imprimir-cozinha" onclick="imprimirVia(${comanda.id}, 'cozinha')">🖨️ Imprimir Via Cozinha</button>
                </div>

                <!-- VIA MOTOBOY -->
                <div class="via-motoboy" id="via-moto-${comanda.id}">
                    <h3>
                        <span>🛵 MOTOBOY - #${codigoLetra}</span>
                        <span class="data">${dataHora}</span>
                    </h3>
                    <div style="font-size: 1.05em; margin-bottom: 4px;"><strong>Cliente:</strong> ${nomeCliente}</div>
                    <div style="font-size: 0.95em; margin-bottom: 4px;"><strong>Telefone:</strong> ${telCliente}</div>

                    <div class="endereco-box">
                        <div style="font-size: 0.8em; color: #e74c3c; font-weight: bold;">ENDEREÇO DE ENTREGA:</div>
                        <div class="endereco-texto">📍 ${enderecoFormatado}</div>
                    </div>

                    <div style="margin: 8px 0; background: #fff; padding: 8px; border-radius: 4px;">
                        <div style="font-size: 0.85em; font-weight: bold; color: #2980b9; margin-bottom: 6px;">📦 ITENS PARA CONFERÊNCIA:</div>
                        <div class="itens-lista">${itensHTML}</div>
                    </div>

                    <div class="frete-box">
                        <label style="font-size:0.85em; font-weight:bold; color:#27ae60;">Frete (R$):</label>
                        <input type="number" step="0.50" class="frete-input" id="input-frete-${comanda.id}" value="${valorFrete.toFixed(2)}">
                        <button type="button" class="btn-salvar-frete" onclick="salvarFrete(${comanda.id})">💾 Salvar Frete</button>
                    </div>

                    <div style="margin-top: 10px; font-size: 0.95em;">
                        <div>Itens: R$ ${valorItens.toFixed(2).replace('.', ',')}</div>
                        <div>Frete: R$ <span id="txt-frete-${comanda.id}">${valorFrete.toFixed(2).replace('.', ',')}</span></div>
                        <div class="total" style="margin-top:4px;">Total Final: R$ <span id="txt-total-${comanda.id}">${valorTotalFinal.toFixed(2).replace('.', ',')}</span></div>
                    </div>

                    <button type="button" class="btn-imprimir-moto" onclick="imprimirVia(${comanda.id}, 'motoboy')">🖨️ Imprimir Via Motoboy</button>
                </div>
            </div>
        `;
    }).join('');
}

async function salvarFrete(idComanda) {
    const inputVal = document.getElementById(`input-frete-${idComanda}`)?.value;
    const valorFrete = parseFloat(inputVal) || 0;

    try {
        const resposta = await fetch(`${API_URL}/comandas/${idComanda}/frete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frete: valorFrete })
        });

        if (resposta.ok) {
            carregarComandas();
        } else {
            alert('Erro ao salvar frete.');
        }
    } catch (e) {
        console.error('Erro ao salvar frete:', e);
        alert('Falha na conexão ao salvar frete.');
    }
}

function renderizarPainelFretes(comandas) {
    const tbody = document.getElementById('tabelaFretes');
    const elemTotal = document.getElementById('totalFretesAcumulado');
    const elemQtd = document.getElementById('qtdEntregasFrete');

    if (!tbody || !elemTotal || !elemQtd) return;

    const fretesComandas = comandas.filter(c => Number(c.frete) > 0);

    if (fretesComandas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum frete adicionado ainda.</td></tr>';
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

        let cliente = {};
        try {
            cliente = typeof c.cliente === 'string' ? JSON.parse(c.cliente) : (c.cliente || {});
        } catch (e) {
            cliente = { nome: c.cliente || 'Cliente' };
        }
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

function imprimirVia(id, tipo) {
    const elementoAlvo = document.getElementById(tipo === 'cozinha' ? `via-cozinha-${id}` : `via-moto-${id}`);
    if (!elementoAlvo) return;

    const printArea = document.createElement('div');
    printArea.id = 'print-area';
    printArea.style.padding = '10px';
    printArea.style.background = '#fff';

    const clone = elementoAlvo.cloneNode(true);
    const botoes = clone.querySelectorAll('button, .frete-box');
    botoes.forEach(b => b.remove());

    printArea.appendChild(clone);
    document.body.appendChild(printArea);

    window.print();

    setTimeout(() => { printArea.remove(); }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarComandas();
    setInterval(carregarComandas, 10000);
});
