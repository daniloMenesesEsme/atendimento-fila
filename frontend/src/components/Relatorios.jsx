import { useState, useEffect, useRef } from 'react';
import TMAReport from './TMAReport';
import TMEReport from './TMEReport';


function Relatorios() {
  const [activeTab, setActiveTab] = useState('atendimentos'); // 'atendimentos', 'tma', 'tme'
  const [atendimentos, setAtendimentos] = useState([]);
  const [franqueadoFilter, setFranqueadoFilter] = useState('');
  const [consultorFilter, setConsultorFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [caseNumberFilter, setCaseNumberFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Você pode tornar isso configurável se quiser
  const [totalItems, setTotalItems] = useState(0);
  const reportTableRef = useRef(null);

  const fetchRelatorios = () => {
    const queryParams = new URLSearchParams({
      franqueado: franqueadoFilter,
      consultor: consultorFilter,
      dataInicio: dataInicioFilter,
      dataFim: dataFimFilter,
      caseNumber: caseNumberFilter,
      page: currentPage,
      limit: itemsPerPage,
    }).toString();

    fetch(`${import.meta.env.VITE_API_URL}/api/relatorios/atendimentos?${queryParams}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
          });
        }
        return res.json();
      })
      .then(data => {
        setAtendimentos(data.data);
        setTotalItems(data.total);
      })
      .catch(err => {
        console.error("Erro ao buscar relatórios:", err.message);
        setAtendimentos([]); // Limpa atendimentos em caso de erro
        setTotalItems(0);
      });
  };

  useEffect(() => {
    if (activeTab === 'atendimentos') {
      fetchRelatorios();
    }
  }, [currentPage, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (currentPage === 1) {
      fetchRelatorios(); // Se já estiver na primeira página, busca diretamente
    } else {
      setCurrentPage(1); // Caso contrário, reseta para a primeira página (o useEffect fará a busca)
    }
  };

  const handleClearFilters = () => {
    setFranqueadoFilter('');
    setConsultorFilter('');
    setDataInicioFilter('');
    setDataFimFilter('');
    setCaseNumberFilter('');
    fetchRelatorios();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const queryParams = new URLSearchParams({
      franqueado: franqueadoFilter,
      consultor: consultorFilter,
      dataInicio: dataInicioFilter,
      dataFim: dataFimFilter,
      caseNumber: caseNumberFilter,
    }).toString();

    window.open(`${import.meta.env.VITE_API_URL}/api/relatorios/atendimentos/export-excel?${queryParams}`, '_blank');
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <div className="card relatorios">
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'atendimentos' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('atendimentos')}>Relatório de Atendimentos</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'tma' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('tma')}>Dados TMA</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'tme' ? 'active' : ''}`} href="#" onClick={() => setActiveTab('tme')}>Dados TME</a>
        </li>
      </ul>

      {activeTab === 'atendimentos' && (
        <>
          {/* FORMULÁRIO DE FILTRO FORA DO PDF */}
          <form onSubmit={handleSearch} className="mb-4 no-print">
            <div className="row g-3">
              <div className="col-md-3">
                <input type="text" className="form-control" placeholder="Filtrar por Atendente" value={franqueadoFilter} onChange={(e) => setFranqueadoFilter(e.target.value)} />
              </div>
              <div className="col-md-3">
                <input type="text" className="form-control" placeholder="Filtrar por Consultor" value={consultorFilter} onChange={(e) => setConsultorFilter(e.target.value)} />
              </div>
              <div className="col-md-2">
                <input type="text" className="form-control" placeholder="Filtrar por Nº do Caso" value={caseNumberFilter} onChange={(e) => setCaseNumberFilter(e.target.value)} />
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control" title="Data Início" value={dataInicioFilter} onChange={(e) => setDataInicioFilter(e.target.value)} />
              </div>
              <div className="col-md-2">
                <input type="date" className="form-control" title="Data Fim" value={dataFimFilter} onChange={(e) => setDataFimFilter(e.target.value)} />
              </div>
              <div className="col-md-2">
                <button type="submit" className="btn btn-primary w-100">Buscar</button>
              </div>
              <div className="col-md-2">
                <button type="button" className="btn btn-secondary w-100" onClick={handleClearFilters}>Limpar</button>
              </div>
              <div className="col-md-2">
                <button type="button" className="btn btn-info w-100" onClick={handlePrint}>Imprimir</button>
              </div>
              <div className="col-md-2">
                <button type="button" className="btn btn-success w-100" onClick={handleExportExcel}>Exportar Excel</button>
              </div>
              
            </div>
          </form>

          {/* ÁREA DO RELATÓRIO PARA EXPORTAÇÃO */}
          <div ref={reportTableRef}>
            <h2>Relatório de Atendimentos Finalizados</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Atendente</th>
                  <th>Consultor</th>
                  <th>Nº do Caso</th>
                  <th>Chegada na Fila</th>
                  <th>Início do Atendimento</th>
                  <th style={{ minWidth: '180px' }}>Fim do Atendimento</th>
                </tr>
              </thead>
              <tbody>
                {atendimentos.map(a => (
                  <tr key={a.id}>
                    <td>{a.nome_atendente}</td>
                    <td>{a.nome_consultor}</td>
                    <td>{a.case_number || '-'}</td>
                    <td>{formatarData(a.chegada_em)}</td>
                    <td>{formatarData(a.inicio_em)}</td>
                    <td>{formatarData(a.finalizado_em)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Controles de Paginação */}
            <div className="pagination-controls mt-3">
              <button
                className="btn btn-secondary me-2"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>Página {currentPage} de {Math.ceil(totalItems / itemsPerPage)}</span>
              <button
                className="btn btn-secondary ms-2"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage)))}
                disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
              >
                Próximo
              </button>
            </div>

          </div>
        </>
      )}

      {activeTab === 'tma' && (
        <TMAReport />
      )}

      {activeTab === 'tme' && (
        <TMEReport />
      )}
    </div>
  );
}

export default Relatorios;
