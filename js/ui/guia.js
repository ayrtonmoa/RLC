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

        <div class="guia-tl-entry">
          <div class="guia-tl-date">30 Jun 2026<br><span class="guia-tl-time">23:11</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-new">NOVO</span>
            <strong>Plano de Merges inteligente</strong> — detecta miners na sala e no inventário, sugere merges prontos, mostra custo-benefício, barra de progresso nos ingredientes e ordenação por eficiência.
          </div>
        </div>

        <div class="guia-tl-entry">
          <div class="guia-tl-date">30 Jun 2026<br><span class="guia-tl-time">22:52</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-new">NOVO</span>
            <strong>Tooltip interativo nos níveis de merge</strong> — passe o mouse sobre qualquer nível para ver power, bônus%, custo e lista de peças necessárias.
          </div>
        </div>

        <div class="guia-tl-entry">
          <div class="guia-tl-date">30 Jun 2026<br><span class="guia-tl-time">22:33</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-new">NOVO</span>
            <strong>Variação de bônus% no merge</strong> — o card de merge agora exibe <em>20.00% → 40.00% +20.00%</em> igual ao power, para comparação direta.
          </div>
        </div>

        <div class="guia-tl-entry">
          <div class="guia-tl-date">30 Jun 2026<br><span class="guia-tl-time">17:48</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-improved">MELHORIA</span>
            <strong>Imagens das miners</strong> nos cards de merge e tabelas do inventário.
          </div>
        </div>

        <div class="guia-tl-entry">
          <div class="guia-tl-date">30 Jun 2026<br><span class="guia-tl-time">16:34</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-improved">MELHORIA</span>
            <strong>Base de miners atualizada</strong> — 8.070 entradas com receitas de merge completas.
          </div>
        </div>

        <div class="guia-tl-entry">
          <div class="guia-tl-date">30 Jun 2026<br><span class="guia-tl-time">03:43</span></div>
          <div class="guia-tl-content">
            <span class="guia-tag tag-fix">CORREÇÃO</span>
            <strong>Farm Calculator</strong> — fonte dos dados da rede atualizada para a página de Liga.
          </div>
        </div>

      </div>

      <!-- REFERÊNCIA RÁPIDA -->
      <div class="guia-section-header">
        <h2>Referência Rápida</h2>
        <p>Analise seu perfil primeiro — clique em <strong>Analisar</strong> com seu username do RollerCoin.</p>
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
          <div class="guia-tab-icon">🔀</div>
          <div class="guia-tab-name">Merge Analyzer</div>
          <p>Simule merges antes de fazer. Veja poder total resultante e ganho/perda líquida com bônus de coleção.</p>
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
