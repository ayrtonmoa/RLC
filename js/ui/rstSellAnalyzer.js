// js/ui/rstSellAnalyzer.js - RST Calculator & Sell Analyzer

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
    boxPrice: 40,        // 40 RST por caixa
    partsPerBox: 175,    // 175 peças Common por caixa
    marketFee: 0.05      // 5% taxa do marketplace
  },

  // Preços de mercado (compartilhados com mergeVsMarket)
  marketPrices: {
    common: { fan: 0.0018, wire: 0.0019, hashboard: 0.0019 },
    uncommon: { fan: 0.0987, wire: 0.0945, hashboard: 0.0945 },
    rare: { fan: 2.25, wire: 2.11, hashboard: 2.14 },
    epic: { fan: 22.78, wire: 23.62, hashboard: 23.10 },
    legendary: { fan: 83.90, wire: 89.00, hashboard: 85.00 }
  },

  mostrar() {
    // Carregar preços salvos
    this.carregarPrecosSalvos();

    const div = document.getElementById('rstsellanalyzer');
    
    // Verificar se preços foram atualizados
    const lastUpdate = localStorage.getItem('rollercoin_prices_update');
    const hasUpdatedPrices = lastUpdate !== null;
    const updateDate = hasUpdatedPrices ? new Date(lastUpdate).toLocaleString('pt-BR') : 'Nunca';
    
    div.innerHTML = `
      <h2>🎁 RST & Sell Analyzer</h2>
      
      ${!hasUpdatedPrices ? `
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336; margin-bottom: 20px;">
          <h4>⚠️ Preços Não Atualizados</h4>
          <p style="font-size: 13px; line-height: 1.6;">
            Para usar esta ferramenta, você precisa atualizar os preços do marketplace primeiro!<br>
            📍 Vá em <strong>💰 Merge vs Market</strong> e cole os preços da página.
          </p>
          <button onclick="UI_Tabs.switchTo('mergevsmarket')" style="padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            ➡️ Ir para Merge vs Market
          </button>
        </div>
      ` : `
        <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
          <h4>✅ Preços Atualizados</h4>
          <p style="font-size: 12px; color: #666;">
            Última atualização: <strong>${updateDate}</strong><br>
            💡 Para atualizar novamente, vá em <strong>💰 Merge vs Market</strong>
          </p>
        </div>
      `}
      
<div class="summary-item" style="background: #f3e5f5; border-left: 4px solid #9C27B0; margin-bottom: 20px;">
  <h4>💡 Créditos e Colaboradores</h4>
  <p style="font-size: 13px; line-height: 1.6;">
    Agradecimentos especiais a: <strong>BBJ Anderson</strong>, <strong>Edu Godinho</strong>, <strong>SilverGuns</strong> e <strong>Yeso</strong>.
  </p>
</div>

      <!-- SEÇÃO 1: RST CALCULATOR -->
      <h3>🎁 RST Calculator</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
        <div class="summary-item">
          <h4>💎 Seus RST</h4>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Quantidade de RST:</strong></label>
            <input type="number" id="rstAmount" placeholder="Ex: 1500" min="1" style="width: 100%; padding: 10px;">
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Preço da Caixa (RST):</strong></label>
            <input type="number" id="boxPrice" value="40" min="1" style="width: 100%; padding: 10px;">
            <small style="color: #666;">Padrão: 40 RST/caixa</small>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Peças por Caixa (mínimo):</strong></label>
            <input type="number" id="partsPerBox" value="175" min="1" style="width: 100%; padding: 10px;">
            <small style="color: #666;">Padrão: 175 peças Common/caixa</small>
          </div>

          <button onclick="UI_RSTSellAnalyzer.calcularRST()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold; background: #9C27B0; color: white;">
            🎁 Calcular RST
          </button>
        </div>

        <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800;">
          <h4>📋 Como Funciona</h4>
          <p style="font-size: 13px; line-height: 1.8;">
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
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Visão Geral por Tipo de Peça </h4>
        <p style="font-size: 13px; line-height: 1.6;">
          Veja de uma vez todos os tiers e descubra quais vale a pena vender!<br>
          Sistema mostra: <strong>Mercado | Custo | Venda Mínima | Vale Vender?</strong>
        </p>
      </div>

      <div class="summary-item">
        <h4>📦 Escolha o Tipo de Peça</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0;">
          <button onclick="UI_RSTSellAnalyzer.analisarTipoPeca('fan')" style="padding: 20px; font-size: 16px; font-weight: bold; background: #2196F3; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🌀 Fan
          </button>
          <button onclick="UI_RSTSellAnalyzer.analisarTipoPeca('wire')" style="padding: 20px; font-size: 16px; font-weight: bold; background: #FF9800; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🔌 Wire
          </button>
          <button onclick="UI_RSTSellAnalyzer.analisarTipoPeca('hashboard')" style="padding: 20px; font-size: 16px; font-weight: bold; background: #9C27B0; color: white; border: none; border-radius: 8px; cursor: pointer;">
            💾 Hashboard
          </button>
        </div>
        <p style="font-size: 12px; color: #666; text-align: center;">
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
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
          <h4>⚠️ Erro</h4>
          <p>Por favor, preencha todos os campos com valores válidos!</p>
        </div>
      `;
      return;
    }

    // Calcular
    const numBoxes = Math.floor(rstAmount / boxPrice);
    const totalParts = numBoxes * partsPerBox;
    const rstLeftover = rstAmount % boxPrice;
    
    // Calcular por cada tipo de peça
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
      <div class="summary-item" style="background: #f3e5f5; border-left: 4px solid #9C27B0;">
        <h3>🎁 Resultado da Conversão RST</h3>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #9C27B0;">💎 Seus RST</h4>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${data.rstAmount}</p>
            <p style="font-size: 13px; color: #666;">RST disponíveis</p>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #FF9800;">🎁 Caixas</h4>
            <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${data.numBoxes}</p>
            <p style="font-size: 13px; color: #666;">caixas de ${data.boxPrice} RST</p>
            ${data.rstLeftover > 0 ? `<p style="font-size: 11px; color: #999; margin-top: 5px;">Sobra: ${data.rstLeftover} RST</p>` : ''}
          </div>
        </div>

        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #ddd;">

        <h4 style="margin: 20px 0 10px 0;">📦 Peças Obtidas:</h4>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="font-size: 16px; margin: 5px 0;"><strong>Total de Peças Common:</strong></p>
              <p style="font-size: 13px; color: #666; margin: 5px 0;">${data.numBoxes} caixas × ${data.partsPerBox} peças/caixa</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 32px; font-weight: bold; color: #4CAF50; margin: 0;">⚪ ${data.totalParts}</p>
            </div>
          </div>
        </div>

        <h4 style="margin: 20px 0 10px 0;">💰 Valor por Tipo de Peça:</h4>
    `;
    
    data.results.forEach(result => {
      html += `
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 10px 0;">${partEmojis[result.partType]} ${partNames[result.partType]}</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 13px;">
            <div>
              <span style="color: #666;">Valor bruto:</span><br>
              <strong>${result.grossValue.toFixed(4)} RLT</strong>
            </div>
            <div>
              <span style="color: #dc3545;">Taxa (5%):</span><br>
              <strong>-${result.marketFee.toFixed(4)} RLT</strong>
            </div>
            <div>
              <span style="color: #4CAF50;">Valor líquido:</span><br>
              <strong style="font-size: 16px;">${result.netValue.toFixed(4)} RLT</strong>
            </div>
          </div>
        </div>
      `;
    });
    
    const avgNetValue = data.results.reduce((sum, r) => sum + r.netValue, 0) / data.results.length;
    
    html += `
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0;">📊 Resumo Final</h3>
          <p style="font-size: 16px; margin: 10px 0;">
            ${data.rstAmount} RST → ${data.numBoxes} caixas → ${data.totalParts} peças Common
          </p>
          <p style="font-size: 28px; font-weight: bold; margin: 10px 0;">${avgNetValue.toFixed(4)} RLT</p>
          <p style="font-size: 13px; margin: 5px 0; opacity: 0.9;">
            Valor médio líquido (após taxa de 5%)
          </p>
        </div>
      </div>

      <div class="summary-item" style="background: #fff3cd; border-left: 4px solid #ffc107; margin-top: 20px;">
        <h4>⚠️ Importante</h4>
        <p style="font-size: 13px; line-height: 1.6;">
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
    const tierEmojis = { uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' };
    
    const resultDiv = document.getElementById('resultadoVenda');
    
    // Calcular para cada tier
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
    
    // Gerar HTML da tabela
    let html = `
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-top: 30px;">
        <h3>${partEmojis[partType]} Análise Completa: ${partNames[partType]}</h3>
        
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead style="background: #f8f9fa;">
              <tr>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Tier</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">🟢 Uncommon</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">🔵 Rare</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">🟣 Epic</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #ddd;">🟡 Legendary</th>
              </tr>
            </thead>
            <tbody>
              <!-- Mercado -->
              <tr style="background: #e3f2fd;">
                <td style="padding: 12px; font-weight: bold;">🏪 Mercado</td>
    `;
    
    analyses.forEach(a => {
      html += `<td style="padding: 12px; text-align: center; font-weight: bold;">${a.marketPrice.toFixed(4)} RLT</td>`;
    });
    
    html += `
              </tr>
              <!-- Custo de Produção -->
              <tr>
                <td style="padding: 12px; font-weight: bold;">💸 Custo</td>
    `;
    
    analyses.forEach(a => {
      html += `<td style="padding: 12px; text-align: center;">${a.productionCost.toFixed(4)} RLT</td>`;
    });
    
    html += `
              </tr>
              <!-- Preço Mínimo Venda -->
              <tr style="background: #fff3e0;">
                <td style="padding: 12px; font-weight: bold;">💰 Venda Min</td>
    `;
    
    analyses.forEach(a => {
      html += `<td style="padding: 12px; text-align: center; font-weight: bold; color: #FF9800;">${a.minSellPrice.toFixed(4)} RLT</td>`;
    });
    
    html += `
              </tr>
              <!-- Lucro/Prejuízo -->
              <tr>
                <td style="padding: 12px; font-weight: bold;">📊 Lucro/Prejuízo</td>
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
              <!-- Vale Vender? -->
              <tr style="background: #f8f9fa;">
                <td style="padding: 12px; font-weight: bold;">✅ Vale Vender?</td>
    `;
    
    analyses.forEach(a => {
      const bgColor = a.shouldSell ? '#e8f5e8' : '#ffebee';
      const color = a.shouldSell ? '#4CAF50' : '#dc3545';
      const text = a.shouldSell ? '✅ SIM' : '❌ NÃO';
      html += `<td style="padding: 12px; text-align: center; background: ${bgColor};">
        <strong style="color: ${color}; font-size: 14px;">${text}</strong>
      </td>`;
    });
    
    html += `
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Resumo -->
        <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h4>📋 Como Ler Esta Tabela:</h4>
          <ul style="font-size: 13px; line-height: 1.8; margin: 10px 0;">
            <li><strong>🏪 Mercado:</strong> Preço atual mais baixo no marketplace</li>
            <li><strong>💸 Custo:</strong> Quanto custa fazer merge (só taxas, sem comprar peças)</li>
            <li><strong>💰 Venda Min:</strong> Preço mínimo para vender (Custo + 5% taxa marketplace)</li>
            <li><strong>📊 Lucro/Prejuízo:</strong> Diferença entre preço do mercado e venda mínima</li>
            <li><strong>✅ Vale Vender?:</strong> Se o preço do mercado está acima da venda mínima</li>
          </ul>
        </div>

        <!-- Dicas -->
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #2196F3;">
          <h4>💡 Dicas Importantes</h4>
          <p style="font-size: 13px; line-height: 1.6; margin: 5px 0;">
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
    
    // Calcular de trás pra frente
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