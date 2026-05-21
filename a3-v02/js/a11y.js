// Aplica configurações de acessibilidade salvas ao carregar qualquer página.
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("viva_theme") || "light";
  const savedFontSize = localStorage.getItem("viva_fontsize") || "standard";

  document.documentElement.setAttribute("data-theme", savedTheme);
  document.documentElement.setAttribute("data-fontsize", savedFontSize);
});

function changeAccessibilitySettings(theme, fontSize) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-fontsize", fontSize);

  localStorage.setItem("viva_theme", theme);
  localStorage.setItem("viva_fontsize", fontSize);

  const usuarioLogado = JSON.parse(sessionStorage.getItem("viva_usuario_logado") || "null");
  if (!usuarioLogado) return;

  usuarioLogado.preferencias = {
    tema: theme,
    tamanhoFonte: fontSize,
  };

  sessionStorage.setItem("viva_usuario_logado", JSON.stringify(usuarioLogado));

  const usuariosBD = JSON.parse(localStorage.getItem("viva_usuarios") || "[]");
  const usuariosAtualizados = usuariosBD.map((usuario) =>
    usuario.cpf === usuarioLogado.cpf ? usuarioLogado : usuario
  );

  localStorage.setItem("viva_usuarios", JSON.stringify(usuariosAtualizados));
}
