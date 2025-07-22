import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function GerenciadorEntidades({ titulo, endpointApi, camposFormulario, camposLista }) {
  const [entidades, setEntidades] = useState([]);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  // Inicializa o estado do formulário com base nos campos definidos
  useEffect(() => {
    const initialState = camposFormulario.reduce((acc, campo) => {
      acc[campo.name] = '';
      return acc;
    }, {});
    setFormData(initialState);
  }, [camposFormulario]);

  const fetchEntidades = () => {
    setIsLoading(true);
    setError(null);
    fetch(`${apiUrl}${endpointApi}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Falha ao buscar dados da API');
        }
        return res.json();
      })
      .then(data => setEntidades(data))
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(fetchEntidades, [apiUrl, endpointApi]);

  const resetForm = () => {
    const initialState = camposFormulario.reduce((acc, campo) => {
      acc[campo.name] = '';
      return acc;
    }, {});
    setFormData(initialState);
    setEditId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const url = editId ? `${apiUrl}${endpointApi}/${editId}` : `${apiUrl}${endpointApi}`;
    const method = editId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    .then(res => {
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.message || 'Erro ao salvar entidade') });
        }
        return res.json();
    })
    .then(() => {
      resetForm();
      fetchEntidades(); // Re-fetch da lista
    })
    .catch(err => setError(err.message))
    .finally(() => setIsLoading(false));
  };

  const handleEdit = (entidade) => {
    setEditId(entidade.id);
    setFormData(entidade);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir? A ação não pode ser desfeita.')) {
      setIsLoading(true);
      setError(null);
      fetch(`${apiUrl}${endpointApi}/${id}`, { method: 'DELETE' })
        .then(res => {
            if (!res.ok) {
                throw new Error('Falha ao excluir');
            }
            fetchEntidades(); // Re-fetch
        })
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  };

  return (
    <div className="card">
      <div className="card-header"><h2>{titulo}</h2></div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="input-group">
            {camposFormulario.map(campo => (
              <input
                key={campo.name}
                type={campo.type || 'text'}
                name={campo.name}
                className="form-control"
                value={formData[campo.name] || ''}
                onChange={handleInputChange}
                placeholder={campo.placeholder}
                required={campo.required !== false}
              />
            ))}
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (editId ? 'Atualizar' : 'Adicionar')}
            </button>
            {editId && <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={isLoading}>Cancelar</button>}
          </div>
        </form>

        {isLoading && !entidades.length && <p>Carregando...</p>}

        <ul className="list-group">
          {entidades.map(entidade => (
            <li key={entidade.id} className="list-group-item d-flex justify-content-between align-items-center">
              {camposLista.map(campo => entidade[campo]).join(' - ')}
              <div>
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(entidade)} disabled={isLoading}>Editar</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entidade.id)} disabled={isLoading}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

GerenciadorEntidades.propTypes = {
  titulo: PropTypes.string.isRequired,
  endpointApi: PropTypes.string.isRequired,
  camposFormulario: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    type: PropTypes.string,
    required: PropTypes.bool,
  })).isRequired,
  camposLista: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default GerenciadorEntidades;
