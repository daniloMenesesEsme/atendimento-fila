# Plano de Ação: Implementação de Autenticação SSO

Este documento detalha os passos para integrar um sistema de autenticação Single Sign-On (SSO) na aplicação `atendimento-fila`, utilizando o padrão OAuth 2.0 / OpenID Connect. O objetivo é delegar a autenticação a um provedor de identidade corporativo (como Google Workspace ou Microsoft Entra ID), aumentando a segurança e melhorando a experiência do usuário.

---

## Fase 1: Preparação do Backend

O foco desta fase é ajustar o servidor para lidar com usuários, perfis de acesso e o fluxo de autenticação.

### 1.1. Alterações no Banco de Dados

- **Criar a Tabela `usuarios`:** Uma nova tabela será adicionada para gerenciar os usuários da aplicação e seus níveis de permissão.

  ```sql
  CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      nome VARCHAR(255) NOT NULL,
      perfil ENUM('ADMIN', 'CONSULTOR', 'ANALISTA') NOT NULL DEFAULT 'ANALISTA',
      ativo BOOLEAN DEFAULT TRUE,
      ultimo_login TIMESTAMP
  );
  ```

- **Relacionamentos (Opcional):** No futuro, as tabelas `analistas_atendimento` e `consultores` podem ser unificadas ou referenciar a tabela `usuarios` para evitar duplicação de dados de nome e e-mail.

### 1.2. Instalação de Dependências

- Adicionar ao `package.json` as bibliotecas necessárias para o fluxo de autenticação:
  - `passport`: O principal middleware de autenticação para Node.js.
  - `passport-jwt`: Estratégia para autenticar endpoints usando um JSON Web Token (JWT).
  - `jsonwebtoken`: Para criar e assinar os JWTs.
  - `passport-google-oauth20` ou `passport-azure-ad-oauth2`: A "estratégia" Passport específica para o provedor de identidade escolhido.

### 1.3. Criação das Rotas de Autenticação

- **`GET /api/auth/login`**
  - **Ação:** Inicia o fluxo de autenticação OAuth.
  - **Lógica:** Redireciona o usuário para a página de login do provedor de identidade (ex: Google).

- **`GET /api/auth/callback`**
  - **Ação:** Rota de retorno após o usuário se autenticar no provedor.
  - **Lógica:**
    1. Recebe o `código de autorização` do provedor.
    2. Troca esse código por um `token de acesso` e um `token de identidade` (contém as informações do usuário).
    3. Verifica se o usuário (pelo e-mail) já existe na tabela `usuarios`.
       - Se não existe, cria um novo registro (geralmente com um perfil padrão).
       - Se existe, atualiza a data de último login.
    4. Gera um **JWT** interno da nossa aplicação, contendo o ID do usuário, e-mail и perfil.
    5. Redireciona o usuário de volta para o frontend, enviando o JWT (seja por cookie ou parâmetro de URL).

### 1.4. Proteção das Rotas da API

- **Criar um Middleware de Verificação de JWT:**
  - Este middleware irá interceptar todas as requisições para as rotas protegidas.
  - Ele vai extrair o JWT do cabeçalho `Authorization`.
  - Vai verificar a assinatura e a validade do token.
  - Se o token for válido, anexa as informações do usuário (`req.user`) à requisição e permite o prosseguimento.
  - Se for inválido, retorna um erro `401 Unauthorized`.

- **Aplicar o Middleware:**
  - Adicionar o middleware de verificação a todas as rotas que exigem login (ex: `/api/consultores`, `/api/relatorios`, etc.).
  - Criar um middleware adicional de **autorização por perfil** para rotas restritas (ex: apenas `ADMIN` pode acessar `/api/analistas/delete`).

---

## Fase 2: Ajustes no Frontend

O objetivo é adaptar a interface do usuário para o fluxo de login e proteger o acesso às telas internas.

### 2.1. Gerenciamento de Estado e Rotas

- **Página de Login:**
  - Criar uma página (`/login`) com um único botão: "Entrar com o e-mail corporativo".
  - O clique nesse botão deve levar o usuário para a rota `GET /api/auth/login` do backend.

- **Rotas Protegidas (Private Routes):**
  - Implementar um componente de ordem superior ou um layout que verifique se o usuário está autenticado (ou seja, se possui um JWT válido armazenado).
  - Se o usuário não estiver logado, ele será automaticamente redirecionado para a página `/login`.

- **Lógica de Callback:**
  - Criar uma página ou lógica que capture o JWT retornado pelo backend após o login bem-sucedido.
  - Armazenar o JWT de forma segura no navegador (em `localStorage` ou `sessionStorage`).

### 2.2. Requisições Autenticadas

- **Interceptador de API:**
  - Configurar um interceptador (usando `axios` ou a `fetch` API nativa) que adicione automaticamente o cabeçalho `Authorization: Bearer <seu_jwt>` a todas as requisições enviadas para o backend.

### 2.3. Interface do Usuário

- **Botão de Logout:**
  - Adicionar um botão de "Sair" na barra de navegação.
  - O clique deve limpar o JWT armazenado no navegador e redirecionar o usuário para a página de login.

- **Exibição Condicional:**
  - Ocultar ou desabilitar elementos da interface com base no perfil do usuário (ex: o botão "Cadastro de Analistas" só deve aparecer para usuários com perfil `ADMIN`).
