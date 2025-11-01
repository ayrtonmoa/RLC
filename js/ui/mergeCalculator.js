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
      <h2>🔧 Merge Calculator</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Como Usar</h4>
        <p style="font-size: 13px; line-height: 1.6;">
          Calcule quanto custa fazer merges das suas peças! Pode calcular <strong>1, 2 ou 3 peças ao mesmo tempo</strong>.<br>
          ✅ Deixe em branco as que não quer calcular<br>
          💰 Sistema mostra custo individual + total
        </p>
      </div>

      <!-- SEÇÃO 1: CALCULADORA NORMAL -->
      <h3>📈 Calculadora Normal (O que consigo fazer?)</h3>
      <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800; margin-bottom: 20px;">
        <h4>💡 Sugestão do SilverGuns</h4>
        <p style="font-size: 13px;">Você tem peças e quer saber <strong>até onde consegue chegar</strong>? Digite quantas peças você tem e veja!</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
        <div class="summary-item">
          <h4>📥 Suas Peças</h4>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <!-- Fan -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>🌀 Fan</strong></label>
              <select id="fanStartTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
                <option value="">-- Nenhum --</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
              </select>
              <input type="number" id="fanQuantity" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
            </div>

            <!-- Wire -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>🔌 Wire</strong></label>
              <select id="wireStartTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
                <option value="">-- Nenhum --</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
              </select>
              <input type="number" id="wireQuantity" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
            </div>

            <!-- Hashboard -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>💾 Hashboard</strong></label>
              <select id="hashStartTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
                <option value="">-- Nenhum --</option>
                <option value="common">⚪ Common</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
              </select>
              <input type="number" id="hashQuantity" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
            </div>
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

      <hr style="margin: 40px 0; border: 0; border-top: 2px solid #ddd;">

      <!-- SEÇÃO 2: CALCULADORA REVERSA -->
      <h3>📉 Calculadora Reversa (O que preciso ter?)</h3>
      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3; margin-bottom: 20px;">
        <h4>💡 Sugestão do XnegX</h4>
        <p style="font-size: 13px;">Quer fazer um merge específico? Descubra <strong>quantas peças você precisa</strong> e o <strong>custo total</strong>!</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="summary-item">
          <h4>🎯 Seu Objetivo</h4>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <!-- Fan -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>🌀 Fan</strong></label>
              <select id="fanTargetTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
                <option value="">-- Nenhum --</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
              <input type="number" id="fanTargetQty" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
            </div>

            <!-- Wire -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>🔌 Wire</strong></label>
              <select id="wireTargetTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
                <option value="">-- Nenhum --</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
              <input type="number" id="wireTargetQty" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
            </div>

            <!-- Hashboard -->
            <div>
              <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>💾 Hashboard</strong></label>
              <select id="hashTargetTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
                <option value="">-- Nenhum --</option>
                <option value="uncommon">🟢 Uncommon</option>
                <option value="rare">🔵 Rare</option>
                <option value="epic">🟣 Epic</option>
                <option value="legendary">🟡 Legendary</option>
              </select>
              <input type="number" id="hashTargetQty" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 5px;"><strong>Partir de qual tier?</strong></label>
            <select id="reverseStartTier" style="width: 100%; padding: 10px;">
              <option value="common">⚪ Common</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
            </select>
          </div>

          <button onclick="UI_MergeCalculator.calcularReverso()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold; background: #2196F3;">
            🔍 Calcular Requisitos
          </button>
        </div>

        <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800;">
          <h4>📋 Exemplo de Uso</h4>
          <p style="font-size: 13px; line-height: 1.8;">
            <strong>Objetivo:</strong><br>
            • 2x Legendary Fan<br>
            • 1x Epic Wire<br>
            • 3x Rare Hashboard
          </p>
          <p style="font-size: 13px; margin-top: 10px;">
            <strong>Sistema mostra:</strong>
          </p>
          <ul style="font-size: 12px; margin: 10px 0; line-height: 1.8;">
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
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
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
      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3;">
        <h3>🎯 Resultado da Cadeia de Merges</h3>
    `;

    // Cada peça
    results.forEach(result => {
      html += `
        <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <h4 style="margin: 0;">${result.emoji} ${result.name}</h4>
              <p style="font-size: 14px; margin: 5px 0;">
                <strong>Início:</strong> ${result.quantity} ${tierEmojis[result.startTier]} ${this.getTierName(result.startTier)}
              </p>
              <p style="font-size: 14px; margin: 5px 0;">
                <strong>Final:</strong> ${result.finalQty} ${tierEmojis[result.finalTier]} ${this.getTierName(result.finalTier)}
              </p>
            </div>
            <div style="text-align: right;">
              <span style="background: #FF9800; color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ${result.chainCost.toFixed(4)} RLT
              </span>
            </div>
          </div>

          <details style="margin-top: 15px;">
            <summary style="cursor: pointer; font-size: 13px; color: #666; padding: 5px;">
              📋 Ver passos detalhados
            </summary>
            <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
    `;

      result.chain.forEach((step, index) => {
        html += `
          <div style="padding: 10px 0; ${index < result.chain.length - 1 ? 'border-bottom: 1px dashed #ddd;' : ''}">
            <div style="display: grid; grid-template-columns: 2fr 1fr 2fr; gap: 10px; align-items: center; margin-bottom: 5px;">
              <div>
                <strong>${tierEmojis[step.from]} ${step.inputQty} ${this.getTierName(step.from)}</strong>
                ${step.leftover > 0 ? `<br><small style="color: #999;">Sobra: ${step.leftover}</small>` : ''}
              </div>
              <div style="text-align: center; color: #2196F3; font-size: 18px;">→</div>
              <div>
                <strong>${tierEmojis[step.to]} ${step.outputQty} ${this.getTierName(step.to)}</strong>
              </div>
            </div>
            <div style="font-size: 12px; color: #666; display: flex; justify-content: space-between;">
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
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0;">💰 CUSTO TOTAL</h3>
          <p style="font-size: 36px; font-weight: bold; margin: 10px 0;">${totalCost.toFixed(4)} RLT</p>
          <p style="font-size: 14px; margin: 5px 0; opacity: 0.9;">
            Para fazer ${results.length} ${results.length === 1 ? 'peça' : 'peças'}
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
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336;">
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
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50;">
        <h3>🎯 Requisitos para Seu Objetivo</h3>
    `;

    // Cada peça
    results.forEach(result => {
      html += `
        <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2196F3;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div>
              <h4 style="margin: 0;">${result.emoji} ${result.quantity}x ${tierEmojis[result.targetTier]} ${this.getTierName(result.targetTier)} ${result.name}</h4>
            </div>
            <div style="text-align: right;">
              <span style="background: #FF9800; color: white; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ${result.route.totalCost.toFixed(4)} RLT
              </span>
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <p style="margin: 0; font-size: 16px;">
              <strong>📦 Você precisa de:</strong> 
              <span style="color: #2196F3; font-weight: bold; font-size: 18px;">
                ${result.route.startQuantity} ${tierEmojis[startTier]} ${this.getTierName(startTier)} ${result.name}
              </span>
            </p>
          </div>

          <details style="margin-top: 15px;">
            <summary style="cursor: pointer; font-size: 13px; color: #666; padding: 5px;">
              📋 Ver passos detalhados
            </summary>
            <div style="margin-top: 10px; padding: 15px; background: #f8f9fa; border-radius: 5px; font-size: 13px;">
    `;

      result.route.steps.forEach((step, index) => {
        html += `
          <div style="padding: 8px 0; ${index < result.route.steps.length - 1 ? 'border-bottom: 1px dashed #ddd;' : ''}">
            <div style="display: flex; align-items: center;">
              <div style="flex: 1;">
                ${tierEmojis[step.from]} ${step.neededQty} ${this.getTierName(step.from)}
              </div>
              <div style="padding: 0 15px; color: #2196F3; font-size: 18px;">→</div>
              <div style="flex: 1;">
                ${tierEmojis[step.to]} ${step.outputQty} ${this.getTierName(step.to)}
              </div>
              <div style="text-align: right; color: #666; font-size: 12px;">
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
        <div style="background: #2196F3; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0;">💰 CUSTO TOTAL</h3>
          <p style="font-size: 36px; font-weight: bold; margin: 10px 0;">${totalCost.toFixed(4)} RLT</p>
          <p style="font-size: 14px; margin: 5px 0; opacity: 0.9;">
            Para fazer ${results.length} ${results.length === 1 ? 'peça' : 'peças'} partindo de ${tierEmojis[startTier]} ${this.getTierName(startTier)}
          </p>
        </div>
      </div>

      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3; margin-top: 20px;">
        <h4>💡 Dica do XnegX</h4>
        <p style="font-size: 13px; line-height: 1.6;">
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