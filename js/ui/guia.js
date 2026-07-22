// js/ui/guia.js

const UI_Guia = {
  mostrar() {
    const div = document.getElementById('guia');
    div.innerHTML = `
      <div class="guia-hero">
        <div class="guia-hero-text">
          <h1 class="guia-title">RollerCoin Analyzer Pro</h1>
          <p class="guia-subtitle">Tome decisões estratégicas baseadas em dados reais do seu perfil.</p>
        </div>
      </div>

      <!-- UPDATES RECENTES -->
      <div class="guia-updates-header">
        <span class="guia-updates-badge">NOVIDADES</span>
        <h2 class="guia-updates-title">Últimas Atualizações</h2>
      </div>

      <div class="guia-timeline">
        ${UI_Changelog.renderPreview(3)}
      </div>

      <div class="guia-updates-more">
        <button class="guia-updates-more-btn" onclick="UI_Tabs.switchTo('changelog')">Ver todas as atualizações (${UI_Changelog.updates.length}) →</button>
      </div>

      <!-- COMO COMEÇAR -->
      <div class="guia-start-box">
        <div class="guia-start-title">🚀 Por onde começar</div>
        <div class="guia-start-steps">
          <div class="guia-start-step">
            <div class="guia-step-num">1</div>
            <div>Acesse <a href="https://rollercoin.com/profile/personal-profile" target="_blank">rollercoin.com/profile/personal-profile</a> e localize seu <strong>Profile Link</strong>.</div>
          </div>
          <div class="guia-start-step">
            <div class="guia-step-num">2</div>
            <div>Copie apenas a parte após <code>/p/</code> da URL — ex: se o link for <code>rollercoin.com/p/PlayerExample</code>, use <strong>PlayerExample</strong>.</div>
          </div>
          <div class="guia-start-step">
            <div class="guia-step-num">3</div>
            <div>Cole no campo <strong>Username</strong> no topo e clique em <strong>🔍 Analisar</strong>.</div>
          </div>
        </div>
      </div>

      <!-- REFERÊNCIA RÁPIDA -->
      <div class="guia-section-header">
        <h2>Referência Rápida</h2>
      </div>

      <div class="guia-tabs-grid">

        <div class="guia-tab-card">
          <div class="guia-tab-icon">📊</div>
          <div class="guia-tab-name">Resumo</div>
          <p>Visão geral do seu poder total: base, bônus de coleção, racks e power por sala.</p>
        </div>

        <div class="guia-tab-card guia-tab-highlight">
          <div class="guia-tab-icon">📦</div>
          <div class="guia-tab-name">Inventário</div>
          <p>Cole o conteúdo do Storage. Veja impacto de cada miner, troca inteligente e <strong>plano de merges</strong> com sugestões automáticas.</p>
        </div>

        <div class="guia-tab-card">
          <div class="guia-tab-icon">🌾</div>
          <div class="guia-tab-name">Farm Calculator</div>
          <p>Descubra a crypto mais lucrativa para farmar. Compara Game Coins vs Cryptos com dados reais da sua liga.</p>
        </div>

        <div class="guia-tab-card">
          <div class="guia-tab-icon">🛒</div>
          <div class="guia-tab-name">Buy Analyzer</div>
          <p>Analise se vale comprar uma miner do marketplace. Calcula ROI real considerando seu perfil atual.</p>
        </div>

        <div class="guia-tab-card">
          <div class="guia-tab-icon">🔧</div>
          <div class="guia-tab-name">Parts</div>
          <p>Calcule quanto custa fazer merge das suas peças (Fan, Wire, Hashboard). Normal e reverso.</p>
        </div>

        <div class="guia-tab-card">
          <div class="guia-tab-icon">📈</div>
          <div class="guia-tab-name">Parts vs Market</div>
          <p>Compare: fazer merge das peças, vendê-las no mercado ou comprar a miner pronta. Recomendação automática.</p>
        </div>

        <div class="guia-tab-card">
          <div class="guia-tab-icon">💰</div>
          <div class="guia-tab-name">RST Sell</div>
          <p>Calcule quanto RST você tem e descubra a melhor estratégia de venda em USD/BRL.</p>
        </div>

        <div class="guia-tab-card">
          <div class="guia-tab-icon">🏗️</div>
          <div class="guia-tab-name">Racks</div>
          <p>Eficiência dos seus racks, capacidade vs ocupação e identificação de racks subutilizados.</p>
        </div>

      </div>

      <!-- FARM CALCULATOR HOW-TO -->
      <div class="guia-section-header">
        <h2>🌾 Como usar o Farm Calculator</h2>
      </div>

      <div class="guia-howto">
        <div class="guia-howto-steps">
          <div class="guia-step">
            <div class="guia-step-num">1</div>
            <div>Analise seu perfil para detectar sua liga automaticamente.</div>
          </div>
          <div class="guia-step">
            <div class="guia-step-num">2</div>
            <div>Acesse <a href="https://rollercoin.com/game/league" target="_blank">rollercoin.com/game/league</a> e clique na aba <strong>League Power</strong>.</div>
          </div>
          <div class="guia-step">
            <div class="guia-step-num">3</div>
            <div>Na seção <strong>League Power Partition</strong>, selecione tudo (Ctrl+A) e copie (Ctrl+C).</div>
          </div>
          <div class="guia-step">
            <div class="guia-step-num">4</div>
            <div>Cole no campo <strong>Rede das moedas</strong> e clique em <strong>💰 Calcular</strong>.</div>
          </div>
        </div>
        <div class="guia-howto-note">
          ⚠️ A fonte dos dados mudou — não use mais a página "Choose Cryptocurrency". Use a página de <strong>Liga → League Power</strong>.
        </div>
      </div>

      <!-- INVENTÁRIO HOW-TO -->
      <div class="guia-section-header">
        <h2>📦 Como usar o Inventário</h2>
      </div>

      <div class="guia-howto">
        <div class="guia-howto-steps">
          <div class="guia-step">
            <div class="guia-step-num">1</div>
            <div>Acesse <a href="https://rollercoin.com/game/storage" target="_blank">rollercoin.com/game/storage</a>.</div>
          </div>
          <div class="guia-step">
            <div class="guia-step-num">2</div>
            <div>Selecione tudo (Ctrl+A) e copie (Ctrl+C).</div>
          </div>
          <div class="guia-step">
            <div class="guia-step-num">3</div>
            <div>Cole no campo <strong>Inventário</strong> e clique em <strong>Analisar Inventário</strong>.</div>
          </div>
          <div class="guia-step">
            <div class="guia-step-num">4</div>
            <div>Para o <strong>Plano de Merges</strong>, cole também o conteúdo das suas <strong>Peças</strong> (Wires, Fans etc.) no campo correspondente.</div>
          </div>
        </div>
      </div>

      <p class="guia-footer-note">
        Ferramenta criada pela comunidade RollerCoin. Não afiliada oficialmente ao RollerCoin.
      </p>
    `;
  }
};

window.UI_Guia = UI_Guia;
console.log('✅ UI_Guia loaded');
