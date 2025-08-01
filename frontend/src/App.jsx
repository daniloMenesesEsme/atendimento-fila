import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';

import Navbar from './components/Navbar';
import EntradaFila from './components/EntradaFila';
import PainelAnalista from './components/PainelAnalista';
import Dashboard from './components/Dashboard';
import Relatorios from './components/Relatorios';
import CadastroConsultores from './components/CadastroConsultores';
import CadastroAnalistas from './components/CadastroAnalistas';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const socket = io(apiUrl, {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling']
});

function App() {
  const [estado, setEstado] = useState({ 
    fila: [], 
    consultores: [], 
    emAtendimento: [] 
  });
  const [dbStatus, setDbStatus] = useState(false);
  const location = useLocation();

  // Função para verificar o status da conexão
  const checkConnection = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/health`);
      setDbStatus(res.ok);
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setDbStatus(false);
    }
  };

  useEffect(() => {
    // Verificar conexão inicialmente
    checkConnection();

    // Configurar eventos do socket
    socket.on('connect', () => {
      console.log('Socket conectado');
      setDbStatus(true);
      socket.emit('solicitarEstado'); // Solicita o estado atual ao se (re)conectar
    });

    socket.on('disconnect', () => {
      console.log('Socket desconectado');
      setDbStatus(false);
    });

    socket.on('estadoAtualizado', (novoEstado) => {
      console.log('Estado atualizado recebido:', novoEstado);
      setEstado(novoEstado);
    });

    import('bootstrap/dist/js/bootstrap.bundle.min.js');

    // Limpeza ao desmontar o componente
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('estadoAtualizado');
    };
  }, []);

  const isPainelAnalista = location.pathname === '/painel-analista';

  return (
    <>
      {!isPainelAnalista && <Navbar />}
      
      <div className="status-container">
          <span className={`status-dot ${dbStatus ? 'status-ok' : 'status-error'}`}></span>
          {dbStatus ? 'Conectado' : 'Desconectado'}
      </div>

      <div className="app-main-content">
        <div className="container-fluid">
          <Routes>
            {/* Rota Principal - Painel do Consultor */}
            <Route path="/" element={
              <>
                <EntradaFila socket={socket} />
                <Dashboard socket={socket} estado={estado} />
              </>
            } />
            
            {/* Rotas acessíveis pela Navbar */}
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/cadastro-consultores" element={<CadastroConsultores />} />
            <Route path="/cadastro-analistas" element={<CadastroAnalistas />} />

            {/* Rota exclusiva para o Painel do Analista */}
            <Route path="/painel-analista" element={
              <>
                <EntradaFila socket={socket} />
                <PainelAnalista socket={socket} estado={estado} />
              </> 
            }/>
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;