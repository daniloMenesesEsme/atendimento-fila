import { useState, useEffect } from 'react';

function CadastroAnalistas() {
  const [analistas, setAnalistas] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchAnalistas = () => {
    fetch('http://localhost:3000/api/analistas')
      .then(res => res.json())
      .then(data => setAnalistas(data));
  };

  useEffect(fetchAnalistas, []);

  const resetForm = () => {
    setNome('');
    setEmail('');
    setEditId(null);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editId ? `http://localhost:3000/api/analistas/${editId}` : 'http://localhost:3000/api/analistas';
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email }),
    }).then(() => {
      resetForm();
      fetchAnalistas();
    });
  };

  const handleEdit = (analista) => {
    setEditId(analista.id);
    setNome(analista.nome);
    setEmail(analista.email || '');
  }

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este analista? A ação não pode ser desfeita.')) {
        fetch(`http://localhost:3000/api/analistas/${id}`, { method: 'DELETE' })
        .then(() => fetchAnalistas());
    }
  }

  return (
    <div className="card">
      <div className="card-header"><h2>Cadastro de Analistas de Atendimento</h2></div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="input-group">
            <input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Analista" required />
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email do Analista" />
            <button type="submit" className="btn btn-primary">{editId ? 'Atualizar' : 'Adicionar'}</button>
            {editId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
        <ul className="list-group">
          {analistas.map(a => (
            <li key={a.id} className="list-group-item d-flex justify-content-between align-items-center">
              {a.nome} - {a.email}
              <div>
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(a)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CadastroAnalistas;