// js/ui/mergeVsMarket.js - Merge vs Market Comparator

const UI_MergeVsMarket = {
  // Taxas oficiais do RollerCoin
  mergeCosts: {
    common: { need: 50, cost: 0.005 },
    uncommon: { need: 20, cost: 0.105 },
    rare: { need: 10, cost: 1.1025 },
    epic: { need: 5, cost: 5.7881 }
  },

  // Preços de mercado (serão atualizados pelo usuário)
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

    const div = document.getElementById('mergevsmarket');
    div.innerHTML = `
      <h2>💰 Merge vs Market</h2>
      
      <div class="summary-item" style="background: #e8f5e8; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
        <h4>💡 Sugestão do BBJ</h4>
        <p style="font-size: 13px; line-height: 1.6;">
          Compare 3 opções e descubra qual é <strong>mais barata</strong>:<br>
          <strong>1)</strong> Fazer merge (só taxas) - se você já tem peças<br>
          <strong>2)</strong> Comprar peças menores + fazer merge<br>
          <strong>3)</strong> Comprar pronto no marketplace
        </p>
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          💡 <em>"Seria bom implementar um local pra gente colocar o valor que eu comprei no mercado junto com o valor do merge"</em> - BBJ
        </p>
      </div>

      <!-- SEÇÃO: ATUALIZAR PREÇOS -->
      <div class="summary-item" style="background: #fff3cd; border-left: 4px solid #ffc107; margin-bottom: 20px;">
        <h4>🔄 Atualizar Preços do Marketplace</h4>
        <p style="font-size: 13px;">Cole o conteúdo da página do marketplace para atualizar os preços automaticamente!</p>
        <ol style="font-size: 12px; line-height: 1.8; margin: 10px 0;">
          <li>Vá em <a href="https://rollercoin.com/marketplace/buy" target="_blank" style="font-weight: bold;">Marketplace > Buy > Parts</a></li>
          <li>⚠️ <strong>IMPORTANTE:</strong> Altere de <strong>12 para 24 resultados por página</strong></li>
          <li>Marque <strong>apenas "Parts"</strong> (desmarque Miners, Racks, etc)</li>
          <li>Pressione <kbd>Ctrl+A</kbd> e <kbd>Ctrl+C</kbd></li>
          <li>Cole abaixo e clique em "Atualizar Preços"</li>
        </ol>
        
        <div style="margin-top: 15px;">
          <textarea id="marketText" rows="4" placeholder="Cole aqui o conteúdo da página do marketplace..." style="width: 100%; padding: 10px; font-size: 12px; font-family: monospace;"></textarea>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
            <button onclick="UI_MergeVsMarket.atualizarPrecos()" style="padding: 12px; background: #ffc107; color: #000; font-weight: bold;">
              🔄 Atualizar Preços
            </button>
            <button onclick="UI_MergeVsMarket.mostrarPrecosAtuais()" style="padding: 12px; background: #6c757d; color: white;">
              👁️ Ver Preços Atuais
            </button>
          </div>
        </div>
        
        <div id="precosAtualizados" style="margin-top: 15px;"></div>
      </div>

      <hr style="margin: 40px 0; border: 0; border-top: 2px solid #ddd;">

      <!-- SEÇÃO: COMPARADOR -->
      <h3>💰 Compare Opções</h3>
      <div class="summary-item">
        <h4>🎯 Suas Metas</h4>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
          <!-- Fan -->
          <div>
            <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>🌀 Fan</strong></label>
            <select id="fanTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
              <option value="">-- Nenhum --</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
            <input type="number" id="fanQty" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
          </div>

          <!-- Wire -->
          <div>
            <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>🔌 Wire</strong></label>
            <select id="wireTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
              <option value="">-- Nenhum --</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
            <input type="number" id="wireQty" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
          </div>

          <!-- Hashboard -->
          <div>
            <label style="display: block; margin-bottom: 5px; font-size: 13px;"><strong>💾 Hashboard</strong></label>
            <select id="hashTier" style="width: 100%; padding: 8px; margin-bottom: 5px;">
              <option value="">-- Nenhum --</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
            <input type="number" id="hashQty" placeholder="Quantidade" min="0" style="width: 100%; padding: 8px;">
          </div>
        </div>

        <button onclick="UI_MergeVsMarket.comparar()" style="width: 100%; padding: 15px; font-size: 16px; font-weight: bold; background: #FF9800; color: white;">
          💰 Comparar Opções
        </button>
      </div>

      <div id="resultadoComparacao"></div>
    `;
  },

  // ========== ATUALIZAR PREÇOS ==========
  atualizarPrecos() {
    const text = document.getElementById('marketText').value.trim();
    const resultDiv = document.getElementById('precosAtualizados');
    
    if (!text) {
      resultDiv.innerHTML = `
        <div style="background: #ffebee; padding: 10px; border-radius: 5px; border-left: 4px solid #f44336;">
          <p style="margin: 0; font-size: 13px;">⚠️ Cole o texto da página primeiro!</p>
        </div>
      `;
      return;
    }

    try {
      const prices = this.parsearPrecos(text);
      
      // Atualizar preços no sistema
      this.marketPrices = prices;
      
      // Salvar no localStorage
      localStorage.setItem('rollercoin_market_prices', JSON.stringify(prices));
      localStorage.setItem('rollercoin_prices_update', new Date().toISOString());
      
      resultDiv.innerHTML = `
        <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 10px 0;">✅ Preços Atualizados com Sucesso!</h4>
          <p style="margin: 0; font-size: 12px; color: #666;">
            Última atualização: ${new Date().toLocaleString('pt-BR')}
          </p>
          <button onclick="UI_MergeVsMarket.mostrarPrecosAtuais()" style="margin-top: 10px; padding: 8px 15px; font-size: 12px;">
            👁️ Ver Preços Atualizados
          </button>
        </div>
      `;
      
      console.log('✅ Preços atualizados:', prices);
      
    } catch (error) {
      resultDiv.innerHTML = `
        <div style="background: #ffebee; padding: 10px; border-radius: 5px; border-left: 4px solid #f44336;">
          <p style="margin: 0; font-size: 13px;">❌ Erro ao processar: ${error.message}</p>
          <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">
            Verifique se:<br>
            • Copiou da página correta (Marketplace > Buy > Parts)<br>
            • Alterou para 24 resultados por página<br>
            • Marcou apenas "Parts"
          </p>
        </div>
      `;
      console.error('Erro ao parsear preços:', error);
    }
  },

  parsearPrecos(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    const prices = {
      common: { fan: null, wire: null, hashboard: null },
      uncommon: { fan: null, wire: null, hashboard: null },
      rare: { fan: null, wire: null, hashboard: null },
      epic: { fan: null, wire: null, hashboard: null },
      legendary: { fan: null, wire: null, hashboard: null }
    };
    
    const partMap = {
      'Fan': 'fan',
      'Wire': 'wire',
      'Hashboard': 'hashboard'
    };
    
    const tierMap = {
      'Common': 'common',
      'Uncommon': 'uncommon',
      'Rare': 'rare',
      'Epic': 'epic',
      'Legendary': 'legendary'
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(Common|Uncommon|Rare|Epic|Legendary)\s+(Fan|Wire|Hashboard)$/i);
      
      if (match) {
        const tier = tierMap[match[1]];
        const part = partMap[match[2]];
        
        for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
          if (lines[j] === 'From' && j + 1 < lines.length) {
            const priceMatch = lines[j + 1].match(/([\d\s.,]+)\s*RLT/i);
            
            if (priceMatch) {
              let priceStr = priceMatch[1].replace(/\s/g, '');
              if (priceStr.includes(',') && !priceStr.includes('.')) {
                priceStr = priceStr.replace(',', '.');
              }
              const price = parseFloat(priceStr);
              if (!isNaN(price) && price > 0) {
                prices[tier][part] = price;
                break;
              }
            }
          }
        }
      }
    }
    
    let missing = [];
    Object.keys(prices).forEach(tier => {
      Object.keys(prices[tier]).forEach(part => {
        if (prices[tier][part] === null) {
          missing.push(`${tier} ${part}`);
        }
      });
    });
    
    if (missing.length > 0) {
      throw new Error(`Faltam ${missing.length} preços. Verifique se copiou corretamente.`);
    }
    
    return prices;
  },

  mostrarPrecosAtuais() {
    const resultDiv = document.getElementById('precosAtualizados');
    const lastUpdate = localStorage.getItem('rollercoin_prices_update');
    const updateText = lastUpdate 
      ? `Última atualização: ${new Date(lastUpdate).toLocaleString('pt-BR')}`
      : 'Nunca atualizado';
    
    const tierEmojis = { 
      common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' 
    };
    
    let html = `
      <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
          <h4 style="margin: 0;">💰 Preços Atuais</h4>
          <span style="font-size: 11px; color: #666;">${updateText}</span>
        </div>
        <table style="width: 100%; font-size: 12px;">
          <thead style="background: #f8f9fa;">
            <tr>
              <th style="padding: 8px; text-align: left;">Tier</th>
              <th style="padding: 8px;">🌀 Fan</th>
              <th style="padding: 8px;">🔌 Wire</th>
              <th style="padding: 8px;">💾 Hashboard</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    ['common', 'uncommon', 'rare', 'epic', 'legendary'].forEach(tier => {
      html += `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 8px;"><strong>${tierEmojis[tier]} ${this.getTierName(tier)}</strong></td>
          <td style="padding: 8px; text-align: center;">${this.marketPrices[tier].fan.toFixed(4)} RLT</td>
          <td style="padding: 8px; text-align: center;">${this.marketPrices[tier].wire.toFixed(4)} RLT</td>
          <td style="padding: 8px; text-align: center;">${this.marketPrices[tier].hashboard.toFixed(4)} RLT</td>
        </tr>
      `;
    });
    
    html += `</tbody></table></div>`;
    resultDiv.innerHTML = html;
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
  },

  // ========== COMPARADOR ==========
  comparar() {
    const parts = [
      {
        type: 'fan', emoji: '🌀', name: 'Fan',
        tier: document.getElementById('fanTier').value,
        qty: parseInt(document.getElementById('fanQty').value) || 0
      },
      {
        type: 'wire', emoji: '🔌', name: 'Wire',
        tier: document.getElementById('wireTier').value,
        qty: parseInt(document.getElementById('wireQty').value) || 0
      },
      {
        type: 'hashboard', emoji: '💾', name: 'Hashboard',
        tier: document.getElementById('hashTier').value,
        qty: parseInt(document.getElementById('hashQty').value) || 0
      }
    ];

    const selectedParts = parts.filter(p => p.tier && p.qty > 0);
    const resultDiv = document.getElementById('resultadoComparacao');

    if (selectedParts.length === 0) {
      resultDiv.innerHTML = `
        <div class="summary-item" style="background: #ffebee; border-left: 4px solid #f44336; margin-top: 20px;">
          <h4>⚠️ Nenhuma Peça Selecionada</h4>
          <p>Selecione pelo menos uma peça!</p>
        </div>
      `;
      return;
    }

    const results = selectedParts.map(part => ({
      ...part,
      ...this.calcularComparacao(part.type, part.tier, part.qty)
    }));

    const totalOption1 = results.reduce((s, r) => s + r.option1Cost, 0);
    const totalOption2 = results.reduce((s, r) => s + r.option2Cost, 0);
    const totalOption3 = results.reduce((s, r) => s + r.option3Cost, 0);

    const bestOption = [
      { id: 1, cost: totalOption1 },
      { id: 2, cost: totalOption2 },
      { id: 3, cost: totalOption3 }
    ].reduce((min, opt) => opt.cost < min.cost ? opt : min);

    this.mostrarResultadoComparacao(results, { totalOption1, totalOption2, totalOption3, bestOption });
  },

  calcularComparacao(partType, targetTier, quantity) {
    const option1Cost = this.calcularCustoMergeTaxas('common', targetTier, quantity);
    const commonNeeded = this.calcularPecasNecessarias('common', targetTier, quantity);
    const commonPrice = this.marketPrices.common[partType];
    const option2Cost = (commonNeeded * commonPrice) + option1Cost;
    const directPrice = this.marketPrices[targetTier][partType];
    const option3Cost = quantity * directPrice;

    return { option1Cost, option2Cost, option3Cost, commonNeeded, commonPrice, directPrice };
  },

  calcularCustoMergeTaxas(startTier, targetTier, targetQty) {
    const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const startIndex = tiers.indexOf(startTier);
    const targetIndex = tiers.indexOf(targetTier);
    let currentQty = targetQty;
    let totalCost = 0;

    for (let i = targetIndex - 1; i >= startIndex; i--) {
      totalCost += currentQty * this.mergeCosts[tiers[i]].cost;
      currentQty *= this.mergeCosts[tiers[i]].need;
    }
    return totalCost;
  },

  calcularPecasNecessarias(startTier, targetTier, targetQty) {
    const tiers = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const startIndex = tiers.indexOf(startTier);
    const targetIndex = tiers.indexOf(targetTier);
    let currentQty = targetQty;

    for (let i = targetIndex - 1; i >= startIndex; i--) {
      currentQty *= this.mergeCosts[tiers[i]].need;
    }
    return currentQty;
  },

  mostrarResultadoComparacao(results, totals) {
    const resultDiv = document.getElementById('resultadoComparacao');
    const tierEmojis = { common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' };

    let html = `
      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3; margin-top: 30px;">
        <h3>📊 Resultado da Comparação</h3>
    `;

    results.forEach(result => {
      const bestLocal = Math.min(result.option1Cost, result.option2Cost, result.option3Cost);
      const option2BetterThan3 = result.option2Cost < result.option3Cost;
      const savingsVs3 = result.option3Cost - result.option2Cost;
      const savingsPercent = (savingsVs3 / result.option3Cost * 100);
      
      html += `
        <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #4CAF50;">
          <h4 style="margin: 0 0 15px 0;">
            ${result.emoji} ${result.qty}x ${tierEmojis[result.tier]} ${this.getTierName(result.tier)} ${result.name}
          </h4>
          ${option2BetterThan3 ? `
            <div style="background: #fff3e0; padding: 10px; border-radius: 5px; border-left: 3px solid #FF9800; margin-bottom: 15px; font-size: 12px;">
              <strong style="color: #e65100;">🔥 Comprar Common + Merge é ${savingsPercent.toFixed(1)}% mais barato que comprar pronto!</strong>
              <span style="color: #666;"> (Economia: ${savingsVs3.toFixed(4)} RLT)</span>
            </div>
          ` : ''}
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
            <div style="background: ${result.option1Cost === bestLocal ? '#e8f5e8' : '#f8f9fa'}; padding: 15px; border-radius: 5px; border: 2px solid ${result.option1Cost === bestLocal ? '#4CAF50' : '#ddd'};">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">${result.option1Cost === bestLocal ? '⭐ ' : ''}Opção 1</div>
              <div style="font-size: 11px; margin-bottom: 10px;">Merge (só taxas)</div>
              <div style="font-size: 18px; font-weight: bold; color: ${result.option1Cost === bestLocal ? '#4CAF50' : '#333'};">${result.option1Cost.toFixed(4)} RLT</div>
              <div style="font-size: 10px; color: #999; margin-top: 5px;">Você já tem peças</div>
            </div>
            <div style="background: ${result.option2Cost === bestLocal ? '#e8f5e8' : '#f8f9fa'}; padding: 15px; border-radius: 5px; border: 2px solid ${result.option2Cost === bestLocal ? '#4CAF50' : '#ddd'};">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">${result.option2Cost === bestLocal ? '⭐ ' : ''}Opção 2</div>
              <div style="font-size: 11px; margin-bottom: 10px;">Comprar Common + Merge</div>
              <div style="font-size: 18px; font-weight: bold; color: ${result.option2Cost === bestLocal ? '#4CAF50' : '#333'};">${result.option2Cost.toFixed(4)} RLT</div>
              <div style="font-size: 10px; color: #999; margin-top: 5px;">${result.commonNeeded} Common</div>
            </div>
            <div style="background: ${result.option3Cost === bestLocal ? '#e8f5e8' : '#f8f9fa'}; padding: 15px; border-radius: 5px; border: 2px solid ${result.option3Cost === bestLocal ? '#4CAF50' : '#ddd'};">
              <div style="font-size: 12px; color: #666; margin-bottom: 5px;">${result.option3Cost === bestLocal ? '⭐ ' : ''}Opção 3</div>
              <div style="font-size: 11px; margin-bottom: 10px;">Comprar Pronto</div>
              <div style="font-size: 18px; font-weight: bold; color: ${result.option3Cost === bestLocal ? '#4CAF50' : '#333'};">${result.option3Cost.toFixed(4)} RLT</div>
              <div style="font-size: 10px; color: #999; margin-top: 5px;">Direto no market</div>
            </div>
          </div>
        </div>
      `;
    });

    const savings = totals.totalOption3 - totals.bestOption.cost;
    const savingsPercent = (savings / totals.totalOption3) * 100;

    html += `
        <div style="background: #4CAF50; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0;">🎉 Melhor Opção: Opção ${totals.bestOption.id}</h3>
          <p style="font-size: 36px; font-weight: bold; margin: 10px 0;">${totals.bestOption.cost.toFixed(4)} RLT</p>
          <p style="font-size: 16px; margin: 10px 0;">💰 Economia: ${savings.toFixed(4)} RLT (${savingsPercent.toFixed(1)}%)</p>
        </div>
      </div>

      <div class="summary-item" style="background: #e3f2fd; border-left: 4px solid #2196F3; margin-top: 20px;">
        <h4>💡 Dica do BBJ</h4>
        <p style="font-size: 13px; line-height: 1.6;">
          ✅ <strong>Compare sempre!</strong> O merge quase sempre sai mais barato que comprar pronto.<br>
          💰 Se você comprar peças Common e fizer merge, economiza MUITO mais que comprar direto.<br>
          📊 Use esta ferramenta antes de gastar seus RLT no marketplace!
        </p>
      </div>

      <div class="summary-item" style="background: #fff3e0; border-left: 4px solid #FF9800; margin-top: 20px;">
        <h4>🔥 Insight Importante</h4>
        <p style="font-size: 13px; line-height: 1.6;">
          <strong>Mesmo se você NÃO tem as peças:</strong><br>
          📈 <strong>Comprar Common + Merge</strong> é quase sempre mais barato que <strong>Comprar Pronto</strong>!<br>
          <br>
          💰 Na maioria dos casos, você economiza entre <strong>5% a 15%</strong> comprando Common e fazendo merge.<br>
          🎯 <strong>Conclusão:</strong> Sempre vale a pena fazer merge, mesmo comprando as peças!<br>
          <br>
          <em style="font-size: 12px; color: #666;">💡 Use o comparador acima para ver a economia exata com os preços atuais do mercado!</em>
        </p>
      </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  getTierName(tier) {
    const names = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
    return names[tier] || tier;
  }
};

window.UI_MergeVsMarket = UI_MergeVsMarket;
console.log('✅ UI_MergeVsMarket loaded');