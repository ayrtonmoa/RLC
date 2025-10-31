// js/ui/mergeCalculator.js - Calculadora de Merge (FASE 1)

const UI_MergeCalculator = {
  // Taxas oficiais do RollerCoin
  mergeCosts: {
    common: { need: 50, cost: 0.005 },      // 50 Common → 1 Uncommon = 0.005 RLT
    uncommon: { need: 20, cost: 0.105 },    // 20 Uncommon → 1 Rare = 0.105 RLT
    rare: { need: 10, cost: 1.1025 },       // 10 Rare → 1 Epic = 1.1025 RLT
    epic: { need: 5, cost: 5.7881 }         // 5 Epic → 1 Legendary = 5.7881 RLT
  },

  mostrar() {
    const div = document.getElementById('mergecalculator');
    div.innerHTML = `
      <h2>🔧 Merge Calculator</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Como Usar</h4>
        <p>Calcule quanto custa fazer merges das suas peças. Compare: <strong>Fazer merge vs Comprar no market!</strong></p>
        <ul style="font-size: 13px; line-height: 1.6;">
          <li>✅ <strong>Merge sempre compensa mais</strong> que comprar pronto</li>
          <li>💰 Você tem <strong>controle total</strong> sobre seus gastos</li>
          <li>📊 Veja toda a <strong>cadeia de merges</strong> possível</li>
        </ul>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="summary-item">
          <h4>📥 Suas Peças</h4>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Tipo de Peça:</strong></label>
            <select id="partType" style="width: 100%; padding: 10px;">
              <option value="fan">🌀 Fan</option>
              <option value="wire">🔌 Wire</option>
              <option value="hashboard">💾 Hashboard</option>
            </select>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Tier Inicial:</strong></label>
            <select id="startTier" style="width: 100%; padding: 10px;">
              <option value="common">⚪ Common</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
            </select>
          </div>

          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Quantidade que você tem:</strong></label>
            <input type="number" id="partQuantity" placeholder="Ex: 1000" min="1" style="width: 100%; padding: 10px;">
          </div>

          <button onclick="UI_MergeCalculator.calcular()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold;">
            🎯 Calcular Merges
          </button>
        </div>

        <div class="summary-item">
          <h4>📊 Taxas de Merge Oficiais</h4>
          <table style="width: 100%; font-size: 12px;">
            <tr style="background: #f8f9fa;">
              <th style="padding: 8px;">Merge</th>
              <th style="padding: 8px;">Precisa</th>
              <th style="padding: 8px;">Taxa</th>
            </tr>
            <tr>
              <td style="padding: 8px;">⚪ → 🟢</td>
              <td style="padding: 8px;"><strong>50</strong> Common</td>
              <td style="padding: 8px;">0.005 RLT</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 8px;">🟢 → 🔵</td>
              <td style="padding: 8px;"><strong>20</strong> Uncommon</td>
              <td style="padding: 8px;">0.105 RLT</td>
            </tr>
            <tr>
              <td style="padding: 8px;">🔵 → 🟣</td>
              <td style="padding: 8px;"><strong>10</strong> Rare</td>
              <td style="padding: 8px;">1.1025 RLT</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 8px;">🟣 → 🟡</td>
              <td style="padding: 8px;"><strong>5</strong> Epic</td>
              <td style="padding: 8px;">5.7881 RLT</td>
            </tr>
          </table>
          <p style="font-size: 11px; color: #666; margin-top: 10px;">
            ℹ️ Taxas são iguais para Fan, Wire e Hashboard
          </p>
        </div>
      </div>

      <div id="resultadoMergeCalc"></div>
    `;
  },

  calcular() {
    const partType = document.getElementById('partType').value;
    const startTier = document.getElementById('startTier').value;
    const quantity = parseInt(document.getElementById('partQuantity').value);
    
    const resultDiv = document.getElementById('resultadoMergeCalc');
    
    // Validações
    if (!quantity || quantity <= 0) {
      resultDiv.innerHTML = `
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
          <h4>⚠️ Erro</h4>
          <p>Por favor, digite uma quantidade válida!</p>
        </div>
      `;
      return;
    }

    // Calcular cadeia de merges
    const mergeChain = this.calcularCadeia(startTier, quantity);
    
    if (mergeChain.length === 0) {
      resultDiv.innerHTML = `
        <div class="summary-item" style="background: #fff3cd; border-left: 4px solid #ffc107;">
          <h4>⚠️ Quantidade Insuficiente</h4>
          <p>Você precisa de pelo menos <strong>${this.mergeCosts[startTier].need} ${this.getTierName(startTier)}</strong> para fazer 1 merge.</p>
        </div>
      `;
      return;
    }

    // Renderizar resultado
    this.mostrarResultado(mergeChain, partType, startTier, quantity);
  },

  calcularCadeia(startTier, quantity) {
    const chain = [];
    const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const startIndex = tiers.indexOf(startTier);
    
    let currentQuantity = quantity;
    
    // Calcular cada merge possível
    for (let i = startIndex; i < tiers.length - 1; i++) {
      const currentTier = tiers[i];
      const nextTier = tiers[i + 1];
      const mergeInfo = this.mergeCosts[currentTier];
      
      // Quantos merges conseguimos fazer?
      const possibleMerges = Math.floor(currentQuantity / mergeInfo.need);
      
      if (possibleMerges === 0) break;
      
      // Calcular custo
      const totalCost = possibleMerges * mergeInfo.cost;
      const leftover = currentQuantity % mergeInfo.need;
      
      chain.push({
        from: currentTier,
        to: nextTier,
        inputQty: currentQuantity,
        outputQty: possibleMerges,
        leftover: leftover,
        costPerMerge: mergeInfo.cost,
        totalCost: totalCost,
        needed: mergeInfo.need
      });
      
      // Próximo tier começa com a quantidade produzida
      currentQuantity = possibleMerges;
    }
    
    return chain;
  },

  mostrarResultado(chain, partType, startTier, quantity) {
    const resultDiv = document.getElementById('resultadoMergeCalc');
    
    // Calcular totais
    const totalCost = chain.reduce((sum, step) => sum + step.totalCost, 0);
    const finalTier = chain[chain.length - 1].to;
    const finalQty = chain[chain.length - 1].outputQty;
    
    // Emojis
    const partEmojis = { fan: '🌀', wire: '🔌', hashboard: '💾' };
    const tierEmojis = { 
      common: '⚪', 
      uncommon: '🟢', 
      rare: '🔵', 
      epic: '🟣', 
      legendary: '🟡' 
    };
    
    let html = `
      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3;">
        <h3>🎯 Resultado da Cadeia de Merges</h3>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin: 0 0 10px 0;">${partEmojis[partType]} ${this.capitalize(partType)}</h4>
          <p style="font-size: 14px; margin: 5px 0;">
            <strong>Início:</strong> ${quantity} ${tierEmojis[startTier]} ${this.getTierName(startTier)}
          </p>
          <p style="font-size: 14px; margin: 5px 0;">
            <strong>Final:</strong> ${finalQty} ${tierEmojis[finalTier]} ${this.getTierName(finalTier)}
          </p>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="margin: 0 0 15px 0;">📋 Passos do Merge:</h4>
    `;
    
    // Cada passo
    chain.forEach((step, index) => {
      const stepNum = index + 1;
      const arrow = '→';
      
      html += `
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4CAF50;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 2fr; gap: 10px; align-items: center;">
            <div>
              <strong style="font-size: 16px;">${tierEmojis[step.from]} ${step.inputQty} ${this.getTierName(step.from)}</strong>
              ${step.leftover > 0 ? `<br><small style="color: #999;">Sobra: ${step.leftover}</small>` : ''}
            </div>
            <div style="text-align: center;">
              <span style="font-size: 20px; color: #2196F3;">${arrow}</span>
            </div>
            <div>
              <strong style="font-size: 16px;">${tierEmojis[step.to]} ${step.outputQty} ${this.getTierName(step.to)}</strong>
            </div>
          </div>
          <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; font-size: 13px;">
            <span>📦 Precisa: <strong>${step.needed} por merge</strong></span>
            <span>💰 Custo: <strong>${step.totalCost.toFixed(4)} RLT</strong></span>
            <span>🔢 Merges: <strong>${step.outputQty}x</strong></span>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>

        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0;">💰 CUSTO TOTAL</h3>
          <p style="font-size: 32px; font-weight: bold; margin: 10px 0;">${totalCost.toFixed(4)} RLT</p>
          <p style="font-size: 14px; margin: 5px 0; opacity: 0.9;">
            Para transformar ${quantity} ${tierEmojis[startTier]} ${this.getTierName(startTier)} em ${finalQty} ${tierEmojis[finalTier]} ${this.getTierName(finalTier)}
          </p>
        </div>
      </div>

      <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800; margin-top: 20px;">
        <h4>💡 Dica do SilverGuns</h4>
        <p style="font-size: 13px; line-height: 1.6;">
          ✅ <strong>Merge sempre compensa!</strong> Fazer merge de peças comuns é muito mais barato que comprar direto no marketplace.<br>
          📊 Você tem <strong>controle total</strong> dos gastos: pode fazer 20, 30 ou 50 peças verdes e usar as comuns para outros merges.<br>
          💰 Quanto mais alta a qualidade da peça, <strong>mais cara</strong> ela é, mas o merge no inventário <strong>sempre compensa mais</strong>!
        </p>
      </div>
    `;
    
    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  getTierName(tier) {
    const names = {
      common: 'Common',
      uncommon: 'Uncommon',
      rare: 'Rare',
      epic: 'Epic',
      legendary: 'Legendary'
    };
    return names[tier] || tier;
  },

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
};

window.UI_MergeCalculator = UI_MergeCalculator;
console.log('✅ UI_MergeCalculator loaded');