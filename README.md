# HelpDesk Frontend

Interface web do sistema HelpDesk — plataforma de perguntas e respostas com suporte a chatbot.

## Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)

## Páginas

| Arquivo | Descrição |
|---------|-----------|
| `index.html` | Tela de login |
| `cadastro.html` | Tela de cadastro |
| `home.html` | Feed principal de perguntas e respostas |

## Como rodar

Por ser um projeto front-end puro, basta abrir os arquivos no navegador.

Recomendado usar a extensão **Live Server** no VS Code para hot reload:
1. Instale a extensão Live Server
2. Clique com botão direito em `index.html`
3. Selecione **Open with Live Server**

## Configuração da API

A URL da API está centralizada em `assets/js/global/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8083';
```

Altere esse valor para apontar para o ambiente correto (local ou produção).

## Funcionalidades

- Login com autenticação JWT
- Cadastro de usuário
- Feed de perguntas com filtros por categoria e status
- Modal para criar novas perguntas
- Modal para responder perguntas
- Perfil do usuário com histórico
- Chatbot flutuante (integração com backend em desenvolvimento)
- Logout com limpeza de sessão

## Integração com a API

O front consome a [HelpDesk API](https://github.com/seu-usuario/helpdesk-api).

Certifique-se de que a API está rodando antes de usar o sistema.
