
import { useEffect } from 'react';
import PropTypes from 'prop-types';


const PainelAnalista = ({ socket, estado }) => {

  useEffect(() => {
    // Pede permissão para notificações assim que o componente é montado
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const handleAtendimentoIniciado = (data) => {
      const { consultor } = data;
      if (Notification.permission === 'granted') {
        new Notification('Você está sendo atendido!', {
          body: `O consultor ${consultor.nome} iniciou seu atendimento.`,
          icon: '/vite.svg' // Opcional: adicione um ícone
        });
      }
    };

    socket.on('atendimento-iniciado', handleAtendimentoIniciado);

    // Limpa o listener quando o componente é desmontado
    return () => {
      socket.off('atendimento-iniciado', handleAtendimentoIniciado);
    };
  }, [socket]);

  return (
    <div className="dashboard-container">
      {/* Fila de Espera */}
      <div className="fila-section">
        <h2>Fila de Espera</h2>
        <ul className="list-group">
          {estado.fila.map((item) => (
            <li key={item.id} className="list-group-item">
              {item.nome_analista}
            </li>
          ))}
        </ul>
      </div>

      {/* Em Atendimento */}
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

      {/* Consultores Disponíveis */}
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
