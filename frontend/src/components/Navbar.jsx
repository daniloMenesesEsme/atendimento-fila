import React from 'react';

function Navbar({ setView }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <a className="navbar-brand text-white" href="#" onClick={() => setView('dashboard')}>Fila de Atendimento</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link text-white" href="#" onClick={() => setView('dashboard')}>Dashboard</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="#" onClick={() => setView('relatorios')}>Relatórios</a>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle text-white" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Cadastros
              </a>
              <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                <li><a className="dropdown-item" href="#" onClick={() => setView('cadastroConsultores')}>Consultores</a></li>
                <li><a className="dropdown-item" href="#" onClick={() => setView('cadastroAnalistas')}>Analistas</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
