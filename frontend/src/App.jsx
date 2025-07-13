import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

import Navbar from './components/Navbar';
import EntradaFila from './components/EntradaFila';
import Dashboard from './components/Dashboard';
import Relatorios from './components/Relatorios';
import CadastroConsultores from './components/CadastroConsultores';
import CadastroAnalistas from './components/CadastroAnalistas';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

function App() {
  const [estado, setEstado] = useState({ 
    fila: [], 
    consultores: [], 
    emAtendimento: [] 
  });
  const [view, setView] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then(res => res.ok)
      .then(status => setDbStatus(status))
      .catch(() => setDbStatus(false));

    socket.on('estadoAtualizado', (novoEstado) => {
      setEstado(novoEstado);
    });

    import('bootstrap/dist/js/bootstrap.bundle.min.js');

    return () => {
      socket.off('estadoAtualizado');
    };
  }, []);

  const renderView = () => {
    switch(view) {
      case 'relatorios':
        return <Relatorios />;
      case 'cadastroConsultores':
        return <CadastroConsultores />;
      case 'cadastroAnalistas':
        return <CadastroAnalistas />;
      case 'dashboard':
      default:
        return (
          <>
            <EntradaFila socket={socket} />
            <Dashboard socket={socket} estado={estado} />
          </>
        );
    }
  };

  return (
    <>
      <Navbar setView={setView} />
      <div className="status-container">
          <span className={`status-dot ${dbStatus ? 'status-ok' : 'status-error'}`}></span>
          {dbStatus ? 'Conectado' : 'Desconectado'}
      </div>
      <div className="app-main-content">
        <div className="container-fluid">
          {renderView()}
        </div>
      </div>
    </>
  );
}

export default App;
