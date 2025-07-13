import { useState, useEffect } from 'react';

function CadastroConsultores() {
  const [consultores, setConsultores] = useState([]);
  const [nome, setNome] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [email, setEmail] = useState('');
  const [editId, setEditId] = useState(null);

  const fetchConsultores = () => {
    fetch(import.meta.env.VITE_API_URL + '/api/consultores')
      .then(res => res.json())
      .then(data => setConsultores(data));
  };

  useEffect(fetchConsultores, []);

  const resetForm = () => {
    setNome('');
    setMeetLink('');
    setEmail('');
    setEditId(null);
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = editId ? `${import.meta.env.VITE_API_URL}/api/consultores/${editId}` : `${import.meta.env.VITE_API_URL}/api/consultores`;
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, meet_link: meetLink, email }),
    }).then(() => {
      resetForm();
      fetchConsultores();
    });
  };

  const handleEdit = (consultor) => {
    setEditId(consultor.id);
    setNome(consultor.nome);
    setMeetLink(consultor.meet_link);
    setEmail(consultor.email || '');
  }

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este consultor?')) {
        fetch(`${import.meta.env.VITE_API_URL}/api/consultores/${id}`, { method: 'DELETE' })
        .then(() => fetchConsultores());
    }
  }

  return (
    <div className="card">
      <div className="card-header"><h2>Cadastro de Consultores</h2></div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="input-group">
            <input type="text" className="form-control" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do Consultor" required />
            <input type="text" className="form-control" value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="Link da Sala Meet" required />
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email do Consultor" />
            <button type="submit" className="btn btn-primary">{editId ? 'Atualizar' : 'Adicionar'}</button>
            {editId && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>}
          </div>
        </form>
        <ul className="list-group">
          {consultores.map(c => (
            <li key={c.id} className="list-group-item d-flex justify-content-between align-items-center">
              {c.nome} - {c.meet_link} - {c.email}
              <div>
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(c)}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CadastroConsultores;