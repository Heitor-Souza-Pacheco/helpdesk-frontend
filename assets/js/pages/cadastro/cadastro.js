// ===== CADASTRO =====

async function fazerCadastro() {
    const email    = document.getElementById('email').value.trim();
    const senha    = document.getElementById('senha').value;
    const btnTexto = document.getElementById('btnCriarTexto');
    const erro     = document.getElementById('mensagemErro');
    const sucesso  = document.getElementById('mensagemSucesso');

    // Limpa mensagens anteriores
    erro.style.display    = 'none';
    sucesso.style.display = 'none';

    // Validações
    if (!email || !senha) {
        mostrarMensagem(erro, 'Preencha o e-mail e a senha.');
        return;
    }

    if (!email.includes('@')) {
        mostrarMensagem(erro, 'Digite um e-mail válido.');
        return;
    }

    if (senha.length < 6) {
        mostrarMensagem(erro, 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    // Loading no botão
    btnTexto.textContent = 'Criando...';
    document.getElementById('btnCriar').disabled = true;

    try {
        const resposta = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: senha })
        });

        if (resposta.ok) {
            mostrarMensagem(sucesso, 'Conta criada com sucesso! Redirecionando...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else if (resposta.status === 409) {
            mostrarMensagem(erro, 'Este e-mail já está cadastrado.');
        } else {
            const msg = await resposta.text();
            mostrarMensagem(erro, msg || 'Erro ao criar conta. Tente novamente.');
        }

    } catch (e) {
        mostrarMensagem(erro, 'Não foi possível conectar à API. Verifique se o servidor está rodando.');
    } finally {
        btnTexto.textContent = 'Criar';
        document.getElementById('btnCriar').disabled = false;
    }
}

function mostrarMensagem(elemento, mensagem) {
    elemento.textContent = mensagem;
    elemento.style.display = 'block';
}

// Permite submeter com Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') fazerCadastro();
});
