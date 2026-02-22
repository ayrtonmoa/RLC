// js/ui/rstSellAnalyzer.js - RST Calculator & Sell Analyzer (CSS Cleanup)

const UI_RSTSellAnalyzer = {
  // Taxas oficiais do RollerCoin
  mergeCosts: {
    common: { need: 50, cost: 0.005 },
    uncommon: { need: 20, cost: 0.105 },
    rare: { need: 10, cost: 1.1025 },
    epic: { need: 5, cost: 5.7881 }
  },

  // Constantes RST
  rstConstants: {
    boxPrice: 40,
    partsPerBox: 175,
    marketFee: 0.05
  },

  // Preços de mercado
  marketPrices: {
    common: { fan: 0.0018, wire: 0.0019, hashboard: 0.0019 },
    uncommon: { fan: 0.0987, wire: 0.0945, hashboard: 0.0945 },
    rare: { fan: 2.25, wire: 2.11, hashboard: 2.14 },
    epic: { fan: 22.78, wire: 23.62, hashboard: 23.10 },
    legendary: { fan: 83.90, wire: 89.00, hashboard: 85.00 }
  },

  mostrar() {
    this.carregarPrecosSalvos();

    const div = document.getElementById('rstsellanalyzer');
    
    const lastUpdate = localStorage.getItem('rollercoin_prices_update');
    const hasUpdatedPrices = lastUpdate !== null;
    const updateDate = hasUpdatedPrices ? new Date(lastUpdate).toLocaleString('pt-BR') : 'Nunca';
    
    div.innerHTML = `
      <h2>🎁 RST & Sell Analyzer</h2>
      
      ${!hasUpdatedPrices ? `
        <div class="summary-item rst-box-red">
          <h4>⚠️ Preços Não Atualizados</h4>
          <p class="text-13">
            Para usar esta ferramenta, você precisa atualizar os preços do marketplace primeiro!<br>
            📍 Vá em <strong>💰 Merge vs Market</strong> e cole os preços da página.
          </p>
          <button onclick="UI_Tabs.switchTo('mergevsmarket')" style="padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            ➡️ Ir para Merge vs Market
          </button>
        </div>
      ` : `
        <div class="rst-box-green">
          <h4>✅ Preços Atualizados</h4>
          <p style="font-size: 12px; color: #666;">
            Última atualização: <strong>${updateDate}</strong><br>
            💡 Para atualizar novamente, vá em <strong>💰 Merge vs Market</strong>
          </p>
        </div>
      `}
      
      <div class="rst-box-purple">
        <h4>💡 Créditos e Colaboradores</h4>
        <p class="text-13">
          Agradecimentos especiais a: <strong>BBJ Anderson</strong>, <strong>Edu Godinho</strong>, <strong>SilverGuns</strong> e <strong>Yeso</strong>.
        </p>
      </div>

      <!-- SEÇÃO 1: RST CALCULATOR -->
      <h3>🎁 RST Calculator</h3>
      <div class="rst-calculator-grid">
        <div class="summary-item">
          <h4>💎 Seus RST</h4>
          
          <div class="rst-input-group">
            <label class="rst-input-label">Quantidade de RST:</label>
            <input type="number" id="rstAmount" placeholder="Ex: 1500" min="1" style="width: 100%; padding: 10px;">
          </div>

          <div class="rst-input-group">
            <label class="rst-input-label">Preço da Caixa (RST):</label>
            <input type="number" id="boxPrice" value="40" min="1" style="width: 100%; padding: 10px;">
            <small class="rst-input-hint">Padrão: 40 RST/caixa</small>
          </div>

          <div class="rst-input-group">
            <label class="rst-input-label">Peças por Caixa (mínimo):</label>
            <input type="number" id="partsPerBox" value="175" min="1" style="width: 100%; padding: 10px;">
            <small class="rst-input-hint">Padrão: 175 peças Common/caixa</small>
          </div>

          <button onclick="UI_RSTSellAnalyzer.calcularRST()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold; background: #9C27B0; color: white; border: none; border-radius: 5px; cursor: pointer;">
            🎁 Calcular RST
          </button>
        </div>

        <div class="rst-box-orange">
          <h4>📋 Como Funciona</h4>
          <p class="text-13">
            <strong>Passo 1:</strong> RST ÷ Preço caixa = Caixas<br>
            <strong>Passo 2:</strong> Caixas × Peças/caixa = Total peças Common<br>
            <strong>Passo 3:</strong> Peças × Preço mercado = Valor bruto<br>
            <strong>Passo 4:</strong> Valor bruto - 5% taxa = Valor líquido
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            💡 Considera apenas peças brancas (Common)<br>
            📊 Usa preços atualizados do marketplace
          </p>
        </div>
      </div>

      <div id="resultadoRST"></div>

      <hr style="margin: 40px 0; border: 0; border-top: 2px solid #ddd;">

      <!-- SEÇÃO 2: SELL ANALYZER -->
      <h3>💰 Sell Analyzer</h3>
      <div class="rst-box-green">
        <h4>💡 Visão Geral por Tipo de Peça</h4>
        <p class="text-13">
          Veja de uma vez todos os tiers e descubra quais vale a pena vender!<br>
          Sistema mostra: <strong>Mercado | Custo | Venda Mínima | Vale Vender?</strong>
        </p>
      </div>

      <div class="summary-item">
        <h4>📦 Escolha o Tipo de Peça</h4>
        <div class="rst-part-grid">
          <button onclick="UI_RSTSellAnalyzer.analisarTipoPeca('fan')" class="rst-part-btn fan">
            🌀 Fan
          </button>
          <button onclick="UI_RSTSellAnalyzer.analisarTipoPeca('wire')" class="rst-part-btn wire">
            🔌 Wire
          </button>
          <button onclick="UI_RSTSellAnalyzer.analisarTipoPeca('hashboard')" class="rst-part-btn hashboard">
            💾 Hashboard
          </button>
        </div>
        <p class="rst-part-hint">
          Clique em um tipo de peça para ver a análise completa de todos os tiers
        </p>
      </div>

      <div id="resultadoVenda"></div>
    `;
  },

  // ========== RST CALCULATOR ==========
  calcularRST() {
    const rstAmount = parseInt(document.getElementById('rstAmount').value);
    const boxPrice = parseInt(document.getElementById('boxPrice').value);
    const partsPerBox = parseInt(document.getElementById('partsPerBox').value);
    
    const resultDiv = document.getElementById('resultadoRST');
    
    if (!rstAmount || rstAmount <= 0 || !boxPrice || boxPrice <= 0 || !partsPerBox || partsPerBox <= 0) {
      resultDiv.innerHTML = `
        <div class="summary-item">
          <h4>⚠️ Erro</h4>
          <p>Por favor, preencha todos os campos com valores válidos!</p>
        </div>
      `;
      return;
    }

    const numBoxes = Math.floor(rstAmount / boxPrice);
    const totalParts = numBoxes * partsPerBox;
    const rstLeftover = rstAmount % boxPrice;
    
    const results = [];
    ['fan', 'wire', 'hashboard'].forEach(partType => {
      const partPrice = this.marketPrices.common[partType];
      const grossValue = totalParts * partPrice;
      const marketFee = grossValue * this.rstConstants.marketFee;
      const netValue = grossValue - marketFee;
      
      results.push({
        partType,
        partPrice,
        grossValue,
        marketFee,
        netValue
      });
    });
    
    this.mostrarResultadoRST({
      rstAmount,
      boxPrice,
      partsPerBox,
      numBoxes,
      totalParts,
      rstLeftover,
      results
    });
  },

  mostrarResultadoRST(data) {
    const resultDiv = document.getElementById('resultadoRST');
    
    const partEmojis = { fan: '🌀', wire: '🔌', hashboard: '💾' };
    const partNames = { fan: 'Fan', wire: 'Wire', hashboard: 'Hashboard' };
    
    let html = `
      <div class="summary-item">
        <h3>🎁 Resultado da Conversão RST</h3>
        
        <div class="rst-result-grid">
          <div class="rst-result-box">
            <h4 class="rst-result-title" style="color: #9C27B0;">💎 Seus RST</h4>
            <p class="rst-result-value">${data.rstAmount}</p>
            <p class="rst-result-desc">RST disponíveis</p>
          </div>

          <div class="rst-result-box">
            <h4 class="rst-result-title" style="color: #FF9800;">🎁 Caixas</h4>
            <p class="rst-result-value">${data.numBoxes}</p>
            <p class="rst-result-desc">caixas de ${data.boxPrice} RST</p>
            ${data.rstLeftover > 0 ? `<p class="rst-result-leftover">Sobra: ${data.rstLeftover} RST</p>` : ''}
          </div>
        </div>

        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

        <h4 style="margin: 20px 0 10px 0;">📦 Peças Obtidas:</h4>
        <div class="rst-parts-box">
          <div class="rst-parts-flex">
            <div>
              <p style="font-size: 16px; margin: 5px 0;"><strong>Total de Peças Common:</strong></p>
              <p style="font-size: 13px; color: #666; margin: 5px 0;">${data.numBoxes} caixas × ${data.partsPerBox} peças/caixa</p>
            </div>
            <div>
              <p class="rst-parts-total">⚪ ${data.totalParts}</p>
            </div>
          </div>
        </div>

        <h4 style="margin: 20px 0 10px 0;">💰 Valor por Tipo de Peça:</h4>
    `;
    
    data.results.forEach(result => {
      html += `
        <div class="rst-value-card">
          <h4 style="margin: 0 0 10px 0;">${partEmojis[result.partType]} ${partNames[result.partType]}</h4>
          <div class="rst-value-grid">
            <div>
              <span class="rst-value-label">Valor bruto:</span><br>
              <strong>${result.grossValue.toFixed(4)} RLT</strong>
            </div>
            <div>
              <span class="rst-value-negative">Taxa (5%):</span><br>
              <strong>-${result.marketFee.toFixed(4)} RLT</strong>
            </div>
            <div>
              <span class="rst-value-positive">Valor líquido:</span><br>
              <strong style="font-size: 16px;">${result.netValue.toFixed(4)} RLT</strong>
            </div>
          </div>
        </div>
      `;
    });
    
    const avgNetValue = data.results.reduce((sum, r) => sum + r.netValue, 0) / data.results.length;
    
    html += `
        <div class="rst-summary-box">
          <h3 class="rst-summary-title">📊 Resumo Final</h3>
          <p class="rst-summary-subtitle">
            ${data.rstAmount} RST → ${data.numBoxes} caixas → ${data.totalParts} peças Common
          </p>
          <p class="rst-summary-value">${avgNetValue.toFixed(4)} RLT</p>
          <p class="rst-summary-desc">
            Valor médio líquido (após taxa de 5%)
          </p>
        </div>
      </div>

      <div class="rst-box-yellow">
        <h4>⚠️ Importante</h4>
        <p class="text-13">
          💡 Este cálculo considera <strong>apenas peças Common</strong> (brancas).<br>
          🎁 Caixas podem vir com peças de tiers superiores, aumentando o valor real.<br>
          📊 Use como <strong>referência mínima</strong> para tomar decisões.<br>
          🔄 Preços variam - atualize sempre no "Merge vs Market"!
        </p>
      </div>
    `;
    
    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // ========== SELL ANALYZER ==========
  analisarTipoPeca(partType) {
    const tiers = ['uncommon', 'rare', 'epic', 'legendary'];
    const partEmojis = { fan: '🌀', wire: '🔌', hashboard: '💾' };
    const partNames = { fan: 'Fan', wire: 'Wire', hashboard: 'Hashboard' };
    
    const resultDiv = document.getElementById('resultadoVenda');
    
    const analyses = tiers.map(tier => {
      const productionCost = this.calcularCustoProducao(tier, 1);
      const minSellPrice = productionCost * (1 + this.rstConstants.marketFee);
      const marketPrice = this.marketPrices[tier][partType];
      const shouldSell = marketPrice >= minSellPrice;
      const profit = marketPrice - minSellPrice;
      const profitPercent = (profit / minSellPrice) * 100;
      
      return {
        tier,
        productionCost,
        minSellPrice,
        marketPrice,
        shouldSell,
        profit,
        profitPercent
      };
    });
    
    let html = `
      <div class="rst-box-green" style="margin-top: 30px;">
        <h3>${partEmojis[partType]} Análise Completa: ${partNames[partType]}</h3>
        
        <div class="table-overflow">
          <table class="analysis-table">
            <thead>
              <tr>
                <th class="th-left">Tier</th>
                <th class="th-center">🟢 Uncommon</th>
                <th class="th-center">🔵 Rare</th>
                <th class="th-center">🟣 Epic</th>
                <th class="th-center">🟡 Legendary</th>
              </tr>
            </thead>
            <tbody>
              <tr class="row-blue">
                <td class="td-bold">🏪 Mercado</td>
    `;
    
    analyses.forEach(a => {
      html += `<td style="padding: 12px; text-align: center; font-weight: bold;">${a.marketPrice.toFixed(4)} RLT</td>`;
    });
    
    html += `
              </tr>
              <tr>
                <td class="td-bold">💸 Custo</td>
    `;
    
    analyses.forEach(a => {
      html += `<td style="padding: 12px; text-align: center;">${a.productionCost.toFixed(4)} RLT</td>`;
    });
    
    html += `
              </tr>
              <tr class="row-orange">
                <td class="td-bold">💰 Venda Min</td>
    `;
    
    analyses.forEach(a => {
      html += `<td style="padding: 12px; text-align: center; font-weight: bold; color: #FF9800;">${a.minSellPrice.toFixed(4)} RLT</td>`;
    });
    
    html += `
              </tr>
              <tr>
                <td class="td-bold">📊 Lucro/Prejuízo</td>
    `;
    
    analyses.forEach(a => {
      const color = a.profit >= 0 ? '#4CAF50' : '#dc3545';
      html += `<td style="padding: 12px; text-align: center; font-weight: bold; color: ${color};">
        ${a.profit >= 0 ? '+' : ''}${a.profit.toFixed(4)} RLT
        <br><span style="font-size: 11px;">(${a.profit >= 0 ? '+' : ''}${a.profitPercent.toFixed(1)}%)</span>
      </td>`;
    });
    
    html += `
              </tr>
              <tr class="row-gray">
                <td class="td-bold">✅ Vale Vender?</td>
    `;
    
    analyses.forEach(a => {
      const cellClass = a.shouldSell ? 'cell-green' : 'cell-red';
      const color = a.shouldSell ? '#4CAF50' : '#dc3545';
      const text = a.shouldSell ? '✅ SIM' : '❌ NÃO';
      html += `<td class="${cellClass}" style="padding: 12px; text-align: center;">
        <strong style="color: ${color}; font-size: 14px;">${text}</strong>
      </td>`;
    });
    
    html += `
              </tr>
            </tbody>
          </table>
        </div>

        <div class="white-box">
          <h4>📋 Como Ler Esta Tabela:</h4>
          <ul class="list-13">
            <li><strong>🏪 Mercado:</strong> Preço atual mais baixo no marketplace</li>
            <li><strong>💸 Custo:</strong> Quanto custa fazer merge (só taxas, sem comprar peças)</li>
            <li><strong>💰 Venda Min:</strong> Preço mínimo para vender (Custo + 5% taxa marketplace)</li>
            <li><strong>📊 Lucro/Prejuízo:</strong> Diferença entre preço do mercado e venda mínima</li>
            <li><strong>✅ Vale Vender?:</strong> Se o preço do mercado está acima da venda mínima</li>
          </ul>
        </div>

        <div class="rst-box-blue">
          <h4>💡 Dicas Importantes</h4>
          <p class="text-13">
            🔴 <strong>Se "Vale Vender?" = NÃO:</strong> Aguarde o preço subir ou use as peças para você mesmo<br>
            🟢 <strong>Se "Vale Vender?" = SIM:</strong> Você terá lucro vendendo no preço atual<br>
            💰 <strong>Lucro positivo verde:</strong> Quanto você ganha vendendo agora<br>
            📉 <strong>Prejuízo negativo vermelho:</strong> Quanto você perde vendendo agora<br>
            🔄 <strong>Atualize preços regularmente</strong> no "Merge vs Market" para manter a análise precisa
          </p>
        </div>
      </div>
    `;
    
    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  calcularCustoProducao(targetTier, targetQty) {
    const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const targetIndex = tiers.indexOf(targetTier);
    
    let currentQty = targetQty;
    let totalCost = 0;
    
    for (let i = targetIndex - 1; i >= 0; i--) {
      const tierFrom = tiers[i];
      const mergeInfo = this.mergeCosts[tierFrom];
      const cost = currentQty * mergeInfo.cost;
      totalCost += cost;
      currentQty = currentQty * mergeInfo.need;
    }
    
    return totalCost;
  },

  carregarPrecosSalvos() {
    try {
      const saved = localStorage.getItem('rollercoin_market_prices');
      if (saved) {
        this.marketPrices = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Erro ao carregar preços:', e);
    }
  }
};

window.UI_RSTSellAnalyzer = UI_RSTSellAnalyzer;
console.log('✅ UI_RSTSellAnalyzer loaded');