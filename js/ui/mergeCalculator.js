// js/ui/mergeCalculator.js - Calculadora de Merge (3 peças simultâneas)

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
      <h2>🔧 Parts Calculator</h2>
      
      <div class="info-box-green">
        <h4>💡 Como Usar</h4>
        <p>
          Calcule quanto custa fazer merges das suas peças! Pode calcular <strong>1, 2 ou 3 peças ao mesmo tempo</strong>.<br>
          ✅ Deixe em branco as que não quer calcular<br>
          💰 Sistema mostra custo individual + total
        </p>
      </div>

      <!-- SEÇÃO 1: CALCULADORA NORMAL -->
      <h3>📈 Calculadora Normal (O que consigo fazer?)</h3>
      <div class="info-box-orange">
        <h4>💡 Sugestão do SilverGuns</h4>
        <p>Você tem peças e quer saber <strong>até onde consegue chegar</strong>? Digite quantas peças você tem e veja!</p>
      </div>

      <div class="merge-grid-2">
        <div class="summary-item">
          <h4>📥 Suas Peças</h4>
          
          <div class="merge-grid-3">
            <!-- Fan -->
            <div>
              <label class="part-label">🌀 Fan</label>
              <select id="fanStartTier" class="part-select">
                <option value="">-- Nenhum --</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
              </select>
              <input type="number" id="fanQuantity" placeholder="Quantidade" min="0" class="part-input">
            </div>

            <!-- Wire -->
            <div>
              <label class="part-label">🔌 Wire</label>
              <select id="wireStartTier" class="part-select">
                <option value="">-- Nenhum --</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
              </select>
              <input type="number" id="wireQuantity" placeholder="Quantidade" min="0" class="part-input">
            </div>

            <!-- Hashboard -->
            <div>
              <label class="part-label">💾 Hashboard</label>
              <select id="hashStartTier" class="part-select">
                <option value="">-- Nenhum --</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
              </select>
              <input type="number" id="hashQuantity" placeholder="Quantidade" min="0" class="part-input">
            </div>
          </div>

          <button onclick="UI_MergeCalculator.calcular()" class="btn-calc-normal">
            🎯 Calcular Merges
          </button>
        </div>

        <div class="summary-item">
          <h4>📊 Taxas de Merge Oficiais</h4>
          <table class="merge-rates-table">
            <tr>
              <th>Merge</th>
              <th>Precisa</th>
              <th>Taxa</th>
            </tr>
            <tr>
              <td>⚪ → 🟢</td>
              <td><strong>50</strong> Common</td>
              <td>0.005 RLT</td>
            </tr>
            <tr>
              <td>🟢 → 🔵</td>
              <td><strong>20</strong> Uncommon</td>
              <td>0.105 RLT</td>
            </tr>
            <tr>
              <td>🔵 → 🟣</td>
              <td><strong>10</strong> Rare</td>
              <td>1.1025 RLT</td>
            </tr>
            <tr>
              <td>🟣 → 🟡</td>
              <td><strong>5</strong> Epic</td>
              <td>5.7881 RLT</td>
            </tr>
          </table>
          <p class="rates-note">
            ℹ️ Taxas são iguais para Fan, Wire e Hashboard
          </p>
        </div>
      </div>

      <div id="resultadoMergeCalc"></div>

      <hr class="merge-separator">

      <!-- SEÇÃO 2: CALCULADORA REVERSA -->
      <h3>📉 Calculadora Reversa (O que preciso ter?)</h3>
      <div class="info-box-blue">
        <h4>💡 Sugestão do XnegX</h4>
        <p>Quer fazer um merge específico? Descubra <strong>quantas peças você precisa</strong> e o <strong>custo total</strong>!</p>
      </div>

      <div class="merge-grid-2">
        <div class="summary-item">
          <h4>🎯 Seu Objetivo</h4>
          
          <div class="merge-grid-3">
            <!-- Fan -->
            <div>
              <label class="part-label">🌀 Fan</label>
              <select id="fanTargetTier" class="part-select">
                <option value="">-- Nenhum --</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
              <input type="number" id="fanTargetQty" placeholder="Quantidade" min="0" class="part-input">
            </div>

            <!-- Wire -->
            <div>
              <label class="part-label">🔌 Wire</label>
              <select id="wireTargetTier" class="part-select">
                <option value="">-- Nenhum --</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
              <input type="number" id="wireTargetQty" placeholder="Quantidade" min="0" class="part-input">
            </div>

            <!-- Hashboard -->
            <div>
              <label class="part-label">💾 Hashboard</label>
              <select id="hashTargetTier" class="part-select">
                <option value="">-- Nenhum --</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
              <input type="number" id="hashTargetQty" placeholder="Quantidade" min="0" class="part-input">
            </div>
          </div>

          <div class="reverse-start-tier">
            <label class="reverse-start-label">Partir de qual tier?</label>
            <select id="reverseStartTier" class="reverse-start-select">
              <option value="common">⚪ Common</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
            </select>
          </div>

          <button onclick="UI_MergeCalculator.calcularReverso()" class="btn-calc-reverse">
            🔍 Calcular Requisitos
          </button>
        </div>

        <div class="info-box-orange merge-example-box">
          <h4>📋 Exemplo de Uso</h4>
          <p>
            <strong>Objetivo:</strong><br>
            • 2x Legendary Fan<br>
            • 1x Epic Wire<br>
            • 3x Rare Hashboard
          </p>
          <p>
            <strong>Sistema mostra:</strong>
          </p>
          <ul>
            <li>Quantas peças de cada precisa</li>
            <li>Custo individual de cada merge</li>
            <li>💰 Custo total em RLT</li>
          </ul>
        </div>
      </div>

      <div id="resultadoReverso"></div>
    `;
  },

  // ========== CALCULADORA NORMAL ==========
  calcular() {
    // Coletar dados das peças
    const parts = [
      {
        type: 'fan',
        emoji: '🌀',
        name: 'Fan',
        startTier: document.getElementById('fanStartTier').value,
        quantity: parseInt(document.getElementById('fanQuantity').value) || 0
      },
      {
        type: 'wire',
        emoji: '🔌',
        name: 'Wire',
        startTier: document.getElementById('wireStartTier').value,
        quantity: parseInt(document.getElementById('wireQuantity').value) || 0
      },
      {
        type: 'hashboard',
        emoji: '💾',
        name: 'Hashboard',
        startTier: document.getElementById('hashStartTier').value,
        quantity: parseInt(document.getElementById('hashQuantity').value) || 0
      }
    ];

    // Filtrar apenas as peças selecionadas
    const selectedParts = parts.filter(p => p.startTier && p.quantity > 0);

    const resultDiv = document.getElementById('resultadoMergeCalc');

    // Validação
    if (selectedParts.length === 0) {
      resultDiv.innerHTML = `
        <div class="info-box-red">
          <h4>⚠️ Nenhuma Peça Selecionada</h4>
          <p>Por favor, selecione pelo menos uma peça, tier e quantidade!</p>
        </div>
      `;
      return;
    }

    // Calcular cada peça
    const results = [];
    let totalCost = 0;

    selectedParts.forEach(part => {
      const mergeChain = this.calcularCadeia(part.startTier, part.quantity);
      
      if (mergeChain.length > 0) {
        const chainCost = mergeChain.reduce((sum, step) => sum + step.totalCost, 0);
        results.push({
          ...part,
          chain: mergeChain,
          chainCost: chainCost,
          finalTier: mergeChain[mergeChain.length - 1].to,
          finalQty: mergeChain[mergeChain.length - 1].outputQty
        });
        totalCost += chainCost;
      }
    });

    // Renderizar resultado
    this.mostrarResultadoNormal(results, totalCost);
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
      
      const possibleMerges = Math.floor(currentQuantity / mergeInfo.need);
      
      if (possibleMerges === 0) break;
      
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
      
      currentQuantity = possibleMerges;
    }
    
    return chain;
  },

  mostrarResultadoNormal(results, totalCost) {
    const resultDiv = document.getElementById('resultadoMergeCalc');

    const tierEmojis = { 
      common: '⚪', 
      uncommon: '🟢', 
      rare: '🔵', 
      epic: '🟣', 
      legendary: '🟡' 
    };

    let html = `
      <div class="info-box-blue">
        <h3>🎯 Resultado da Cadeia de Merges</h3>
    `;

    // Cada peça
    results.forEach(result => {
      html += `
        <div class="merge-result-card">
          <div class="merge-result-header">
            <div>
              <h4 class="merge-result-title">${result.emoji} ${result.name}</h4>
              <p class="merge-result-info">
                <strong>Início:</strong> ${result.quantity} ${tierEmojis[result.startTier]} ${this.getTierName(result.startTier)}
              </p>
              <p class="merge-result-info">
                <strong>Final:</strong> ${result.finalQty} ${tierEmojis[result.finalTier]} ${this.getTierName(result.finalTier)}
              </p>
            </div>
            <div>
              <span class="merge-cost-badge">
                ${result.chainCost.toFixed(4)} RLT
              </span>
            </div>
          </div>

          <details class="merge-details">
            <summary>📋 Ver passos detalhados</summary>
            <div class="merge-steps-container">
      `;

      result.chain.forEach((step, index) => {
        html += `
          <div class="merge-step">
            <div class="merge-step-grid">
              <div>
                <strong>${tierEmojis[step.from]} ${step.inputQty} ${this.getTierName(step.from)}</strong>
                ${step.leftover > 0 ? `<br><small class="merge-leftover">Sobra: ${step.leftover}</small>` : ''}
              </div>
              <div class="merge-step-arrow">→</div>
              <div>
                <strong>${tierEmojis[step.to]} ${step.outputQty} ${this.getTierName(step.to)}</strong>
              </div>
            </div>
            <div class="merge-step-meta">
              <span>📦 ${step.needed} por merge</span>
              <span>🔢 ${step.outputQty} merges</span>
              <span>💰 ${step.totalCost.toFixed(4)} RLT</span>
            </div>
          </div>
        `;
      });

      html += `
            </div>
          </details>
        </div>
      `;
    });

    html += `
        <div class="merge-total-box">
          <h3>💰 CUSTO TOTAL</h3>
          <p class="merge-total-value">${totalCost.toFixed(4)} RLT</p>
          <p class="merge-total-subtitle">
            Para fazer ${results.length} ${results.length === 1 ? 'peça' : 'peças'}
          </p>
        </div>
      </div>

      <div class="info-box-orange">
        <h4>💡 Dica do SilverGuns</h4>
        <p>
          ✅ <strong>Merge sempre compensa!</strong> Fazer merge de peças comuns é muito mais barato que comprar direto no marketplace.<br>
          📊 Você tem <strong>controle total</strong> dos gastos: pode fazer 20, 30 ou 50 peças verdes e usar as comuns para outros merges.<br>
          💰 Quanto mais alta a qualidade da peça, <strong>mais cara</strong> ela é, mas o merge no inventário <strong>sempre compensa mais</strong>!
        </p>
      </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // ========== CALCULADORA REVERSA ==========
  calcularReverso() {
    const startTier = document.getElementById('reverseStartTier').value;

    // Coletar dados das peças
    const parts = [
      {
        type: 'fan',
        emoji: '🌀',
        name: 'Fan',
        targetTier: document.getElementById('fanTargetTier').value,
        quantity: parseInt(document.getElementById('fanTargetQty').value) || 0
      },
      {
        type: 'wire',
        emoji: '🔌',
        name: 'Wire',
        targetTier: document.getElementById('wireTargetTier').value,
        quantity: parseInt(document.getElementById('wireTargetQty').value) || 0
      },
      {
        type: 'hashboard',
        emoji: '💾',
        name: 'Hashboard',
        targetTier: document.getElementById('hashTargetTier').value,
        quantity: parseInt(document.getElementById('hashTargetQty').value) || 0
      }
    ];

    // Filtrar apenas as peças selecionadas
    const selectedParts = parts.filter(p => p.targetTier && p.quantity > 0);

    const resultDiv = document.getElementById('resultadoReverso');

    // Validação
    if (selectedParts.length === 0) {
      resultDiv.innerHTML = `
        <div class="info-box-red">
          <h4>⚠️ Nenhuma Peça Selecionada</h4>
          <p>Por favor, selecione pelo menos uma peça, tier e quantidade!</p>
        </div>
      `;
      return;
    }

    // Calcular cada peça
    const results = [];
    let totalCost = 0;

    selectedParts.forEach(part => {
      const route = this.calcularRota(startTier, part.targetTier, part.quantity);
      
      if (route) {
        results.push({
          ...part,
          route: route
        });
        totalCost += route.totalCost;
      }
    });

    // Renderizar resultado
    this.mostrarResultadoReverso(results, totalCost, startTier);
  },

  calcularRota(startTier, targetTier, targetQty) {
    const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const startIndex = tiers.indexOf(startTier);
    const targetIndex = tiers.indexOf(targetTier);

    if (startIndex === -1 || targetIndex === -1 || startIndex >= targetIndex) {
      return null;
    }

    // Calcular requisitos (de trás pra frente)
    let currentQty = targetQty;
    let totalCost = 0;
    const steps = [];

    for (let i = targetIndex - 1; i >= startIndex; i--) {
      const tierFrom = tiers[i];
      const tierTo = tiers[i + 1];
      const mergeInfo = this.mergeCosts[tierFrom];

      const neededQty = currentQty * mergeInfo.need;
      const cost = currentQty * mergeInfo.cost;

      steps.unshift({
        from: tierFrom,
        to: tierTo,
        neededQty: neededQty,
        outputQty: currentQty,
        cost: cost
      });

      totalCost += cost;
      currentQty = neededQty;
    }

    return {
      startQuantity: currentQty,
      totalCost: totalCost,
      steps: steps
    };
  },

  mostrarResultadoReverso(results, totalCost, startTier) {
    const resultDiv = document.getElementById('resultadoReverso');

    const tierEmojis = { 
      common: '⚪', 
      uncommon: '🟢', 
      rare: '🔵', 
      epic: '🟣', 
      legendary: '🟡' 
    };

    let html = `
      <div class="info-box-green">
        <h3>🎯 Requisitos para Seu Objetivo</h3>
    `;

    // Cada peça
    results.forEach(result => {
      html += `
        <div class="reverse-result-card">
          <div class="merge-result-header">
            <div>
              <h4 class="merge-result-title">${result.emoji} ${result.quantity}x ${tierEmojis[result.targetTier]} ${this.getTierName(result.targetTier)} ${result.name}</h4>
            </div>
            <div>
              <span class="merge-cost-badge">
                ${result.route.totalCost.toFixed(4)} RLT
              </span>
            </div>
          </div>

          <div class="reverse-requirement-box">
            <p class="reverse-requirement-text">
              <strong>📦 Você precisa de:</strong> 
              <span class="reverse-requirement-value">
                ${result.route.startQuantity} ${tierEmojis[startTier]} ${this.getTierName(startTier)} ${result.name}
              </span>
            </p>
          </div>

          <details class="merge-details">
            <summary>📋 Ver passos detalhados</summary>
            <div class="merge-steps-container">
      `;

      result.route.steps.forEach((step, index) => {
        html += `
          <div class="reverse-step">
            <div class="reverse-step-flex">
              <div class="reverse-step-from">
                ${tierEmojis[step.from]} ${step.neededQty} ${this.getTierName(step.from)}
              </div>
              <div class="reverse-step-arrow">→</div>
              <div class="reverse-step-to">
                ${tierEmojis[step.to]} ${step.outputQty} ${this.getTierName(step.to)}
              </div>
              <div class="reverse-step-cost">
                ${step.cost.toFixed(4)} RLT
              </div>
            </div>
          </div>
        `;
      });

      html += `
            </div>
          </details>
        </div>
      `;
    });

    html += `
        <div class="merge-total-box merge-total-box-reverse">
          <h3>💰 CUSTO TOTAL</h3>
          <p class="merge-total-value">${totalCost.toFixed(4)} RLT</p>
          <p class="merge-total-subtitle">
            Para fazer ${results.length} ${results.length === 1 ? 'peça' : 'peças'} partindo de ${tierEmojis[startTier]} ${this.getTierName(startTier)}
          </p>
        </div>
      </div>

      <div class="info-box-blue">
        <h4>💡 Dica do XnegX</h4>
        <p>
          🎯 Use a <strong>calculadora reversa</strong> para planejar seus merges com antecedência!<br>
          📊 Compare as <strong>diferentes rotas</strong> e escolha a que você tem mais peças.<br>
          💰 Sempre considere o <strong>custo vs disponibilidade</strong> das suas peças!
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