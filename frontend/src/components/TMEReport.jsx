import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function TMEReport() {
  const [tmeData, setTmeData] = useState([]);
  const [consultorFilter, setConsultorFilter] = useState('');
  const [analistaFilter, setAnalistaFilter] = useState('');
  const [caseNumberFilter, setCaseNumberFilter] = useState('');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [granularity, setGranularity] = useState('daily'); // 'daily', 'weekly', 'monthly', 'total'
  const [chartType, setChartType] = useState('bar'); // 'bar', 'line'

  const fetchTMEData = async () => {
    const queryParams = new URLSearchParams({
      consultor: consultorFilter,
      analista: analistaFilter,
      caseNumber: caseNumberFilter,
      dataInicio: dataInicioFilter,
      dataFim: dataFimFilter,
      granularity: granularity,
    }).toString();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/relatorios/tme?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTmeData(data);
    } catch (error) {
      console.error("Erro ao buscar dados de TME:", error);
      setTmeData([]);
    }
  };

  useEffect(() => {
    fetchTMEData();
  }, [consultorFilter, analistaFilter, caseNumberFilter, dataInicioFilter, dataFimFilter, granularity]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTMEData();
  };

  const handleClearFilters = () => {
    setConsultorFilter('');
    setAnalistaFilter('');
    setCaseNumberFilter('');
    setDataInicioFilter('');
    setDataFimFilter('');
    setGranularity('daily');
    setChartType('bar');
    // fetchTMEData will be called by useEffect due to filter state changes
  };

  const chartLabels = tmeData.map(item => item.period);
  const chartValues = tmeData.map(item => item.tme_seconds ? (item.tme_seconds / 60).toFixed(2) : 0); // Convert seconds to minutes

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'TME (minutos)',
        data: chartValues,
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tempo Médio de Espera (TME)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tempo (minutos)',
        },
      },
    },
  };

  return (
    <div className="tme-report">
      <h3>Relatório de Tempo Médio de Espera (TME)</h3>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Filtrar por Consultor" value={consultorFilter} onChange={(e) => setConsultorFilter(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Filtrar por Atendente" value={analistaFilter} onChange={(e) => setAnalistaFilter(e.target.value)} />
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
            <select className="form-select" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="total">Total</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select" value={chartType} onChange={(e) => setChartType(e.target.value)}>
              <option value="bar">Gráfico de Barras</option>
              <option value="line">Gráfico de Linha</option>
            </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">Buscar</button>
          </div>
          <div className="col-md-2">
            <button type="button" className="btn btn-secondary w-100" onClick={handleClearFilters}>Limpar Filtros</button>
          </div>
        </div>
      </form>

      <div className="chart-container" style={{ height: '400px' }}>
        {tmeData.length > 0 ? (
          chartType === 'bar' ? (
            <Bar data={data} options={options} />
          ) : (
            <Line data={data} options={options} />
          )
        ) : (
          <p>Nenhum dado de TME encontrado para os filtros aplicados.</p>
        )}
      </div>
    </div>
  );
}

export default TMEReport;
