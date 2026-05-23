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

publicarPergunta.addEventListener('click', () => {
    const titulo    = document.getElementById('tituloPergunta').value.trim();
    const categoria = document.getElementById('categoriaPergunta').value;
    const descricao = document.getElementById('descricaoPergunta').value.trim();

    if (!titulo || !categoria || !descricao) {
        alert('Preencha todos os campos antes de publicar.');
        return;
    }

    adicionarCard(titulo, categoria, descricao);

    document.getElementById('tituloPergunta').value    = '';
    document.getElementById('categoriaPergunta').value = '';
    document.getElementById('descricaoPergunta').value = '';
    modalNovaPergunta.classList.remove('aberto');
});

function adicionarCard(titulo, categoria, descricao) {
    const badgeMap = {
        tecnico:    { label: 'Suporte Técnico', cls: 'badge-tecnico' },
        financeiro: { label: 'Financeiro',       cls: 'badge-financeiro' },
        rh:         { label: 'RH',               cls: 'badge-rh' },
        geral:      { label: 'Geral',            cls: 'badge-geral' },
    };

    const badge = badgeMap[categoria] || { label: categoria, cls: 'badge-geral' };

    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.cat    = categoria;
    article.dataset.status = 'aberta';

    article.innerHTML = `
        <div class="card-header">
            <div class="card-avatar">EU</div>
            <div class="card-meta">
                <span class="card-author">Você</span>
                <span class="card-time">agora mesmo</span>
            </div>
            <span class="card-badge ${badge.cls}">${badge.label}</span>
        </div>
        <h3 class="card-title">${titulo}</h3>
        <p class="card-desc">${descricao}</p>
        <div class="card-footer">
            <span class="card-stat">&#128172; 0 respostas</span>
            <span class="card-stat">&#128065; 0 visualizações</span>
            <button class="btn-responder"
                data-titulo="${titulo}"
                data-desc="${descricao}">
                Responder
            </button>
        </div>
    `;

    const container = document.getElementById('cardsContainer');
    container.insertBefore(article, container.firstChild);

    article.querySelector('.btn-responder').addEventListener('click', abrirModalResponder);

    const totalPerguntas = document.getElementById('totalPerguntas');
    totalPerguntas.textContent = parseInt(totalPerguntas.textContent) + 1;

    const listaMinhasPerguntas = document.getElementById('listaMinhasPerguntas');
    const li = document.createElement('li');
    li.textContent = titulo;
    listaMinhasPerguntas.appendChild(li);
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

document.querySelectorAll('.btn-responder').forEach(btn => {
    btn.addEventListener('click', abrirModalResponder);
});

// ===== FECHAR MODAL AO CLICAR FORA =====
[modalPerfil, modalNovaPergunta, modalResponder].forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('aberto');
    });
});

// ===== FILTROS DE CATEGORIA (SIDEBAR) =====
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const cat = item.dataset.cat;
        document.querySelectorAll('.card').forEach(card => {
            card.style.display = (cat === 'todas' || card.dataset.cat === cat) ? '' : 'none';
        });
    });
});

// ===== FILTROS DE STATUS =====
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtro = btn.dataset.filtro;
        document.querySelectorAll('.card').forEach(card => {
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
