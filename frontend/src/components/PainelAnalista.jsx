
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Dashboard.css';


const PainelAnalista = ({ socket, estado }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({});

  useEffect(() => {
    const handleAtendimentoIniciado = (data) => {
      setNotificationData(data.consultor);
      setShowNotification(true);

      // Notificação desaparece após 10 segundos
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 10000);

      return () => clearTimeout(timer);
    };

    socket.on('atendimento-iniciado', handleAtendimentoIniciado);

    return () => {
      socket.off('atendimento-iniciado', handleAtendimentoIniciado);
    };
  }, [socket]);

  return (
    <div className="dashboard-container">
      {showNotification && (
        <div className="alert alert-success text-center blinking-notification" role="alert">
          <h4>Você está sendo atendido por {notificationData.nome}!</h4>
          <p>Clique no link para entrar na reunião:</p>
          <a href={notificationData.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary me-2">
            Entrar no Meet
          </a>
          <button onClick={() => setShowNotification(false)} className="btn btn-secondary">
            Fechar
          </button>
        </div>
      )}

      <div className="row">
        {/* Fila de Espera */}
        <div className="col-md-4">
          <div className="fila-section">
            <h2>Fila de Espera</h2>
            <ul className="list-group">
              {estado.fila.map((item, index) => (
                <li key={item.id} className="list-group-item">
                  {index + 1}. {item.nome_analista} {item.case_number && `(Caso: ${item.case_number})`}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Em Atendimento */}
        <div className="col-md-4">
          <div className="atendimento-section">
            <h2>Em Atendimento</h2>
            <ul className="list-group">
              {estado.emAtendimento.map((atendimento) => (
                <li key={atendimento.id} className="list-group-item">
                  <p><strong>Analista:</strong> {atendimento.nome_analista}</p>
                  <p><strong>Consultor:</strong> {atendimento.nome_consultor}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Consultores Disponíveis */}
        <div className="col-md-4">
          <div className="consultores-section">
            <h2>Consultores Disponíveis</h2>
            <ul className="list-group">
              {estado.consultores.map((consultor) => (
                <li key={consultor.id} className="list-group-item">
                  {consultor.nome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

PainelAnalista.propTypes = {
  socket: PropTypes.object.isRequired,
  estado: PropTypes.shape({
    fila: PropTypes.array.isRequired,
    emAtendimento: PropTypes.array.isRequired,
    consultores: PropTypes.array.isRequired,
  }).isRequired,
};

export default PainelAnalista;
