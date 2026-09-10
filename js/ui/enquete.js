// js/ui/enquete.js - Enquete "vídeo no YouTube?" pós-análise.
// Só aparece depois que a pessoa analisa um perfil de verdade (não é um formulário solto
// na página), e só uma vez por perfil — guardado no localStorage do navegador.

const UI_Enquete = {
  FORM_BASE: 'https://docs.google.com/forms/d/e/1FAIpQLScjUlP2RV__ewBZthrr-dtMPGA3tvgXzUx9q_H95ZOy0cK58w',
  ENTRY_VOTO: 'entry.611903372',
  ENTRY_USERNAME: 'entry.1063298113',

  // Recebe o texto exatamente como foi digitado na busca (não o nome completo que a
  // API do jogo resolve), por pedido explícito: quem preenche quer reconhecer o que
  // digitou, não descobrir que o nome de exibição tem sufixo diferente.
  mostrar(username) {
    if (!username) return;

    const chaveVotado = `enquete_youtube_votado_${username}`;
    if (localStorage.getItem(chaveVotado)) return; // já votou com esse perfil
    if (document.getElementById('enqueteYoutubeBanner')) return; // já está na tela

    this._usernameAtual = username;

    const banner = document.createElement('div');
    banner.id = 'enqueteYoutubeBanner';
    banner.className = 'enquete-banner';
    banner.innerHTML = `
      <span class="enquete-texto">🎥 Você gostaria que eu fizesse um vídeo no YouTube explicando as funcionalidades da ferramenta?</span>
      <div class="enquete-botoes">
        <button onclick="UI_Enquete.votar('Sim')">👍 Sim</button>
        <button onclick="UI_Enquete.votar('Não')">👎 Não</button>
        <button class="enquete-fechar" onclick="UI_Enquete.fechar()" aria-label="Fechar">✕</button>
      </div>
    `;
    document.body.appendChild(banner);
  },

  votar(resposta) {
    const username = this._usernameAtual;
    if (!username) return;

    const body = new URLSearchParams();
    body.set(this.ENTRY_VOTO, resposta);
    body.set(this.ENTRY_USERNAME, username);

    // O Google Forms não libera CORS pra essa rota; "no-cors" ainda assim manda o POST,
    // só não dá pra ler a resposta (fica "opaque"). É o jeito padrão de submeter sem
    // redirecionar o usuário pra fora do site.
    fetch(`${this.FORM_BASE}/formResponse`, { method: 'POST', mode: 'no-cors', body }).catch(() => {});

    localStorage.setItem(`enquete_youtube_votado_${username}`, resposta);
    this._mostrarObrigado();
  },

  fechar() {
    const banner = document.getElementById('enqueteYoutubeBanner');
    if (banner) banner.remove();
  },

  _mostrarObrigado() {
    const banner = document.getElementById('enqueteYoutubeBanner');
    if (!banner) return;
    banner.innerHTML = '<span class="enquete-texto">🙏 Valeu pela resposta!</span>';
    setTimeout(() => banner.remove(), 2500);
  }
};

window.UI_Enquete = UI_Enquete;
console.log('✅ UI_Enquete loaded');
