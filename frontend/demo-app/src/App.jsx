import React, { useState, useEffect } from 'react';
import './App.css';

// Importar seus componentes reais
import EntradaFila from '../../src/components/EntradaFila';
import Dashboard from '../../src/components/Dashboard';
import Relatorios from '../../src/components/Relatorios';

// Mock do Socket.IO
const mockSocket = {
  on: (event, callback) => {
    // Simula eventos do socket
    if (event === 'estadoAtualizado') {
      // Simula um estado inicial
      setTimeout(() => {
        callback({ fila: [], consultores: [{ id: 1, nome: 'Consultor 01', meet_link: '#', disponivel: true }], emAtendimento: [] });
      }, 100);
    }
  },
  emit: (event, data) => {
    console.log(`Socket emitido: ${event}`, data);
    // Simula a lógica do backend
    if (event === 'entrarFila') {
      // Adiciona à fila simulada
      const newTicket = { id: Math.random(), nome_analista: 'Analista Demo', chegada_em: new Date(), prioridade: 0, case_number: data.caseNumber };
      mockSocket.currentState.fila.push(newTicket);
      mockSocket.updateState();
    } else if (event === 'atenderProximo') {
      if (mockSocket.currentState.fila.length > 0) {
        const nextInQueue = mockSocket.currentState.fila.shift();
        const consultor = mockSocket.currentState.consultores.find(c => c.id === data);
        if (consultor) {
          consultor.disponivel = false;
          const newAttendance = { id: Math.random(), nome_analista: nextInQueue.nome_analista, nome_consultor: consultor.nome, inicio_em: new Date(), consultor_id: consultor.id };
          mockSocket.currentState.emAtendimento.push(newAttendance);
        }
        mockSocket.updateState();
      }
    } else if (event === 'finalizarAtendimento') {
      const attendance = mockSocket.currentState.emAtendimento.find(a => a.id === data.atendimento_id);
      if (attendance) {
        const consultor = mockSocket.currentState.consultores.find(c => c.id === data.consultor_id);
        if (consultor) {
          consultor.disponivel = true;
        }
        // Simula o registro no relatório
        mockSocket.mockedReports.push({
          id: attendance.id,
          nome_atendente: attendance.nome_analista,
          nome_consultor: attendance.nome_consultor,
          chegada_em: attendance.chegada_em,
          inicio_em: attendance.inicio_em,
          finalizado_em: new Date(),
          case_number: attendance.case_number,
        });
        mockSocket.currentState.emAtendimento = mockSocket.currentState.emAtendimento.filter(a => a.id !== data.atendimento_id);
        mockSocket.updateState();
      }
    }
  },
  currentState: { fila: [], consultores: [{ id: 1, nome: 'Consultor 01', meet_link: '#', disponivel: true }], emAtendimento: [] },
  mockedReports: [],
  updateState: () => {
    // Simula a emissão do estado atualizado para os listeners
    mockSocket.on('estadoAtualizado', (cb) => cb(mockSocket.currentState));
  }
};

// Mock do fetch para relatórios
const mockFetch = (url, options) => {
  if (url.includes('/api/relatorios/atendimentos')) {
    const params = new URLSearchParams(url.split('?')[1]);
    const page = parseInt(params.get('page')) || 1;
    const limit = parseInt(params.get('limit')) || 10;
    const offset = (page - 1) * limit;

    const filteredReports = mockSocket.mockedReports.filter(report => {
      const franqueado = params.get('franqueado');
      const consultor = params.get('consultor');
      // Implementar lógica de filtro mais robusta se necessário
      return (!franqueado || report.nome_atendente.includes(franqueado)) &&
             (!consultor || report.nome_consultor.includes(consultor));
    });

    const data = filteredReports.slice(offset, offset + limit);
    const total = filteredReports.length;

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data, total })
    });
  } else if (url.includes('/api/analistas')) {
    // Mock para a lista de analistas que EntradaFila.jsx espera
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, nome: 'Analista Demo 1', email: 'analista1@demo.com' },
        { id: 2, nome: 'Analista Demo 2', email: 'analista2@demo.com' },
      ])
    });
  }
  // Para outras chamadas, pode retornar um mock de sucesso ou erro
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
};

// Substitui o fetch global pelo mock para a demo
window.fetch = mockFetch;

function App() {
  const [currentScene, setCurrentScene] = useState(0);
  const [estado, setEstado] = useState(mockSocket.currentState);
  const [analystCaseNumber, setAnalystCaseNumber] = useState('');

  useEffect(() => {
    mockSocket.on('estadoAtualizado', (novoEstado) => {
      setEstado({ ...novoEstado });
    });
  }, []);

  const nextScene = () => {
    setCurrentScene(prev => prev + 1);
  };

  const resetDemo = () => {
    mockSocket.currentState = { fila: [], consultores: [{ id: 1, nome: 'Consultor 01', meet_link: '#', disponivel: true }], emAtendimento: [] };
    mockSocket.mockedReports = [];
    setEstado(mockSocket.currentState);
    setCurrentScene(0);
    setAnalystCaseNumber('');
  };

  // Renderização condicional das cenas
  const renderScene = () => {
    switch (currentScene) {
      case 0: // Tela de Abertura
        return (
          <div className="scene-container">
            <img src="https://via.placeholder.com/150x150?text=LOGO+BOTICARIO" alt="Logo do Sistema" className="system-logo" />
            <h1>Sistema de Atendimento Inteligente</h1>
            <p>O Futuro do Atendimento Organizado</p>
            <button className="btn btn-primary" onClick={nextScene}>Iniciar Demonstração</button>
          </div>
        );
      case 1: // Analista Pede Ajuda
        return (
          <div className="scene-container">
            <h2><span className="icon">👤</span> Visão do Analista</h2>
            <p>Quando um analista precisa de suporte, ele simplesmente solicita um atendimento.</p>
            <EntradaFila socket={mockSocket} onEnterQueue={(caseNum) => {
              setAnalystCaseNumber(caseNum);
              setTimeout(nextScene, 1500); // Avança após simular entrada na fila
            }} />
          </div>
        );
      case 2: // Painel de Controle (Visão Geral)
        return (
          <div className="scene-container">
            <h2><span className="icon">📊</span> Painel de Controle</h2>
            <p>Visão geral da fila e dos consultores disponíveis.</p>
            <Dashboard socket={mockSocket} estado={estado} />
            <button className="btn btn-secondary" onClick={nextScene}>Avançar →</button>
          </div>
        );
      case 3: // Chamada e Conexão (Meet)
        const currentAttendance = estado.emAtendimento[0]; // Pega o primeiro atendimento em andamento
        return (
          <div className="scene-container meet-scene">
            <div className="meet-content">
              <div className="meet-header">
                <span className="meet-time">00:00</span>
                <span className="meet-title">Atendimento em Andamento</span>
              </div>
              <div className="video-grid">
                <div className="video-participant">
                  <img src="https://via.placeholder.com/100x100?text=CONSULTOR" alt="Consultor" className="avatar" />
                  <p>Consultor</p>
                </div>
                <div className="video-participant">
                  <img src="https://via.placeholder.com/100x100?text=ANALISTA" alt="Analista" className="avatar" />
                  <p>Analista (Número do Caso: {currentAttendance ? currentAttendance.case_number : 'N/A'})</p>
                </div>
              </div>
              <div className="meet-controls">
                <button className="meet-btn"><span className="icon">🎤</span></button>
                <button className="meet-btn"><span className="icon">📹</span></button>
                <button className="btn btn-danger meet-btn-end" onClick={() => {
                  if (currentAttendance) {
                    mockSocket.emit('finalizarAtendimento', { atendimento_id: currentAttendance.id, consultor_id: currentAttendance.consultor_id });
                    setTimeout(nextScene, 500); // Avança após simular finalização
                  }
                }}><span className="icon">📞</span> Finalizar Atendimento</button>
                <button className="meet-btn"><span className="icon">💬</span></button>
                <button className="meet-btn"><span className="icon">...</span></button>
              </div>
            </div>
          </div>
        );
      case 4: // Resultados (Dashboard/Relatório)
        return (
          <div className="scene-container">
            <h2><span className="icon">✅</span> Atendimento Finalizado!</h2>
            <div className="metric-card">
              <h3>Tempo de Atendimento</h3>
              <p>Simulado</p>
            </div>
            <div className="dashboard-section">
              <h3><span className="icon">📈</span> Visão Geral do Dia</h3>
              <div className="chart-placeholder">Gráfico de Atendimentos por Hora (Dados Simulados)</div>
            </div>
            <h3><span className="icon">📋</span> Histórico Recente</h3>
            <Relatorios /> {/* Seu componente de relatórios real */}
            <button className="btn btn-primary" onClick={nextScene}>Ver Relatório Completo →</button>
          </div>
        );
      case 5: // Tela de Encerramento
        return (
          <div className="scene-container">
            <h1>Obrigado!</h1>
            <p>Você viu como nosso sistema simplifica, organiza e gera dados para cada atendimento.</p>
            <p className="tagline">Organização. Eficiência. Dados. Transforme seu atendimento.</p>
            <button className="btn btn-primary" onClick={resetDemo}>Reiniciar Demonstração</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="demo-app-container">
      {renderScene()}
    </div>
  );
}

export default App;
