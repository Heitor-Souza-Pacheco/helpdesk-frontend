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

btnPerfil.addEventListener('click', async (e) => {
    e.preventDefault();
    modalPerfil.classList.add('aberto');
    await carregarMinhasPerguntas();
});

fecharPerfil.addEventListener('click', () => {
    modalPerfil.classList.remove('aberto');
});

async function carregarMinhasPerguntas() {
    try {
        const resposta = await fetchAutenticado('/pergunta/minhas');
        if (resposta.ok) {
            const minhas = await resposta.json();
            const lista = document.getElementById('listaMinhasPerguntas');
            lista.innerHTML = '';

            if (minhas.length === 0) {
                lista.innerHTML = '<li>Você ainda não fez nenhuma pergunta.</li>';
            } else {
                minhas.forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p.tituloPergunta;
                    lista.appendChild(li);
                });
            }

            document.getElementById('totalPerguntas').textContent = minhas.length;
        }

        // Carrega respostas do usuário
        const respostaResp = await fetchAutenticado('/resposta/minhas');
        if (respostaResp.ok) {
            const todasRespostas = await respostaResp.json();
            const listaRespostas = document.getElementById('listaMinhasRespostas');
            listaRespostas.innerHTML = '';

            if (todasRespostas.length === 0) {
                listaRespostas.innerHTML = '<li>Você ainda não respondeu nenhuma pergunta.</li>';
            } else {
                todasRespostas.forEach(r => {
                    const li = document.createElement('li');
                    const texto = r.corpoResposta || '';
                    li.textContent = `Respondeu: "${texto.substring(0, 60)}${texto.length > 60 ? '...' : ''}"`;
                    listaRespostas.appendChild(li);
                });
            }

            document.getElementById('totalRespostas').textContent = todasRespostas.length;
        }
    } catch (e) {
        console.error('Erro ao carregar minhas perguntas:', e);
    }
}

// ===== VARIÁVEIS GLOBAIS =====
let todasPerguntas = [];

// ===== TOAST / POPUP =====
function mostrarToast(mensagem, tipo = 'sucesso') {
    // Remove toast anterior se existir
    const existente = document.querySelector('.toast-popup');
    if (existente) existente.remove();

    const toast = document.createElement('div');
    toast.className = `toast-popup toast-${tipo}`;
    toast.innerHTML = `
        <span class="toast-icon">${tipo === 'sucesso' ? '&#10004;' : '&#9888;'}</span>
        <span class="toast-msg">${mensagem}</span>
    `;
    document.body.appendChild(toast);

    // Anima entrada
    setTimeout(() => toast.classList.add('toast-visivel'), 10);

    // Remove após 3 segundos
    setTimeout(() => {
        toast.classList.remove('toast-visivel');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== MODAL DE CONFIRMAÇÃO CUSTOMIZADO =====
function mostrarConfirmacao(titulo, mensagem, textoBotao = 'Confirmar', tipo = 'danger') {
    return new Promise((resolve) => {
        // Remove existente se houver
        const existente = document.querySelector('.confirm-overlay');
        if (existente) existente.remove();

        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay aberto';

        const icone = tipo === 'danger' ? '&#9888;' : '&#10067;';
        const btnClass = tipo === 'danger' ? 'confirm-btn-danger' : 'confirm-btn-primary';

        overlay.innerHTML = `
            <div class="confirm-box">
                <div class="confirm-icon">${icone}</div>
                <h3 class="confirm-title">${titulo}</h3>
                <p class="confirm-message">${mensagem}</p>
                <div class="confirm-actions">
                    <button class="confirm-btn confirm-btn-cancel" id="confirmCancelar">Cancelar</button>
                    <button class="confirm-btn ${btnClass}" id="confirmOk">${textoBotao}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#confirmOk').addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });

        overlay.querySelector('#confirmCancelar').addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

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

            // Busca contagem de respostas para cada pergunta
            const respostasPromises = todasPerguntas.map(p =>
                fetchAutenticado(`/resposta/pergunta/${p.id}`).then(r => r.ok ? r.json() : [])
            );
            const respostasPorPergunta = await Promise.all(respostasPromises);
            todasPerguntas.forEach((p, i) => {
                p._respostas = respostasPorPergunta[i];
            });

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

    const numRespostas = (pergunta._respostas || []).length;

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
            <span class="card-stat">&#128172; ${numRespostas} resposta${numRespostas !== 1 ? 's' : ''}</span>
            <div class="card-actions">
                <button class="btn-ver-respostas"
                    data-id="${pergunta.id}"
                    data-titulo="${escapeAttr(pergunta.tituloPergunta)}">
                    &#128172; Ver Respostas (${numRespostas})
                </button>
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

    article.querySelector('.btn-ver-respostas').addEventListener('click', abrirModalVerRespostas);
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
        mostrarToast('Preencha todos os campos antes de publicar.', 'erro');
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
            mostrarToast('Pergunta publicada com sucesso!');
        } else {
            const msg = await resposta.text();
            mostrarToast('Erro ao publicar pergunta: ' + (msg || 'Tente novamente.'), 'erro');
        }
    } catch (e) {
        mostrarToast('Não foi possível conectar à API.', 'erro');
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
        mostrarToast('Preencha todos os campos.', 'erro');
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
            mostrarToast('Pergunta editada com sucesso!');
        } else if (resposta.status === 403) {
            mostrarToast('Você não tem permissão para editar esta pergunta.', 'erro');
        } else {
            mostrarToast('Erro ao editar pergunta. Tente novamente.', 'erro');
        }
    } catch (e) {
        mostrarToast('Não foi possível conectar à API.', 'erro');
    } finally {
        salvarEdicao.disabled = false;
        salvarEdicao.textContent = 'Salvar Alterações';
    }
});

// ===== EXCLUIR PERGUNTA =====
async function confirmarExclusao(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;

    const confirmado = await mostrarConfirmacao(
        'Excluir pergunta',
        'Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.',
        'Excluir',
        'danger'
    );

    if (!confirmado) return;

    btn.disabled = true;
    btn.textContent = 'Excluindo...';

    try {
        const resposta = await fetchAutenticado(`/pergunta/${id}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            mostrarToast('Pergunta excluída com sucesso!');
            await carregarPerguntas();
        } else if (resposta.status === 403) {
            mostrarToast('Você não tem permissão para excluir esta pergunta.', 'erro');
            btn.disabled = false;
            btn.textContent = '🗑 Excluir';
        } else {
            mostrarToast('Erro ao excluir pergunta. Tente novamente.', 'erro');
            btn.disabled = false;
            btn.textContent = '🗑 Excluir';
        }
    } catch (e) {
        mostrarToast('Não foi possível conectar à API.', 'erro');
        btn.disabled = false;
        btn.textContent = '🗑 Excluir';
    }
}

// ===== RESPONDER =====
const modalResponder  = document.getElementById('modalResponder');
const fecharResponder = document.getElementById('fecharResponder');
const enviarResposta  = document.getElementById('enviarResposta');

let perguntaRespondendoId = null;

function abrirModalResponder(e) {
    const btn = e.currentTarget;
    perguntaRespondendoId = btn.dataset.id;
    document.getElementById('tituloResponder').textContent = btn.dataset.titulo;
    document.getElementById('descResponder').textContent   = btn.dataset.desc;
    document.getElementById('textoResposta').value = '';
    modalResponder.classList.add('aberto');
}

fecharResponder.addEventListener('click', () => {
    modalResponder.classList.remove('aberto');
    perguntaRespondendoId = null;
});

enviarResposta.addEventListener('click', async () => {
    const texto = document.getElementById('textoResposta').value.trim();
    if (!texto) {
        mostrarToast('Escreva sua resposta antes de enviar.', 'erro');
        return;
    }

    enviarResposta.disabled = true;
    enviarResposta.textContent = 'Enviando...';

    try {
        const resposta = await fetchAutenticado('/resposta', {
            method: 'POST',
            body: JSON.stringify({
                corpoResposta: texto,
                perguntaId: parseInt(perguntaRespondendoId)
            })
        });

        if (resposta.ok) {
            modalResponder.classList.remove('aberto');
            perguntaRespondendoId = null;
            await carregarPerguntas();
            mostrarToast('Resposta enviada com sucesso!');
        } else {
            mostrarToast('Erro ao enviar resposta. Tente novamente.', 'erro');
        }
    } catch (e) {
        mostrarToast('Não foi possível conectar à API.', 'erro');
    } finally {
        enviarResposta.disabled = false;
        enviarResposta.textContent = 'Enviar Resposta';
    }
});

// ===== FECHAR MODAL AO CLICAR FORA =====
const modalVerRespostas = document.getElementById('modalVerRespostas');
const fecharVerRespostas = document.getElementById('fecharVerRespostas');

fecharVerRespostas.addEventListener('click', () => {
    modalVerRespostas.classList.remove('aberto');
});

async function abrirModalVerRespostas(e) {
    const btn = e.currentTarget;
    const perguntaId = btn.dataset.id;
    const titulo = btn.dataset.titulo;

    document.getElementById('tituloVerRespostas').textContent = `Respostas: ${titulo}`;
    const lista = document.getElementById('listaRespostas');
    lista.innerHTML = '<p>Carregando...</p>';
    modalVerRespostas.classList.add('aberto');

    try {
        const resp = await fetchAutenticado(`/resposta/pergunta/${perguntaId}`);
        if (resp.ok) {
            let respostas = await resp.json();
            // Ordena por curtidas (mais curtidas primeiro)
            respostas.sort((a, b) => (b.curtidas || 0) - (a.curtidas || 0));
            lista.innerHTML = '';

            if (respostas.length === 0) {
                lista.innerHTML = '<p class="empty-respostas">Nenhuma resposta ainda. Seja o primeiro a responder!</p>';
            } else {
                respostas.forEach(r => {
                    const div = document.createElement('div');
                    div.className = 'resposta-item';
                    div.innerHTML = `
                        <div class="resposta-header">
                            <span class="resposta-autor">${escapeHtml(r.nomeUsuario || 'Anônimo')}</span>
                            <span class="resposta-curtidas">&#128077; ${r.curtidas || 0}</span>
                        </div>
                        <p class="resposta-corpo">${escapeHtml(r.corpoResposta)}</p>
                        <button class="btn-curtir" data-id="${r.id}">&#128077; Curtir</button>
                    `;
                    // Toggle curtir/descurtir
                    let curtido = false;
                    const btnCurtir = div.querySelector('.btn-curtir');
                    btnCurtir.addEventListener('click', async () => {
                        btnCurtir.disabled = true;
                        try {
                            if (!curtido) {
                                // Curtir
                                const curtirResp = await fetch(`${API_BASE_URL}/resposta/curtir/${r.id}`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${getToken()}` }
                                });
                                if (curtirResp.ok) {
                                    const atualizada = await curtirResp.json();
                                    div.querySelector('.resposta-curtidas').textContent = `👍 ${atualizada.curtidas}`;
                                    btnCurtir.textContent = '👎 Descurtir';
                                    btnCurtir.classList.add('btn-curtido');
                                    curtido = true;
                                }
                            } else {
                                // Descurtir
                                const descurtirResp = await fetch(`${API_BASE_URL}/resposta/descurtir/${r.id}`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${getToken()}` }
                                });
                                if (descurtirResp.ok) {
                                    const atualizada = await descurtirResp.json();
                                    div.querySelector('.resposta-curtidas').textContent = `👍 ${atualizada.curtidas}`;
                                    btnCurtir.textContent = '👍 Curtir';
                                    btnCurtir.classList.remove('btn-curtido');
                                    curtido = false;
                                }
                            }
                        } catch (err) {
                            console.error('Erro ao curtir/descurtir:', err);
                        } finally {
                            btnCurtir.disabled = false;
                        }
                    });
                    lista.appendChild(div);
                });
            }
        } else {
            lista.innerHTML = '<p>Erro ao carregar respostas.</p>';
        }
    } catch (e) {
        lista.innerHTML = '<p>Erro de conexão.</p>';
    }
}

[modalPerfil, modalNovaPergunta, modalResponder, modalEditar, modalVerRespostas].forEach(modal => {
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

        if (filtro === 'recentes') {
            renderizarCards(todasPerguntas);
        } else if (filtro === 'sem-resposta') {
            const filtradas = todasPerguntas.filter(p => (p._respostas || []).length === 0);
            renderizarCards(filtradas);
        } else if (filtro === 'resolvidas') {
            const filtradas = todasPerguntas.filter(p => (p._respostas || []).length > 0);
            renderizarCards(filtradas);
        }
    });
});

// ===== ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const totalPerguntas = document.getElementById('totalPerguntas');
    if (totalPerguntas) totalPerguntas.textContent = todasPerguntas.length;

    // Sidebar
    const statPerguntas = document.getElementById('statPerguntas');
    if (statPerguntas) statPerguntas.textContent = todasPerguntas.length;

    const totalRespostasGeral = todasPerguntas.reduce((acc, p) => acc + (p._respostas || []).length, 0);
    const statRespostas = document.getElementById('statRespostas');
    if (statRespostas) statRespostas.textContent = totalRespostasGeral;
}

// ===== CHATBOT =====
const chatbotToggle   = document.getElementById('chatbotToggle');
const chatbotWindow   = document.getElementById('chatbotWindow');
const fecharChatbot   = document.getElementById('fecharChatbot');
const chatbotInput    = document.getElementById('chatbotInput');
const chatbotSend     = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');
const chatbotBadge    = document.getElementById('chatbotBadge');

chatbotToggle.addEventListener('click', () => {
    const aberto = chatbotWindow.classList.toggle('aberto');
    chatbotBadge.classList.add('hidden');
    if (aberto) chatbotInput.focus();
});

fecharChatbot.addEventListener('click', () => {
    chatbotWindow.classList.remove('aberto');
});

// Ajusta tamanho do chatbot quando teclado virtual abre no mobile
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        if (chatbotWindow.classList.contains('aberto')) {
            const vh = window.visualViewport.height;
            chatbotWindow.style.maxHeight = (vh * 0.6) + 'px';
        }
    });
    window.visualViewport.addEventListener('scroll', () => {
        if (chatbotWindow.classList.contains('aberto')) {
            const vh = window.visualViewport.height;
            chatbotWindow.style.maxHeight = (vh * 0.6) + 'px';
        }
    });
}

async function enviarMensagem() {
    const texto = chatbotInput.value.trim();
    if (!texto) return;

    adicionarMensagem(texto, 'user');
    chatbotInput.value = '';

    // Desabilita input enquanto aguarda resposta da IA
    chatbotInput.disabled = true;
    chatbotSend.disabled = true;
    adicionarMensagem('Digitando...', 'bot-loading');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const resposta = await fetchAutenticado('/ia/perguntar', {
            method: 'POST',
            body: JSON.stringify({ pergunta: texto }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Remove o indicador de "Digitando..."
        removerMensagemLoading();

        if (resposta.ok) {
            const dados = await resposta.json();
            adicionarMensagem(dados.resposta, 'bot');
        } else if (resposta.status === 401 || resposta.status === 403) {
            adicionarMensagem('Sua sessão expirou. Faça login novamente.', 'bot');
        } else {
            adicionarMensagem('Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.', 'bot');
        }
    } catch (e) {
        removerMensagemLoading();
        adicionarMensagem('Não foi possível conectar ao servidor. Verifique sua conexão.', 'bot');
    } finally {
        chatbotInput.disabled = false;
        chatbotSend.disabled = false;
        chatbotInput.focus();
    }
}

function removerMensagemLoading() {
    const loading = chatbotMessages.querySelector('.bot-loading');
    if (loading) loading.remove();
}

function adicionarMensagem(texto, tipo) {
    const div = document.createElement('div');

    if (tipo === 'bot-loading') {
        div.className = 'msg bot-msg bot-loading';
        div.innerHTML = `
            <span class="msg-avatar">&#129302;</span>
            <div class="msg-bubble typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `;
    } else if (tipo === 'bot') {
        div.className = 'msg bot-msg';
        div.innerHTML = `
            <span class="msg-avatar">&#129302;</span>
            <div class="msg-bubble">${texto}</div>
        `;
    } else {
        div.className = 'msg user-msg';
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
