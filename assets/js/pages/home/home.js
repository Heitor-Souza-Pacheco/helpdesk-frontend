// ===== AUTENTICAÇÃO =====
verificarAutenticacao();

// Exibe o email do usuário logado no perfil
const emailUsuario = sessionStorage.getItem('helpdesk_user') || 'usuário';
document.querySelector('.modal-username').textContent = emailUsuario;
document.querySelector('.modal-email').textContent = emailUsuario;

// Logout — limpa token e redireciona com flag para evitar loop
document.querySelector('.nav-logout').addEventListener('click', (e) => {
    e.preventDefault();
    removerToken();
    sessionStorage.removeItem('helpdesk_user');
    sessionStorage.setItem('helpdesk_logout', 'true');
    window.location.href = 'index.html';
});

// ===== PERFIL =====
const btnPerfil       = document.getElementById('btnPerfil');
const modalPerfil     = document.getElementById('modalPerfil');
const fecharPerfil    = document.getElementById('fecharPerfil');

btnPerfil.addEventListener('click', (e) => {
    e.preventDefault();
    modalPerfil.classList.add('aberto');
});

fecharPerfil.addEventListener('click', () => {
    modalPerfil.classList.remove('aberto');
});

// ===== VARIÁVEIS GLOBAIS =====
let todasPerguntas = [];

// ===== MAPA DE CATEGORIAS =====
const categoriaMap = {
    tecnico:    { label: 'Suporte Técnico', cls: 'badge-tecnico' },
    financeiro: { label: 'Financeiro',       cls: 'badge-financeiro' },
    rh:         { label: 'RH',               cls: 'badge-rh' },
    geral:      { label: 'Geral',            cls: 'badge-geral' },
};

// ===== CARREGAR PERGUNTAS DA API =====
async function carregarPerguntas() {
    try {
        const resposta = await fetchAutenticado('/pergunta');
        if (resposta.ok) {
            todasPerguntas = await resposta.json();
            renderizarCards(todasPerguntas);
            atualizarEstatisticas();
        } else if (resposta.status === 401 || resposta.status === 403) {
            removerToken();
            window.location.href = 'index.html';
        } else {
            console.error('Erro ao carregar perguntas:', resposta.status);
        }
    } catch (e) {
        console.error('Erro de conexão ao carregar perguntas:', e);
    }
}

// ===== RENDERIZAR CARDS =====
function renderizarCards(perguntas) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';

    if (perguntas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma pergunta encontrada. Seja o primeiro a perguntar!</p>
            </div>
        `;
        return;
    }

    perguntas.forEach(pergunta => {
        const article = criarCardElement(pergunta);
        container.appendChild(article);
    });
}

function criarCardElement(pergunta) {
    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.id = pergunta.id;
    article.dataset.cat = pergunta.categoriaPergunta || 'geral';
    article.dataset.status = 'aberta';

    const iniciais = emailUsuario.substring(0, 2).toUpperCase();
    const cat = pergunta.categoriaPergunta || 'geral';
    const badge = categoriaMap[cat] || { label: cat, cls: 'badge-geral' };

    article.innerHTML = `
        <div class="card-header">
            <div class="card-avatar">${iniciais}</div>
            <div class="card-meta">
                <span class="card-author">${emailUsuario}</span>
                <span class="card-time">Pergunta #${pergunta.id}</span>
            </div>
            <span class="card-badge ${badge.cls}">${badge.label}</span>
        </div>
        <h3 class="card-title">${escapeHtml(pergunta.tituloPergunta)}</h3>
        <p class="card-desc">${escapeHtml(pergunta.corpoPergunta)}</p>
        <div class="card-footer">
            <span class="card-stat">&#128172; 0 respostas</span>
            <div class="card-actions">
                <button class="btn-responder" 
                    data-id="${pergunta.id}"
                    data-titulo="${escapeAttr(pergunta.tituloPergunta)}"
                    data-desc="${escapeAttr(pergunta.corpoPergunta)}">
                    Responder
                </button>
                <button class="btn-editar" data-id="${pergunta.id}" 
                    data-titulo="${escapeAttr(pergunta.tituloPergunta)}" 
                    data-desc="${escapeAttr(pergunta.corpoPergunta)}"
                    data-cat="${escapeAttr(cat)}">
                    &#9998; Editar
                </button>
                <button class="btn-excluir" data-id="${pergunta.id}">
                    &#128465; Excluir
                </button>
            </div>
        </div>
    `;

    article.querySelector('.btn-responder').addEventListener('click', abrirModalResponder);
    article.querySelector('.btn-editar').addEventListener('click', abrirModalEditar);
    article.querySelector('.btn-excluir').addEventListener('click', confirmarExclusao);

    return article;
}

// ===== UTILITÁRIOS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function escapeAttr(text) {
    return (text || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== NOVA PERGUNTA =====
const abrirNovaPergunta  = document.getElementById('abrirNovaPergunta');
const modalNovaPergunta  = document.getElementById('modalNovaPergunta');
const fecharNovaPergunta = document.getElementById('fecharNovaPergunta');
const publicarPergunta   = document.getElementById('publicarPergunta');

abrirNovaPergunta.addEventListener('click', () => {
    modalNovaPergunta.classList.add('aberto');
});

fecharNovaPergunta.addEventListener('click', () => {
    modalNovaPergunta.classList.remove('aberto');
});

publicarPergunta.addEventListener('click', async () => {
    const titulo    = document.getElementById('tituloPergunta').value.trim();
    const categoria = document.getElementById('categoriaPergunta').value;
    const descricao = document.getElementById('descricaoPergunta').value.trim();

    if (!titulo || !categoria || !descricao) {
        alert('Preencha todos os campos antes de publicar.');
        return;
    }

    publicarPergunta.disabled = true;
    publicarPergunta.textContent = 'Publicando...';

    try {
        const resposta = await fetchAutenticado('/pergunta', {
            method: 'POST',
            body: JSON.stringify({
                tituloPergunta: titulo,
                corpoPergunta: descricao,
                categoriaPergunta: categoria
            })
        });

        if (resposta.ok) {
            document.getElementById('tituloPergunta').value = '';
            document.getElementById('categoriaPergunta').value = '';
            document.getElementById('descricaoPergunta').value = '';
            modalNovaPergunta.classList.remove('aberto');
            await carregarPerguntas();
        } else {
            const msg = await resposta.text();
            alert('Erro ao publicar pergunta: ' + (msg || 'Tente novamente.'));
        }
    } catch (e) {
        alert('Não foi possível conectar à API. Verifique se o servidor está rodando.');
    } finally {
        publicarPergunta.disabled = false;
        publicarPergunta.textContent = 'Publicar Pergunta';
    }
});

// ===== EDITAR PERGUNTA =====
const modalEditar  = document.getElementById('modalEditar');
const fecharEditar = document.getElementById('fecharEditar');
const salvarEdicao = document.getElementById('salvarEdicao');

let perguntaEditandoId = null;

function abrirModalEditar(e) {
    const btn = e.currentTarget;
    perguntaEditandoId = btn.dataset.id;
    document.getElementById('editarTitulo').value = btn.dataset.titulo;
    document.getElementById('editarDescricao').value = btn.dataset.desc;
    document.getElementById('editarCategoria').value = btn.dataset.cat;
    modalEditar.classList.add('aberto');
}

fecharEditar.addEventListener('click', () => {
    modalEditar.classList.remove('aberto');
    perguntaEditandoId = null;
});

salvarEdicao.addEventListener('click', async () => {
    const titulo    = document.getElementById('editarTitulo').value.trim();
    const categoria = document.getElementById('editarCategoria').value;
    const descricao = document.getElementById('editarDescricao').value.trim();

    if (!titulo || !categoria || !descricao) {
        alert('Preencha todos os campos.');
        return;
    }

    salvarEdicao.disabled = true;
    salvarEdicao.textContent = 'Salvando...';

    try {
        const resposta = await fetchAutenticado('/pergunta', {
            method: 'PUT',
            body: JSON.stringify({
                id: parseInt(perguntaEditandoId),
                tituloPergunta: titulo,
                corpoPergunta: descricao,
                categoriaPergunta: categoria
            })
        });

        if (resposta.ok) {
            modalEditar.classList.remove('aberto');
            perguntaEditandoId = null;
            await carregarPerguntas();
        } else {
            alert('Erro ao editar pergunta. Tente novamente.');
        }
    } catch (e) {
        alert('Não foi possível conectar à API.');
    } finally {
        salvarEdicao.disabled = false;
        salvarEdicao.textContent = 'Salvar Alterações';
    }
});

// ===== EXCLUIR PERGUNTA =====
async function confirmarExclusao(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;

    if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;

    btn.disabled = true;
    btn.textContent = 'Excluindo...';

    try {
        const resposta = await fetchAutenticado(`/pergunta/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            await carregarPerguntas();
        } else {
            alert('Erro ao excluir pergunta. Tente novamente.');
            btn.disabled = false;
            btn.textContent = '🗑 Excluir';
        }
    } catch (e) {
        alert('Não foi possível conectar à API.');
        btn.disabled = false;
        btn.textContent = '🗑 Excluir';
    }
}

// ===== RESPONDER =====
const modalResponder  = document.getElementById('modalResponder');
const fecharResponder = document.getElementById('fecharResponder');
const enviarResposta  = document.getElementById('enviarResposta');

function abrirModalResponder(e) {
    const btn = e.currentTarget;
    document.getElementById('tituloResponder').textContent = btn.dataset.titulo;
    document.getElementById('descResponder').textContent   = btn.dataset.desc;
    document.getElementById('textoResposta').value = '';
    modalResponder.classList.add('aberto');
}

fecharResponder.addEventListener('click', () => {
    modalResponder.classList.remove('aberto');
});

enviarResposta.addEventListener('click', () => {
    const texto = document.getElementById('textoResposta').value.trim();
    if (!texto) {
        alert('Escreva sua resposta antes de enviar.');
        return;
    }

    const totalRespostas = document.getElementById('totalRespostas');
    totalRespostas.textContent = parseInt(totalRespostas.textContent) + 1;

    const listaMinhasRespostas = document.getElementById('listaMinhasRespostas');
    const li = document.createElement('li');
    li.textContent = `Respondeu: "${texto.substring(0, 60)}${texto.length > 60 ? '...' : ''}"`;
    listaMinhasRespostas.appendChild(li);

    modalResponder.classList.remove('aberto');
    alert('Resposta enviada com sucesso!');
});

// ===== FECHAR MODAL AO CLICAR FORA =====
[modalPerfil, modalNovaPergunta, modalResponder, modalEditar].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('aberto');
    });
});

// ===== BUSCA =====
const searchInput = document.querySelector('.search-input');
const searchBtn   = document.querySelector('.search-btn');

function filtrarPorBusca() {
    const termo = searchInput.value.trim().toLowerCase();
    if (!termo) {
        renderizarCards(todasPerguntas);
        return;
    }
    const filtradas = todasPerguntas.filter(p =>
        (p.tituloPergunta || '').toLowerCase().includes(termo) ||
        (p.corpoPergunta || '').toLowerCase().includes(termo)
    );
    renderizarCards(filtradas);
}

searchBtn.addEventListener('click', filtrarPorBusca);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') filtrarPorBusca();
});
searchInput.addEventListener('input', filtrarPorBusca);

// ===== FILTROS DE CATEGORIA (SIDEBAR) =====
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const cat = item.dataset.cat;
        if (cat === 'todas') {
            renderizarCards(todasPerguntas);
        } else {
            const filtradas = todasPerguntas.filter(p => p.categoriaPergunta === cat);
            renderizarCards(filtradas);
        }
    });
});

// ===== FILTROS DE STATUS =====
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtro = btn.dataset.filtro;
        const cards = document.querySelectorAll('.card');

        cards.forEach(card => {
            if (filtro === 'recentes') {
                card.style.display = '';
            } else if (filtro === 'sem-resposta') {
                const stat = card.querySelector('.card-stat');
                const num  = parseInt(stat ? stat.textContent : '1');
                card.style.display = num === 0 ? '' : 'none';
            } else if (filtro === 'resolvidas') {
                card.style.display = card.dataset.status === 'resolvida' ? '' : 'none';
            }
        });
    });
});

// ===== ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const totalPerguntas = document.getElementById('totalPerguntas');
    if (totalPerguntas) totalPerguntas.textContent = todasPerguntas.length;

    const statsNums = document.querySelectorAll('.stats-num');
    if (statsNums.length > 0) statsNums[0].textContent = todasPerguntas.length;
}

// ===== CHATBOT =====
const chatbotToggle   = document.getElementById('chatbotToggle');
const chatbotWindow   = document.getElementById('chatbotWindow');
const fecharChatbot   = document.getElementById('fecharChatbot');
const chatbotInput    = document.getElementById('chatbotInput');
const chatbotSend     = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotBadge    = document.getElementById('chatbotBadge');

const respostasBot = [
    'Entendi sua dúvida! Vou verificar isso para você.',
    'Essa é uma boa pergunta. Você pode tentar acessar Configurações > Suporte para mais detalhes.',
    'Para esse tipo de problema, recomendo abrir um chamado com a equipe técnica.',
    'Posso te ajudar com isso! Qual sistema você está usando?',
    'Tente limpar o cache do navegador e tentar novamente. Isso resolve a maioria dos problemas.',
    'Vou encaminhar sua dúvida para um especialista. Aguarde um momento.',
];

chatbotToggle.addEventListener('click', () => {
    const aberto = chatbotWindow.classList.toggle('aberto');
    chatbotBadge.classList.add('hidden');
    if (aberto) chatbotInput.focus();
});

fecharChatbot.addEventListener('click', () => {
    chatbotWindow.classList.remove('aberto');
});

function enviarMensagem() {
    const texto = chatbotInput.value.trim();
    if (!texto) return;

    adicionarMensagem(texto, 'user');
    chatbotInput.value = '';

    setTimeout(() => {
        const resposta = respostasBot[Math.floor(Math.random() * respostasBot.length)];
        adicionarMensagem(resposta, 'bot');
    }, 800);
}

function adicionarMensagem(texto, tipo) {
    const div = document.createElement('div');
    div.className = `msg ${tipo === 'bot' ? 'bot-msg' : 'user-msg'}`;

    if (tipo === 'bot') {
        div.innerHTML = `
            <span class="msg-avatar">&#129302;</span>
            <div class="msg-bubble">${texto}</div>
        `;
    } else {
        div.innerHTML = `<div class="msg-bubble">${texto}</div>`;
    }

    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

chatbotSend.addEventListener('click', enviarMensagem);

chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') enviarMensagem();
});

// ===== INICIALIZAÇÃO =====
carregarPerguntas();
