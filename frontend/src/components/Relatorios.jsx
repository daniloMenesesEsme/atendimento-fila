import { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';

function Relatorios() {
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
    fetchRelatorios();
  }, [currentPage]);

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

  const handleGeneratePdf = () => {
    const element = reportTableRef.current;
    if (element) {
      // Cria um elemento de cabeçalho
      const headerDiv = document.createElement('div');
      headerDiv.style.textAlign = 'center';
      headerDiv.style.marginBottom = '20px';
      headerDiv.style.paddingBottom = '10px';
      headerDiv.style.borderBottom = '1px solid #eee';
      headerDiv.style.color = '#000000'; // Garante que o texto do cabeçalho seja preto
      headerDiv.style.backgroundColor = '#ffffff'; // Garante que o fundo do cabeçalho seja branco

      const reportTitle = "Relatório de Atendimentos Finalizados";
      const currentDate = new Date().toLocaleDateString('pt-BR');
      headerDiv.innerHTML = `
        <h1 style="margin: 0; font-size: 24px; color: #000000;">${reportTitle}</h1>
        <p style="margin: 5px 0 0; font-size: 14px; color: #000000;">Gerado em: ${currentDate}</p>
      `;

      // Prepend o cabeçalho ao elemento do relatório
      element.prepend(headerDiv);

      // Aplica estilos temporários diretamente ao elemento a ser capturado
      element.style.backgroundColor = '#ffffff'; // Força fundo branco para toda a área do relatório
      element.style.color = '#000000'; // Força texto preto para toda a área do relatório

      // Garante que todos os elementos da tabela também tenham texto preto e fundo branco
      const table = element.querySelector('table');
      if (table) {
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse'; // Mais compatível com html2canvas
        table.style.marginTop = '20px';
        table.style.textAlign = 'left';
        table.style.backgroundColor = '#ffffff';

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
          td.style.backgroundColor = '#ffffff';
        });
      }

      // Força a cor do texto para preto em todos os elementos dentro do elemento capturado
      const allElements = element.querySelectorAll('*');
      allElements.forEach(el => {
        el.style.color = '#000000';
      });

      const opt = {
        margin:       10,
        filename:     'relatorio_atendimentos.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Usa uma Promise para garantir que os estilos sejam aplicados antes da captura e removidos depois
      html2pdf().set(opt).from(element).save().then(() => {
        // Remove o cabeçalho e os estilos temporários após a geração do PDF
        element.removeChild(headerDiv);
        element.style.backgroundColor = ''; // Reverte fundo
        element.style.color = ''; // Reverte cor do texto
        if (table) {
          table.style.backgroundColor = '';
          table.style.borderCollapse = '';
          table.style.marginTop = '';
          table.style.textAlign = '';
          const ths = table.querySelectorAll('th');
          ths.forEach(th => {
            th.style.border = '';
            th.style.padding = '';
            th.style.backgroundColor = '';
            th.style.color = '';
          });
          const tds = table.querySelectorAll('td');
          tds.forEach(td => {
            td.style.border = '';
            td.style.padding = '';
            td.style.color = '';
            td.style.backgroundColor = '';
          });
        }
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
