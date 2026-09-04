
// --- CONFIGURAÇÕES DE TAMANHOS ---
const TAMANHOS = [
    { id: 'broto', nome: 'Broto (25cm - 4 fatias)', maxSabores: 2 },
    { id: 'media', nome: 'Média (30cm - 6 fatias)', maxSabores: 2 },
    { id: 'grande', nome: 'Grande (35cm - 8 fatias)', maxSabores: 2 },
    { id: 'familia', nome: 'Família (40cm - 12 fatias)', maxSabores: 3 },
    { id: 'ituana', nome: 'Ituana (50cm - 16 fatias)', maxSabores: 3 }
];

let SABORES = [];
let PROMOCOES = [];
let BEBIDAS = [];

const DESTAQUES_IDS = [63, 82, 47, 4, 13, 57, 50, 44];

// ================= ESTADO GLOBAL DO SISTEMA =================
const TELEFONE_WHATSAPP = '5511950826677';
const CHAVE_LOCAL_STORAGE = 'forcin_pizzaria_cliente';

let tamanhoSelecionado = TAMANHOS[2]; // Padrão Grande
let saboresSelecionados = [];
let carrinho = [];

// ================= INICIALIZAÇÃO DA APLICAÇÃO =================
document.addEventListener('DOMContentLoaded', () => {
    carregarDadosSalvosCliente();
    carregarCardapioDoBanco();
    renderizarTamanhos();

    atualizarMontagemUI();
    atualizarCarrinhoUI();
    atualizarBadgeStatusLoja();
    configurarEventosInterface();
    toggleCamposImovel();
});

// ================= CONFIGURAÇÃO DE EVENTOS DA INTERFACE =================
function configurarEventosInterface() {
    const selectPagto = document.getElementById('cliPagamento');
    if (selectPagto) selectPagto.addEventListener('change', toggleTroco);

    const selectEntrega = document.getElementById('cliEntrega');
    if (selectEntrega) selectEntrega.addEventListener('change', toggleEndereco);

    const selectTipoImovel = document.getElementById('cliTipoImovel');
    if (selectTipoImovel) selectTipoImovel.addEventListener('change', toggleCamposImovel);
}

// ================= CONTROLE DE ABAS =================
function trocarAba(aba, btn) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
    });

    const target = document.getElementById(`aba-${aba}`);
    if (target) target.classList.add('active');
    if (btn) btn.classList.add('active');
}

// ================= INTEGRAÇÃO COM BANCO DE DADOS (API) =================
async function carregarCardapioDoBanco() {
    try {
        const resposta = await fetch('/api/produtos');
        if (!resposta.ok) return;

        const produtosBanco = await resposta.json();

        if (Array.isArray(produtosBanco) && produtosBanco.length > 0) {
            const pizzasBanco = produtosBanco.filter(p => p.categoria === 'pizza');
            if (pizzasBanco.length > 0) {
                SABORES = pizzasBanco.map(p => ({
                    id: p.id,
                    categoria: p.subcategoria || 'tradicional',
                    nome: p.nome,
                    desc: p.descricao || '',
                    precos: {
                        broto: p.preco_broto || 0,
                        media: p.preco_media || 0,
                        grande: p.preco_grande || 0,
                        familia: p.preco_familia || 0,
                        ituana: p.preco_ituana || 0
                    }
                }));
            }

            const promosBanco = produtosBanco.filter(p => p.categoria === 'promocao');
            if (promosBanco.length > 0) {
                PROMOCOES = promosBanco.map(p => {
                    const preco = p.preco_unico || p.preco_grande || 0;
                    return {
                        id: p.id,
                        nome: p.nome,
                        desc: p.descricao || '',
                        precos: { broto: preco, media: preco, grande: preco, familia: preco, ituana: preco }
                    };
                });
            }

            const bebidasBanco = produtosBanco.filter(p => p.categoria === 'bebida');
            if (bebidasBanco.length > 0) {
                BEBIDAS = bebidasBanco.map(p => {
                    const preco = p.preco_unico || p.preco_grande || 0;
                    return {
                        id: p.id,
                        nome: p.nome,
                        desc: p.descricao || '',
                        precos: { broto: preco, media: preco, grande: preco, familia: preco, ituana: preco }
                    };
                });
            }

            renderizarDestaques();
            renderizarCardapio(SABORES, 'cardapioContainer', 'montador');
            renderizarCardapio(PROMOCOES, 'promocoesContainer', 'promo');
            renderizarCardapio(BEBIDAS, 'bebidasContainer', 'bebida');
        }
    } catch (erro) {
        console.error('Erro ao conectar com a API do banco:', erro);
    }
}

// ================= VERIFICAÇÃO DE HORÁRIO =================
function verificarLojaAberta() {
    const agora = new Date();
    const tempoAtual = agora.getHours() * 60 + agora.getMinutes();
    return tempoAtual >= (18 * 60) && tempoAtual <= (23 * 60 + 30);
}

function atualizarBadgeStatusLoja() {
    const badge = document.getElementById('statusLojaBadge');
    const texto = document.getElementById('statusLojaTexto');
    if (!badge || !texto) return;

    if (verificarLojaAberta()) {
        badge.className = 'status-badge aberto';
        texto.textContent = '🟢 Aberto Agora (18h às 23h30)';
    } else {
        badge.className = 'status-badge fechado';
        texto.textContent = '🔴 Fechado no Momento (Abre às 18:00)';
    }
}

// ================= PERSISTÊNCIA LOCALSTORAGE =================
function salvarDadosCliente() {
    const dadosCliente = {
        nome: document.getElementById('cliNome')?.value || '',
        telefone: document.getElementById('cliTelefone')?.value || '',
        entrega: document.getElementById('cliEntrega')?.value || 'delivery',
        tipoImovel: document.getElementById('cliTipoImovel')?.value || 'casa_rua'
    };
    try {
        localStorage.setItem(CHAVE_LOCAL_STORAGE, JSON.stringify(dadosCliente));
    } catch (e) {
        console.error("Erro ao salvar dados do cliente:", e);
    }
}

function carregarDadosSalvosCliente() {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_LOCAL_STORAGE);
        if (!dadosSalvos) return;
        const c = JSON.parse(dadosSalvos);

        if (c.nome && document.getElementById('cliNome')) document.getElementById('cliNome').value = c.nome;
        if (c.telefone && document.getElementById('cliTelefone')) document.getElementById('cliTelefone').value = c.telefone;
        if (c.entrega && document.getElementById('cliEntrega')) document.getElementById('cliEntrega').value = c.entrega;
        if (c.tipoImovel && document.getElementById('cliTipoImovel')) document.getElementById('cliTipoImovel').value = c.tipoImovel;

        toggleEndereco();
        toggleCamposImovel();
    } catch (e) {
        console.error("Erro ao recuperar LocalStorage:", e);
    }
}

// ================= RENDERIZAÇÃO DA INTERFACE =================
function normalizarNomeFoto(nome) {
    return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function renderizarDestaques() {
    const container = document.getElementById('destaquesContainer');
    if (!container) return;

    let itensDestaque = DESTAQUES_IDS.map(id =>
        SABORES.find(s => String(s.id) === String(id)) ||
        PROMOCOES.find(p => String(p.id) === String(id)) ||
        BEBIDAS.find(b => String(b.id) === String(id))
    ).filter(Boolean);

    if (itensDestaque.length === 0 && SABORES.length > 0) {
        itensDestaque = SABORES.slice(0, 9);
    }

    container.innerHTML = itensDestaque.map(pizza => {
        const foto = `${normalizarNomeFoto(pizza.nome)}.jpg`;
        const precoValor = pizza.precos ? pizza.precos.grande : (pizza.preco || 0);
        const precoGrande = Number(precoValor).toFixed(2).replace('.', ',');

        return `
            <div class="destaque-card" onclick="adicionarDestaqueAoCarrinho('${pizza.id}', event)">
                <div>
                    <img src="img/${foto}" alt="${pizza.nome}" onerror="this.src='img/default.jpg'">
                    <div class="destaque-info">
                        <strong>${pizza.nome}</strong>
                        <small>${pizza.desc}</small>
                    </div>
                </div>
                <div class="destaque-bottom">
                    <div class="destaque-price">
                        <span>Grande (8 fatias)</span>
                        R$ ${precoGrande}
                    </div>
                    <button class="btn-add-sabor">+</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarTamanhos() {
    const container = document.getElementById('tamanhosContainer');
    if (!container) return;

    container.innerHTML = TAMANHOS.map(t => `
        <button class="option-btn ${tamanhoSelecionado.id === t.id ? 'selected' : ''}" onclick="selecionarTamanho('${t.id}')">
            <span class="title">${t.nome.split(' (')[0]}</span>
            <span class="sub">${t.nome.split(' (')[1].replace(')', '')}</span>
        </button>
    `).join('');
}

function renderizarCardapio(lista, containerId, tipo) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(lista) || lista.length === 0) {
        container.innerHTML = '<p style="color:#777; padding:15px; text-align:center;">Nenhum item encontrado.</p>';
        return;
    }

    container.innerHTML = lista.map(item => {
        const precoVal = item.precos ? item.precos[tamanhoSelecionado.id] : (item.preco || 0);
        const precoDisplay = `R$ ${Number(precoVal).toFixed(2).replace('.', ',')}`;

        let btnClick = `tentarAdicionarSabor('${item.id}')`;
        if (tipo === 'promo') btnClick = `tentarAdicionarPromocao('${item.id}')`;
        if (tipo === 'bebida') btnClick = `tentarAdicionarBebida('${item.id}')`;

        return `
            <div class="menu-item">
                <div class="menu-item-left">
                    <div class="menu-item-info">
                        <strong>${item.nome}</strong>
                        <small>${item.desc || item.descricao || ''}</small>
                        <div class="menu-item-price">${precoDisplay}</div>
                    </div>
                </div>
                <div>
                    <button class="btn-add-sabor" onclick="${btnClick}">+</button>
                </div>
            </div>
        `;
    }).join('');
}

// ================= LÓGICA DE MONTAGEM E CALCULOS =================
function selecionarTamanho(id) {
    tamanhoSelecionado = TAMANHOS.find(t => t.id === id);
    if (saboresSelecionados.length > tamanhoSelecionado.maxSabores) {
        saboresSelecionados = saboresSelecionados.slice(0, tamanhoSelecionado.maxSabores);
    }
    renderizarTamanhos();
    renderizarCardapio(SABORES, 'cardapioContainer', 'montador');
    renderizarCardapio(PROMOCOES, 'promocoesContainer', 'promo');
    renderizarCardapio(BEBIDAS, 'bebidasContainer', 'bebida');
    atualizarMontagemUI();
}

function tentarAdicionarSabor(saborId) {
    const sabor = SABORES.find(s => String(s.id) === String(saborId));
    if (!sabor) return;

    if (saboresSelecionados.length < tamanhoSelecionado.maxSabores) {
        saboresSelecionados.push(sabor);
        atualizarMontagemUI();
    } else {
        abrirModalLimite(sabor.nome);
    }
}

function removerSaborSelecionado(index) {
    saboresSelecionados.splice(index, 1);
    atualizarMontagemUI();
}

function calcularPrecoMontagem() {
    if (!saboresSelecionados || saboresSelecionados.length === 0) return 0;
    const precos = saboresSelecionados.map(item => item.precos ? item.precos[tamanhoSelecionado.id] : (item.preco || 0));
    return Math.max(...precos);
}

function atualizarMontagemUI() {
    const listaElem = document.getElementById('listaSaboresSelecionados');
    const precoElem = document.getElementById('precoAtual');
    const statusTag = document.getElementById('statusTag');
    const statusTexto = document.getElementById('statusTexto');
    const limiteText = document.getElementById('limiteSaborText');
    const btnAddCar = document.getElementById('btnAdicionarCarrinho');

    if (precoElem) precoElem.innerText = calcularPrecoMontagem().toFixed(2).replace('.', ',');
    if (limiteText) limiteText.innerText = `Limite: ${tamanhoSelecionado.maxSabores} sabores`;
    if (statusTag) statusTag.innerText = `${saboresSelecionados.length} / ${tamanhoSelecionado.maxSabores} SABORES`;
    if (statusTexto) statusTexto.innerText = saboresSelecionados.length === 0 ? 'Selecione os sabores' : 'Sabores selecionados com sucesso';
    if (btnAddCar) btnAddCar.disabled = saboresSelecionados.length === 0;

    if (listaElem) {
        if (saboresSelecionados.length === 0) {
            listaElem.innerHTML = '<li style="color: #888;">Nenhum sabor selecionado</li>';
        } else {
            const fracao = `1/${saboresSelecionados.length}`;
            listaElem.innerHTML = saboresSelecionados.map((s, index) => `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px dashed var(--border); font-size:14px;">
                    <span><strong>${fracao}</strong> ${s.nome}</span>
                    <button class="btn-remove-flavor" onclick="removerSaborSelecionado(${index})">Remover</button>
                </li>
            `).join('');
        }
    }
}

function adicionarMontagemAoCarrinho() {
    if (saboresSelecionados.length === 0) {
        alert('Selecione pelo menos 1 sabor!');
        return;
    }

    const obsInput = document.getElementById('obsMontagem');
    const observacao = obsInput ? obsInput.value.trim() : '';
    const fracao = `1/${saboresSelecionados.length}`;
    const listaSaboresTexto = saboresSelecionados.map(s => `${fracao} ${s.nome}`).join(' + ');
    const precoFinal = calcularPrecoMontagem();

    carrinho.push({
        id: Date.now(),
        tipo: 'pizza',
        titulo: `Pizza ${tamanhoSelecionado.nome.split(' (')[0]}`,
        detalhes: listaSaboresTexto,
        preco: precoFinal,
        quantidade: 1,
        observacao: observacao
    });

    saboresSelecionados = [];
    if (obsInput) obsInput.value = '';
    atualizarMontagemUI();
    atualizarCarrinhoUI();
    mostrarNotificacao('Pizza adicionada ao carrinho!');
}

// ================= ADIÇÃO DIRETA =================
function adicionarDestaqueAoCarrinho(saborId, event) {
    if (event) event.stopPropagation();
    const pizza = SABORES.find(s => String(s.id) === String(saborId)) || PROMOCOES.find(p => String(p.id) === String(saborId)) || BEBIDAS.find(b => String(b.id) === String(saborId));
    if (!pizza) return;

    const precoVal = pizza.precos ? pizza.precos.grande : (pizza.preco || 0);

    carrinho.push({
        id: Date.now(),
        tipo: 'pizza',
        titulo: `Pizza Grande (35cm - 8 fatias)`,
        detalhes: `Sabor Inteiro: ${pizza.nome}`,
        preco: precoVal,
        quantidade: 1,
        observacao: ''
    });
    atualizarCarrinhoUI();
    mostrarNotificacao(`Pizza ${pizza.nome} adicionada!`);
}

function tentarAdicionarPromocao(id) {
    const promo = PROMOCOES.find(p => String(p.id) === String(id));
    if (!promo) return;

    const precoVal = promo.precos ? promo.precos.grande : (promo.preco || 0);
    carrinho.push({
        id: Date.now(),
        tipo: 'promocao',
        titulo: promo.nome,
        detalhes: promo.desc,
        preco: precoVal,
        quantidade: 1,
        observacao: ''
    });
    atualizarCarrinhoUI();
    mostrarNotificacao(`Promoção "${promo.nome}" adicionada!`);
}

function tentarAdicionarBebida(id) {
    const bebida = BEBIDAS.find(b => String(b.id) === String(id));
    if (!bebida) return;

    const precoVal = bebida.precos ? bebida.precos[tamanhoSelecionado.id] : (bebida.preco || 0);

    const itemExistente = carrinho.find(item => item.titulo === bebida.nome);
    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: Date.now(),
            tipo: 'bebida',
            titulo: bebida.nome,
            detalhes: bebida.desc,
            preco: precoVal,
            quantidade: 1,
            observacao: ''
        });
    }

    atualizarCarrinhoUI();
    mostrarNotificacao(`Bebida "${bebida.nome}" adicionada!`);
}

// ================= CARRINHO =================
function alterarQuantidade(id, delta) {
    const item = carrinho.find(i => i.id === id);
    if (!item) return;

    item.quantidade += delta;
    if (item.quantidade <= 0) {
        removerDoCarrinho(id);
    } else {
        atualizarCarrinhoUI();
    }
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
    const container = document.getElementById('itensCarrinho');
    const totalSide = document.getElementById('totalPedidoSide');
    const qtdSide = document.getElementById('qtdCarrinhoSide');
    const btnCheckout = document.getElementById('btnCheckoutSide');
    const contadorFlutuante = document.getElementById('contadorFlutuante');

    if (!container) return;

    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    if (totalSide) totalSide.innerText = total.toFixed(2).replace('.', ',');

    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    if (qtdSide) qtdSide.innerText = totalItens;
    if (contadorFlutuante) contadorFlutuante.innerText = totalItens;
    if (btnCheckout) btnCheckout.disabled = carrinho.length === 0;

    if (carrinho.length === 0) {
        container.innerHTML = '<p style="color: #888; font-size: 13px; text-align: center;">O carrinho está vazio.</p>';
        return;
    }

    container.innerHTML = carrinho.map(item => `
        <div class="cart-item">
            <button class="btn-del-cart" onclick="removerDoCarrinho(${item.id})">&times;</button>
            <div class="cart-item-title">${item.titulo}</div>
            <div class="cart-item-details">${item.detalhes}</div>
            ${item.observacao ? `<div style="font-size:11px; color:#d35400; font-style:italic;">Obs: ${item.observacao}</div>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <div class="cart-item-price">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <button onclick="alterarQuantidade(${item.id}, -1)" style="padding: 2px 6px; cursor: pointer;">-</button>
                    <span style="font-size: 13px; font-weight: bold;">${item.quantidade}</span>
                    <button onclick="alterarQuantidade(${item.id}, 1)" style="padding: 2px 6px; cursor: pointer;">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ================= MODAL CHECKOUT & FORMULÁRIO =================
function abrirCheckout() {
    if (carrinho.length === 0) return;
    atualizarResumoCheckout();
    document.getElementById('modalCheckout').style.display = 'flex';
}

function fecharCheckout() {
    document.getElementById('modalCheckout').style.display = 'none';
}

function atualizarResumoCheckout() {
    const resumo = document.getElementById('resumoCheckoutItens');
    const totalCheckout = document.getElementById('totalCheckout');
    if (!resumo || !totalCheckout) return;

    let html = '';
    let total = 0;
    carrinho.forEach(item => {
        const sub = item.preco * item.quantidade;
        total += sub;
        html += `<div>• ${item.quantidade}x ${item.titulo} (${item.detalhes})</div>`;
    });
    resumo.innerHTML = html;
    totalCheckout.innerText = total.toFixed(2).replace('.', ',');
}

function toggleEndereco() {
    const tipo = document.getElementById('cliEntrega')?.value;
    const grupo = document.getElementById('grupoEndereco');
    if (grupo) grupo.style.display = (tipo === 'delivery') ? 'block' : 'none';
}

function toggleCamposImovel() {
    const tipo = document.getElementById('cliTipoImovel')?.value;
    const extras = document.getElementById('camposExtrasImovel');
    if (!extras) return;

    if (tipo === 'apartamento') {
        extras.innerHTML = `
            <div class="form-group"><label>Bloco / Torre e Apto:</label><input type="text" id="cliBlocoApto" placeholder="Ex: Torre B, Apto 42"></div>
            <div class="form-group"><label>Rua e Número:</label><input type="text" id="cliRua" placeholder="Nome da rua e número"></div>
            <div class="form-group"><label>Bairro:</label><input type="text" id="cliBairro" placeholder="Nome do bairro"></div>
        `;
    } else if (tipo === 'condominio') {
        extras.innerHTML = `
            <div class="form-group"><label>Condomínio e Casa/Lote:</label><input type="text" id="cliCondoCasa" placeholder="Ex: Res. Flores, Casa 15"></div>
            <div class="form-group"><label>Rua e Número:</label><input type="text" id="cliRua" placeholder="Nome da rua e número"></div>
            <div class="form-group"><label>Bairro:</label><input type="text" id="cliBairro" placeholder="Nome do bairro"></div>
        `;
    } else {
        extras.innerHTML = `
            <div class="form-group"><label>Rua e Número:</label><input type="text" id="cliRua" placeholder="Ex: Rua das Flores, 123"></div>
            <div class="form-group"><label>Bairro:</label><input type="text" id="cliBairro" placeholder="Ex: Centro"></div>
            <div class="form-group"><label>Complemento (Opcional):</label><input type="text" id="cliComplemento" placeholder="Próximo a..."></div>
        `;
    }
}

function toggleTroco() {
    const pagtoSelecionado = document.querySelector('input[name="cliPagamento"]:checked');
    const pagto = pagtoSelecionado ? pagtoSelecionado.value : 'pix';

    const grupoPix = document.getElementById('grupoPix');
    const grupoTroco = document.getElementById('grupoTroco');

    if (grupoPix) {
        grupoPix.style.display = (pagto === 'pix') ? 'block' : 'none';
    }
    if (grupoTroco) {
        grupoTroco.style.display = (pagto === 'dinheiro') ? 'block' : 'none';
    }
}

function copiarChavePix() {
    const chaveInput = document.getElementById('chavePixInput');
    const msg = document.getElementById('msgPixCopiado');
    if (!chaveInput) return;

    chaveInput.select();
    navigator.clipboard.writeText(chaveInput.value);

    if (msg) {
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 3000);
    }
}

function rolarParaCarrinho() {
    const sidebar = document.querySelector('.col-carrinho');
    if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth' });
}

function fecharAviso() {
    const aviso = document.getElementById('aviso-mobile-pizza');
    if (aviso) aviso.style.display = 'none';
}

function mostrarNotificacao(mensagem) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#2c3e50; color:#fff; padding:12px 20px; border-radius:5px; box-shadow:0 3px 10px rgba(0,0,0,0.2); z-index:9999; transition:opacity 0.3s; font-size:14px;';
        document.body.appendChild(toast);
    }
    toast.innerText = mensagem;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ================= MODAL DE LIMITE DE SABORES =================
function abrirModalLimite(saborNome) {
    const modal = document.getElementById('modalLimite');
    const spanNovoSabor = document.getElementById('modalNovoSabor');
    const maxSabores = document.getElementById('modalMaxSabores');
    const tamanhoNome = document.getElementById('modalTamanhoNome');

    if (spanNovoSabor) spanNovoSabor.innerText = saborNome;
    if (maxSabores) maxSabores.innerText = tamanhoSelecionado.maxSabores;
    if (tamanhoNome) tamanhoNome.innerText = tamanhoSelecionado.nome.split(' ')[0];
    if (modal) modal.style.display = 'flex';
}

function fecharModalLimite() {
    const modal = document.getElementById('modalLimite');
    if (modal) modal.style.display = 'none';
    voltarMenuModal();
}

function abrirSubstituicao() {
    document.getElementById('modalMenuInicial').style.display = 'none';
    document.getElementById('modalTelaTroca').style.display = 'block';

    const listaTrocar = document.getElementById('listaParaTrocar');
    if (listaTrocar) {
        listaTrocar.innerHTML = saboresSelecionados.map((s, index) => `
            <div class="swap-item" onclick="substituirSabor(${index})">
                Remover: ${s.nome}
            </div>
        `).join('');
    }
}

function voltarMenuModal() {
    const menuInicial = document.getElementById('modalMenuInicial');
    const telaTroca = document.getElementById('modalTelaTroca');
    if (menuInicial) menuInicial.style.display = 'block';
    if (telaTroca) telaTroca.style.display = 'none';
}

function substituirSabor(index) {
    saboresSelecionados.splice(index, 1);
    fecharModalLimite();
    atualizarMontagemUI();
}

function confirmarMontarOutraPizza() {
    if (saboresSelecionados.length > 0) {
        adicionarMontagemAoCarrinho();
    }
    fecharModalLimite();
}

// ================= ENVIO WHATSAPP =================
async function enviarWhatsApp() {
    const nome = document.getElementById('cliNome')?.value.trim();
    const telefoneCliente = document.getElementById('cliTelefone')?.value.trim();
    const entrega = document.getElementById('cliEntrega')?.value;

    const pagamentoEl = document.querySelector('input[name="cliPagamento"]:checked');
    const pagamento = pagamentoEl ? pagamentoEl.value : 'pix';

    if (!nome) { alert('Por favor, informe seu nome.'); return; }
    if (!telefoneCliente) { alert('Por favor, informe seu telefone / WhatsApp.'); return; }

    let enderecoTexto = 'Retirada no Balcão';
    if (entrega === 'delivery') {
        const rua = document.getElementById('cliRua')?.value.trim();
        const bairro = document.getElementById('cliBairro')?.value.trim();
        if (!rua || !bairro) {
            alert('Preencha o endereço de entrega corretamente.');
            return;
        }
        enderecoTexto = `${rua} - Bairro: ${bairro}`;
    }

    let pagamentoTexto = pagamento.toUpperCase();
    if (pagamento === 'dinheiro') {
        const troco = document.getElementById('cliTroco')?.value.trim();
        pagamentoTexto += troco ? ` (Troco para R$ ${troco})` : ' (Sem troco)';
    }

    salvarDadosCliente();
    const totalCalculado = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    try {
        await fetch('/api/comandas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cliente: nome,
                telefone: telefoneCliente,
                endereco: enderecoTexto,
                total: totalCalculado,
                itens: carrinho
            })
        });
    } catch (e) {
        console.error('Erro ao registrar comanda no servidor:', e);
    }

    let msg = `==============================\n`;
    msg += `        *FORCIN PIZZARIA*       \n`;
    msg += `==============================\n\n`;
    msg += `👤 *Cliente:* ${nome}\n`;
    msg += `📞 *Telefone:* ${telefoneCliente}\n`;
    msg += `🛵 *Tipo:* ${entrega === 'delivery' ? 'Delivery' : 'Retirada'}\n`;
    if (entrega === 'delivery') {
        msg += `📍 *Endereço:* ${enderecoTexto}\n`;
    }
    msg += `💳 *Pagamento:* ${pagamentoTexto}\n\n`;
    msg += `------------------------------\n`;
    msg += `🍕 *ITENS DO PEDIDO*\n`;
    msg += `------------------------------\n`;

    carrinho.forEach((item, index) => {
        const subtotal = (item.preco * item.quantidade).toFixed(2).replace('.', ',');
        msg += `*${index + 1}. [${item.quantidade}x] ${item.titulo}*\n`;
        msg += `   └ ${item.detalhes}\n`;
        if (item.observacao) msg += `   └ 📝 Obs: ${item.observacao}\n`;
        msg += `   └ Subtotal: R$ ${subtotal}\n\n`;
    });

    msg += `==============================\n`;
    msg += `💰 *TOTAL: R$ ${totalCalculado.toFixed(2).replace('.', ',')}*\n`;
    msg += `==============================`;

    window.open(`https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
}
