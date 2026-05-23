// ===== LOGIN =====

// Se já estiver logado E não veio de um logout, vai direto para a home
const veioDeLogout = sessionStorage.getItem('helpdesk_logout');
if (veioDeLogout) {
    sessionStorage.removeItem('helpdesk_logout');
} else if (getToken()) {
    window.location.href = 'home.html';
}

async function fazerLogin() {
    const email    = document.getElementById('email').value.trim();
    const senha    = document.getElementById('senha').value;
    const btnTexto = document.getElementById('btnEntrarTexto');
    const erro     = document.getElementById('mensagemErro');

    // Validação básica
    erro.style.display = 'none';

    if (!email || !senha) {
        mostrarErro(erro, 'Preencha o e-mail e a senha.');
        return;
    }

    // Loading no botão
    btnTexto.textContent = 'Entrando...';
    document.getElementById('btnEntrar').disabled = true;

    try {
        const resposta = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password: senha })
        });

        if (resposta.ok) {
            const dados = await resposta.json();
            salvarToken(dados.token);
            // Salva o email do usuário para exibir na home
            sessionStorage.setItem('helpdesk_user', email);
            window.location.href = 'home.html';
        } else if (resposta.status === 401) {
            mostrarErro(erro, 'E-mail ou senha inválidos.');
        } else {
            mostrarErro(erro, 'Erro ao conectar com o servidor. Tente novamente.');
        }

    } catch (e) {
        mostrarErro(erro, 'Não foi possível conectar à API. Verifique se o servidor está rodando.');
    } finally {
        btnTexto.textContent = 'Entrar';
        document.getElementById('btnEntrar').disabled = false;
    }
}

function mostrarErro(elemento, mensagem) {
    elemento.textContent = mensagem;
    elemento.style.display = 'block';
}

// Permite submeter com Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fazerLogin();
});
