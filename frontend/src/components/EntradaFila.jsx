import { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap'; // Importar Modal, Button e Form

function EntradaFila({ socket }) {
  const [analistas, setAnalistas] = useState([]);
  const [selectedAnalista, setSelectedAnalista] = useState('');
  const [showModal, setShowModal] = useState(false); // Estado para controlar a visibilidade do modal
  const [caseNumber, setCaseNumber] = useState(''); // Estado para o número do caso

  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + '/api/analistas')
      .then(res => res.json())
      .then(data => setAnalistas(data));
  }, []);

  const handleShowModal = (e) => {
    e.preventDefault();
    if (selectedAnalista) {
      setShowModal(true);
    } else {
      alert('Por favor, selecione seu nome para entrar na fila.');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCaseNumber(''); // Limpa o campo do número do caso ao fechar o modal
  };

  const handleConfirmEntry = () => {
    if (caseNumber) {
      socket.emit('entrarFila', { analistaId: selectedAnalista, caseNumber: caseNumber });
      alert('Você entrou na fila! Aguarde para ser atendido. Caso: ' + caseNumber);
      handleCloseModal();
      setSelectedAnalista(''); // Limpa o campo de seleção do analista
    } else {
      alert('Por favor, insira o número do caso.');
    }
  };

  return (
    <div className="card mt-4">
      <h2>Entrar na Fila de Atendimento</h2>
      <form onSubmit={handleShowModal}> {/* Alterado para abrir o modal */}
        <div className="input-group">
          <select 
            className="form-select"
            value={selectedAnalista}
            onChange={(e) => setSelectedAnalista(e.target.value)}
            required
          >
            <option value="" disabled>Selecione seu nome...</option>
            {analistas.map(a => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-success">Entrar na Fila</button>
        </div>
      </form>

      {/* Modal para inserir o número do caso */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Informar Número do Caso</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Número do Caso Salesforce:</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: 00123456"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmEntry}>
            Confirmar Entrada
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default EntradaFila;