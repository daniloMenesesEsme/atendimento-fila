import React from 'react';
import './Dashboard.css';

function Dashboard({ socket, estado }) {
  const { fila, consultores, emAtendimento } = estado;

  const handleAtender = (consultorId) => {
    if (fila.length > 0) {
      socket.emit('atenderProximo', consultorId);
    } else {
      alert('Não há ninguém na fila para atender.');
    }
  };

  const handleFinalizar = (atendimento) => {
    socket.emit('finalizarAtendimento', { 
        atendimento_id: atendimento.id, 
        consultor_id: atendimento.consultor_id 
    });
  };

  const handleRemoverDaFila = async (id) => {
    if (confirm('Tem certeza que deseja remover este analista da fila?')) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/atendimentos/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha ao remover da fila');
        }
        // O estado será atualizado via Socket.IO, então não é necessário fazer nada aqui.
      } catch (error) {
        console.error("Erro ao remover da fila:", error);
        alert(error.message);
      }
    }
  };

  const handlePriorizarAtendimento = async (id, currentPriority) => {
    const newPriority = prompt(`Definir nova prioridade para o atendimento ${id} (atual: ${currentPriority}).\n\nUm número maior significa maior prioridade.`, currentPriority);
    if (newPriority !== null && !isNaN(newPriority) && newPriority !== '') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/atendimentos/${id}/prioridade`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prioridade: parseInt(newPriority, 10) }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha ao atualizar prioridade');
        }
        // O estado será atualizado via Socket.IO
      } catch (error) {
        console.error("Erro ao atualizar prioridade:", error);
        alert(error.message);
      }
    }
  };

  const handleTogglePause = async (consultorId, currentStatus) => {
    const newStatus = currentStatus === 'disponivel' ? 'em_pausa' : 'disponivel';
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/consultores/${consultorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar status do consultor');
      }
      // O estado será atualizado via Socket.IO
    } catch (error) {
      console.error("Erro ao atualizar status do consultor:", error);
      alert(error.message);
    }
  };

  return (
    <div className="row mt-4">
      
      {/* Coluna da Fila de Espera */}
      <div className="col-md-4">
        <div className="card">
          <div className="card-header">
            <h3>Fila de Espera ({fila.length})</h3>
          </div>
          <ul className="list-group list-group-flush">
            {fila.map((p, index) => (
              <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{index + 1}. {p.nome_analista} {p.case_number && `(Caso: ${p.case_number})`}</span>
                <div>
                  <button onClick={() => handlePriorizarAtendimento(p.id, p.prioridade)} className="btn btn-outline-warning btn-sm me-2">Priorizar</button>
                  <button onClick={() => handleRemoverDaFila(p.id)} className="btn btn-outline-danger btn-sm">Remover</button>
                </div>
              </li>
            ))}
            {fila.length === 0 && <li className="list-group-item">A fila está vazia.</li>}
          </ul>
        </div>
      </div>

      {/* Coluna dos Consultores */}
      <div className="col-md-8">
        <div className="card">
            <div className="card-header">
                <h3>Consultores ({consultores.length})</h3>
            </div>
            <div className="card-body">
                <div className="row">
                    {consultores.map(c => {
                    const meuAtendimento = emAtendimento.find(a => a.consultor_id === c.id);
                    const meetLink = c.meet_link;

                    let cardClass = 'border-secondary'; // Default para offline ou desconhecido
                    let statusText = 'Offline';
                    let statusTextColor = 'text-secondary';

                    if (c.status === 'disponivel') {
                        cardClass = 'border-success';
                        statusText = 'Disponível';
                        statusTextColor = 'text-success';
                    } else if (c.status === 'em_pausa') {
                        cardClass = 'border-warning';
                        statusText = 'Em Pausa';
                        statusTextColor = 'text-warning';
                    } else if (c.status === 'em_atendimento') {
                        cardClass = 'border-danger';
                        statusText = 'Em Atendimento';
                        statusTextColor = 'text-danger';
                    }

                    return (
                        <div key={c.id} className="col-md-6 mb-3">
                            <div className={`card ${cardClass}`}>
                                <div className="card-body">
                                    <h5 className="card-title">{c.nome}</h5>
                                    <p className={`card-text ${statusTextColor}`}>
                                        {statusText}
                                    </p>
                                    {c.status === 'disponivel' ? (
                                        <>
                                            <button onClick={() => handleAtender(c.id)} disabled={fila.length === 0} className="btn btn-primary me-2">
                                                Atender Próximo
                                            </button>
                                            <button onClick={() => handleTogglePause(c.id, c.status)} className="btn btn-warning">
                                                Pausar
                                            </button>
                                        </>
                                    ) : c.status === 'em_pausa' ? (
                                        <button onClick={() => handleTogglePause(c.id, c.status)} className="btn btn-success">
                                            Retomar Atendimento
                                        </button>
                                    ) : meuAtendimento ? (
                                        <div className="atendimento-info">
                                            <p>Atendendo: <strong>{meuAtendimento.nome_analista}</strong></p>
                                            <a href={meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-info btn-sm">Entrar no Meet</a>
                                            <button onClick={() => handleFinalizar(meuAtendimento)} className="btn btn-danger btn-sm ms-2">
                                                Finalizar
                                            </button>
                                        </div>
                                    ) : null
                                    }
                                </div>
                            </div>
                        </div>
                    )
                    })}
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}

export default Dashboard;