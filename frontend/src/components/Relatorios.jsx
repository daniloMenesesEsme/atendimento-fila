import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

function Relatorios() {
  const [atendimentos, setAtendimentos] = useState([]);
  const [franqueadoFilter, setFranqueadoFilter] = useState('');
  const [consultorFilter, setConsultorFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
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
    fetchRelatorios();
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRelatorios();
  };

  const handleClearFilters = () => {
    setFranqueadoFilter('');
    setConsultorFilter('');
    setDataInicioFilter('');
    setDataFimFilter('');
    fetchRelatorios();
  };

  const handleGeneratePdf = () => {
    const element = reportTableRef.current;
    if (element) {
      // Cria um elemento temporário para a geração do PDF
      const tempElement = document.createElement('div');
      tempElement.style.backgroundColor = '#ffffff'; // Fundo branco
      tempElement.style.color = '#000000'; // Texto preto
      tempElement.style.padding = '20px';
      tempElement.style.border = '1px solid #ccc';
      tempElement.style.width = '100%'; // Garante que o elemento temporário ocupe a largura total
      tempElement.style.boxSizing = 'border-box'; // Inclui padding e border na largura total

      // Copia o conteúdo HTML do elemento original para o temporário
      tempElement.innerHTML = element.innerHTML;

      // Adiciona estilos específicos para a tabela dentro do elemento temporário
      const table = tempElement.querySelector('table');
      if (table) {
        table.style.width = '100%';
        table.style.borderCollapse = 'separate';
        table.style.borderSpacing = '0 10px';
        table.style.marginTop = '20px';
        table.style.textAlign = 'left'; // Alinha o texto à esquerda para melhor leitura no PDF

        const ths = table.querySelectorAll('th');
        ths.forEach(th => {
          th.style.border = '1px solid #ddd';
          th.style.padding = '8px';
          th.style.backgroundColor = '#f2f2f2';
          th.style.color = '#000000';
        });

        const tds = table.querySelectorAll('td');
        tds.forEach(td => {
          td.style.border = '1px solid #ddd';
          td.style.padding = '8px';
          td.style.color = '#000000';
        });
      }

      // Adiciona o elemento temporário ao corpo do documento (oculto)
      tempElement.style.position = 'absolute';
      tempElement.style.left = '-9999px'; // Move para fora da tela
      document.body.appendChild(tempElement);

      const opt = {
        margin:       10,
        filename:     'relatorio_atendimentos.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(tempElement).save().then(() => {
        // Remove o elemento temporário após a geração do PDF
        document.body.removeChild(tempElement);
      });
    }
  };

  const formatarData = (data) => {
    if (!data) return '-';
    return new Date(data).toLocaleString('pt-BR');
  };

  return (
    <div className="card relatorios">

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
            <button type="button" className="btn btn-success w-100" onClick={handleGeneratePdf}>Salvar como PDF</button>
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
    </div>
  );
}

export default Relatorios;
