import GerenciadorEntidades from './GerenciadorEntidades';

function CadastroAnalistas() {
  const camposFormulario = [
    { name: 'nome', placeholder: 'Nome do Analista' },
    { name: 'email', placeholder: 'Email do Analista', type: 'email', required: false },
  ];

  const camposLista = ['nome', 'email'];

  return (
    <GerenciadorEntidades
      titulo="Cadastro de Analistas de Atendimento"
      endpointApi="/api/analistas"
      camposFormulario={camposFormulario}
      camposLista={camposLista}
    />
  );
}

export default CadastroAnalistas;
