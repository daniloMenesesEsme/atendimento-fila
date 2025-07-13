# Análise do Projeto: atendimento-fila

## Visão Geral

O projeto `atendimento-fila` é uma aplicação web de fila de atendimento em tempo real, construída com uma arquitetura cliente-servidor.

*   **Backend:** Desenvolvido em Node.js com Express.js, gerencia a lógica da fila, a comunicação com o banco de dados MySQL e as interações em tempo real.
*   **Frontend:** Desenvolvido em React com Vite, fornece a interface do usuário que exibe o estado da fila e é atualizada em tempo real.

---

## Backend (`/backend`)

*   **Tecnologia:** Node.js, Express.js, Socket.IO, `mysql2`.
*   **Funcionalidades Principais:**
    *   Serve uma API REST para gerenciar "Consultores" e "Analistas".
    *   Utiliza WebSockets (via Socket.IO) para comunicação em tempo real com o frontend.
    *   Conecta-se a um banco de dados MySQL (configurado via `.env`, com o padrão `atendimento_fila`).
    *   O script de inicialização (`npm start`) usa `nodemon` para desenvolvimento.
*   **Lógica de Negócio (via Socket.IO):**
    *   `entrarFila`: Adiciona um analista à fila de espera.
    *   `atenderProximo`: Aloca o próximo analista da fila a um consultor disponível.
    *   `finalizarAtendimento`: Marca um atendimento como concluído e libera o consultor.
    *   `emitirEstadoAtual`: Envia o estado completo da fila (em espera, em atendimento, consultores) para todos os clientes conectados após qualquer alteração.
*   **Endpoints da API REST:**
    *   `/api/health`: Verifica a conexão com o banco de dados.
    *   `/api/consultores`: CRUD para gerenciar consultores.
    *   `/api/analistas`: CRUD para gerenciar analistas.
    *   `/api/relatorios/atendimentos`: Retorna um relatório de atendimentos finalizados.

---

## Frontend (`/frontend`)

*   **Tecnologia:** React, Vite, `socket.io-client`, Bootstrap.
*   **Estrutura de Arquivos (`/src`):**
    *   `assets/`: Para arquivos estáticos como imagens e fontes.
    *   `components/`: Para componentes React reutilizáveis.
    *   `App.jsx`: Componente principal que centraliza a lógica da interface.
    *   `main.jsx`: Ponto de entrada da aplicação React.
    *   `App.css` e `index.css`: Arquivos de estilização.
*   **Funcionalidades Principais:**
    *   Renderiza a interface do usuário para visualizar a fila de atendimento.
    *   Usa `socket.io-client` para receber atualizações em tempo real do backend.
    *   Permite a interação do usuário para entrar na fila, atender, etc. (a lógica exata está nos componentes).
