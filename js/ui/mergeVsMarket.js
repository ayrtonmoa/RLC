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
      <h2>📈 Parts vs Market</h2>
      
      <div class="info-box-green">
        <h4>💡 Sugestão do BBJ</h4>
        <p>
          Compare 3 opções e descubra qual é <strong>mais barata</strong>:<br>
          <strong>1)</strong> Fazer merge (só taxas) - se você já tem peças<br>
          <strong>2)</strong> Comprar peças menores + fazer merge<br>
          <strong>3)</strong> Comprar pronto no marketplace
        </p>
        <p class="price-update-timestamp">
          💡 <em>"Seria bom implementar um local pra gente colocar o valor que eu comprou no mercado junto com o valor do merge"</em> - BBJ
        </p>
      </div>

      <!-- SEÇÃO: ATUALIZAR PREÇOS -->
      <div class="market-update-section">
        <h4>🔄 Atualizar Preços do Marketplace</h4>
        <p>Cole o conteúdo da página do marketplace para atualizar os preços automaticamente!</p>
        <p class="price-update-timestamp">
          ✅ Funciona tanto no <strong>Desktop</strong> quanto no <strong>Mobile</strong>!
        </p>
        <ol class="market-update-list">
          <li>Vá em <a href="https://rollercoin.com/marketplace/buy" target="_blank"><strong>Marketplace > Buy > Parts</strong></a></li>
          <li>⚠️ <strong>IMPORTANTE:</strong> Altere de <strong>12 para 24 resultados por página</strong></li>
          <li>Marque <strong>apenas "Parts"</strong> (desmarque Miners, Racks, etc)</li>
          <li>Pressione <kbd>Ctrl+A</kbd> e <kbd>Ctrl+C</kbd> (ou pressione e segure na tela no mobile)</li>
          <li>Cole abaixo e clique em "Atualizar Preços"</li>
        </ol>
        
        <div>
          <textarea id="marketText" rows="4" placeholder="Cole aqui o conteúdo da página do marketplace..." class="market-textarea"></textarea>
          <div class="market-buttons-grid">
            <button onclick="UI_MergeVsMarket.atualizarPrecos()" class="btn-update-prices">
              🔄 Atualizar Preços
            </button>
            <button onclick="UI_MergeVsMarket.mostrarPrecosAtuais()" class="btn-show-prices">
              👁️ Ver Preços Atuais
            </button>
          </div>
        </div>
        
        <div id="precosAtualizados"></div>
      </div>

      <hr class="merge-separator">

      <!-- SEÇÃO: COMPARADOR -->
      <h3>💰 Compare Opções</h3>
      <div class="summary-item">
        <h4>🎯 Suas Metas</h4>
        
        <div class="comparator-grid">
          <!-- Fan -->
          <div>
            <label class="part-label">🌀 Fan</label>
            <select id="fanTier" class="part-select">
              <option value="">-- Nenhum --</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
            <input type="number" id="fanQty" placeholder="Quantidade" min="0" class="part-input">
          </div>

          <!-- Wire -->
          <div>
            <label class="part-label">🔌 Wire</label>
            <select id="wireTier" class="part-select">
              <option value="">-- Nenhum --</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
            <input type="number" id="wireQty" placeholder="Quantidade" min="0" class="part-input">
          </div>

          <!-- Hashboard -->
          <div>
            <label class="part-label">💾 Hashboard</label>
            <select id="hashTier" class="part-select">
              <option value="">-- Nenhum --</option>
              <option value="uncommon">🟢 Uncommon</option>
              <option value="rare">🔵 Rare</option>
              <option value="epic">🟣 Epic</option>
              <option value="legendary">🟡 Legendary</option>
            </select>
            <input type="number" id="hashQty" placeholder="Quantidade" min="0" class="part-input">
          </div>
        </div>

        <button onclick="UI_MergeVsMarket.comparar()" class="btn-compare">
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
        <div class="price-update-error">
          <p style="margin: 0;">⚠️ Cole o texto da página primeiro!</p>
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
        <div class="price-update-success">
          <h4 style="margin: 0 0 10px 0;">✅ Preços Atualizados com Sucesso!</h4>
          <p class="price-update-timestamp">
            Última atualização: ${new Date().toLocaleString('pt-BR')}
          </p>
          <button onclick="UI_MergeVsMarket.mostrarPrecosAtuais()" class="btn-show-prices" style="margin-top: 10px; padding: 8px 15px; font-size: 12px;">
            👁️ Ver Preços Atualizados
          </button>
        </div>
      `;
      
      console.log('✅ Preços atualizados:', prices);
      
    } catch (error) {
      resultDiv.innerHTML = `
        <div class="price-update-error">
          <p style="margin: 0;">❌ Erro ao processar: ${error.message}</p>
          <p style="margin: 5px 0 0 0; font-size: 11px;">
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
      
      // Detectar padrão: "Tier Part" (ex: "Common Fan", "Rare Wire")
      const match = line.match(/^(Common|Uncommon|Rare|Epic|Legendary)\s+(Fan|Wire|Hashboard)$/i);
      
      if (match) {
        const tier = tierMap[match[1]];
        const part = partMap[match[2]];
        
        // Procurar preço nas próximas 10 linhas
        for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
          const priceLine = lines[j];
          
          // FORMATO MOBILE: "From: 2.152499 RLT" (tudo na mesma linha)
          const mobileMatch = priceLine.match(/^From:\s*([\d\s.,]+)\s*RLT/i);
          if (mobileMatch) {
            const price = this.parsePrice(mobileMatch[1]);
            if (price > 0) {
              prices[tier][part] = price;
              break;
            }
          }
          
          // FORMATO DESKTOP: "From" numa linha, preço na próxima
          if (priceLine === 'From' && j + 1 < lines.length) {
            const nextLine = lines[j + 1];
            const desktopMatch = nextLine.match(/([\d\s.,]+)\s*RLT/i);
            
            if (desktopMatch) {
              const price = this.parsePrice(desktopMatch[1]);
              if (price > 0) {
                prices[tier][part] = price;
                break;
              }
            }
          }
        }
      }
    }
    
    // Validar se todos os preços foram encontrados
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

  parsePrice(priceStr) {
    // Remove espaços
    priceStr = priceStr.replace(/\s/g, '');
    
    // Converter vírgula para ponto
    if (priceStr.includes(',') && !priceStr.includes('.')) {
      priceStr = priceStr.replace(',', '.');
    } else if (priceStr.includes('.') && priceStr.includes(',')) {
      // Se tem ambos, último é decimal
      if (priceStr.lastIndexOf(',') > priceStr.lastIndexOf('.')) {
        priceStr = priceStr.replace(/\./g, '').replace(',', '.');
      } else {
        priceStr = priceStr.replace(/,/g, '');
      }
    }
    
    const price = parseFloat(priceStr);
    return (!isNaN(price) && price > 0) ? price : 0;
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
      <div class="prices-table-container">
        <div class="prices-table-header">
          <h4>💰 Preços Atuais</h4>
          <span class="price-update-timestamp">${updateText}</span>
        </div>
        <table class="prices-table">
          <thead>
            <tr>
              <th>Tier</th>
              <th>🌀 Fan</th>
              <th>🔌 Wire</th>
              <th>💾 Hashboard</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    ['common', 'uncommon', 'rare', 'epic', 'legendary'].forEach(tier => {
      html += `
        <tr>
          <td><strong>${tierEmojis[tier]} ${this.getTierName(tier)}</strong></td>
          <td>${this.marketPrices[tier].fan.toFixed(4)} RLT</td>
          <td>${this.marketPrices[tier].wire.toFixed(4)} RLT</td>
          <td>${this.marketPrices[tier].hashboard.toFixed(4)} RLT</td>
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
        <div class="info-box-red">
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
      <div class="info-box-blue" style="margin-top: 30px;">
        <h3>📊 Resultado da Comparação</h3>
    `;

    results.forEach(result => {
      const bestLocal = Math.min(result.option1Cost, result.option2Cost, result.option3Cost);
      const option2BetterThan3 = result.option2Cost < result.option3Cost;
      const savingsVs3 = result.option3Cost - result.option2Cost;
      const savingsPercent = (savingsVs3 / result.option3Cost * 100);
      
      html += `
        <div class="comparison-part-card">
          <h4 class="comparison-part-title">
            ${result.emoji} ${result.qty}x ${tierEmojis[result.tier]} ${this.getTierName(result.tier)} ${result.name}
          </h4>
          ${option2BetterThan3 ? `
            <div class="savings-highlight">
              <strong>🔥 Comprar Common + Merge é ${savingsPercent.toFixed(1)}% mais barato que comprar pronto!</strong>
              <span>(Economia: ${savingsVs3.toFixed(4)} RLT)</span>
            </div>
          ` : ''}
          <div class="options-grid">
            <div class="option-card ${result.option1Cost === bestLocal ? 'best' : ''}">
              <div class="option-label">${result.option1Cost === bestLocal ? '⭐ ' : ''}Opção 1</div>
              <div class="option-description">Merge (só taxas)</div>
              <div class="option-cost">${result.option1Cost.toFixed(4)} RLT</div>
              <div class="option-meta">Você já tem peças</div>
            </div>
            <div class="option-card ${result.option2Cost === bestLocal ? 'best' : ''}">
              <div class="option-label">${result.option2Cost === bestLocal ? '⭐ ' : ''}Opção 2</div>
              <div class="option-description">Comprar Common + Merge</div>
              <div class="option-cost">${result.option2Cost.toFixed(4)} RLT</div>
              <div class="option-meta">${result.commonNeeded} Common</div>
            </div>
            <div class="option-card ${result.option3Cost === bestLocal ? 'best' : ''}">
              <div class="option-label">${result.option3Cost === bestLocal ? '⭐ ' : ''}Opção 3</div>
              <div class="option-description">Comprar Pronto</div>
              <div class="option-cost">${result.option3Cost.toFixed(4)} RLT</div>
              <div class="option-meta">Direto no market</div>
            </div>
          </div>
        </div>
      `;
    });

    const savings = totals.totalOption3 - totals.bestOption.cost;
    const savingsPercent = (savings / totals.totalOption3) * 100;

    html += `
        <div class="best-option-box">
          <h3>🎉 Melhor Opção: Opção ${totals.bestOption.id}</h3>
          <p class="best-option-value">${totals.bestOption.cost.toFixed(4)} RLT</p>
          <p class="best-option-savings">💰 Economia: ${savings.toFixed(4)} RLT (${savingsPercent.toFixed(1)}%)</p>
        </div>
      </div>

      <div class="info-box-blue">
        <h4>💡 Dica do BBJ</h4>
        <p class="insight-box">
          ✅ <strong>Compare sempre!</strong> O merge quase sempre sai mais barato que comprar pronto.<br>
          💰 Se você comprar peças Common e fizer merge, economiza MUITO mais que comprar direto.<br>
          📊 Use esta ferramenta antes de gastar seus RLT no marketplace!
        </p>
      </div>

      <div class="info-box-orange">
        <h4>🔥 Insight Importante</h4>
        <p class="insight-box">
          <strong>Mesmo se você NÃO tem as peças:</strong><br>
          📈 <strong>Comprar Common + Merge</strong> é quase sempre mais barato que <strong>Comprar Pronto</strong>!<br>
          <br>
          💰 Na maioria dos casos, você economiza entre <strong>5% a 15%</strong> comprando Common e fazendo merge.<br>
          🎯 <strong>Conclusão:</strong> Sempre vale a pena fazer merge, mesmo comprando as peças!<br>
          <br>
          <em>💡 Use o comparador acima para ver a economia exata com os preços atuais do mercado!</em>
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