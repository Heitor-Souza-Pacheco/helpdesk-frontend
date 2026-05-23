// ===== CONFIGURAÇÃO CENTRAL DA API =====
const API_BASE_URL = 'http://localhost:8083';

/**
 * Salva o token JWT no sessionStorage
 */
function salvarToken(token) {
    sessionStorage.setItem('helpdesk_token', token);
}

/**
 * Recupera o token JWT do sessionStorage
 */
function getToken() {
    return sessionStorage.getItem('helpdesk_token');
}

/**
 * Remove o token (logout)
 */
function removerToken() {
    sessionStorage.removeItem('helpdesk_token');
}

/**
 * Verifica se o usuário está autenticado
 * Redireciona para login se não estiver
 */
function verificarAutenticacao() {
    const token = getToken();
    if (!token) {
        window.location.href = 'index.html';
    }
}

/**
 * Faz requisições autenticadas com o token JWT no header
 */
async function fetchAutenticado(endpoint, opcoes = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...opcoes.headers
    };

    const resposta = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...opcoes,
        headers
    });

    return resposta;
}
