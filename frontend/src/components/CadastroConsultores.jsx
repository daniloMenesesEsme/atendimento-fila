import GerenciadorEntidades from './GerenciadorEntidades';

function CadastroConsultores() {
  const camposFormulario = [
    { name: 'nome', placeholder: 'Nome do Consultor' },
    { name: 'meet_link', placeholder: 'Link da Sala Meet' },
    { name: 'email', placeholder: 'Email do Consultor', type: 'email', required: false },
  ];

  const camposLista = ['nome', 'meet_link', 'email'];

  return (
    <GerenciadorEntidades
      titulo="Cadastro de Consultores"
      endpointApi="/api/consultores"
      camposFormulario={camposFormulario}
      camposLista={camposLista}
    />
  );
}

export default CadastroConsultores;
