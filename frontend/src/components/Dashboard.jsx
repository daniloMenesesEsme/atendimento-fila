
import PropTypes from 'prop-types';


const PainelConsultor = ({ socket, estado }) => {
  const atenderProximo = () => {
    socket.emit('atenderProximo');
  };

  const finalizarAtendimento = (atendimentoId) => {
    socket.emit('finalizarAtendimento', atendimentoId);
  };

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
        <button onClick={atenderProximo} className="btn btn-primary mt-3">
          Atender Próximo
        </button>
      </div>

      {/* Em Atendimento */}
      <div className="atendimento-section">
        <h2>Em Atendimento</h2>
        <ul className="list-group">
          {estado.emAtendimento.map((atendimento) => (
            <li key={atendimento.id} className="list-group-item">
              <p><strong>Analista:</strong> {atendimento.nome_analista}</p>
              <p><strong>Consultor:</strong> {atendimento.nome_consultor}</p>
              <button onClick={() => finalizarAtendimento(atendimento.id)} className="btn btn-success btn-sm">
                Finalizar Atendimento
              </button>
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

PainelConsultor.propTypes = {
  socket: PropTypes.object.isRequired,
  estado: PropTypes.shape({
    fila: PropTypes.array.isRequired,
    emAtendimento: PropTypes.array.isRequired,
    consultores: PropTypes.array.isRequired,
  }).isRequired,
};

export default PainelConsultor;
