import { useState, useEffect } from 'react';

function EntradaFila({ socket }) {
  const [analistas, setAnalistas] = useState([]);
  const [selectedAnalista, setSelectedAnalista] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/analistas')
      .then(res => res.json())
      .then(data => setAnalistas(data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAnalista) {
      socket.emit('entrarFila', selectedAnalista);
      alert('Você entrou na fila! Aguarde para ser atendido.');
    } else {
      alert('Por favor, selecione seu nome para entrar na fila.');
    }
  };

  return (
    <div className="card mt-4">
      <h2>Entrar na Fila de Atendimento</h2>
      <form onSubmit={handleSubmit}>
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
    </div>
  );
}

export default EntradaFila;