/*
  api.js
  Inicializa o banco simulado do projeto.
  Le os arquivos JSON de usuarios e convenios e copia os dados para o localStorage,
  permitindo que as paginas alterem informacoes sem mexer diretamente no JSON.
*/
async function inicializarBancoDeDados() {
  try {
    if (!localStorage.getItem("viva_usuarios")) {
      const resUsuarios = await fetch("./data/usuarios.json");
      if (!resUsuarios.ok) throw new Error("Não foi possível carregar usuarios.json");
      const usuarios = await resUsuarios.json();
      localStorage.setItem("viva_usuarios", JSON.stringify(usuarios));
    }

    if (!localStorage.getItem("viva_convenios")) {
      const resConvenios = await fetch("./data/convenios.json");
      if (!resConvenios.ok) throw new Error("Não foi possível carregar convenios.json");
      const convenios = await resConvenios.json();
      localStorage.setItem("viva_convenios", JSON.stringify(convenios));
    }

    return true;
  } catch (error) {
    console.error("Erro ao inicializar o banco simulado:", error);
    return false;
  }
}

window.vivaDBReady = inicializarBancoDeDados();
