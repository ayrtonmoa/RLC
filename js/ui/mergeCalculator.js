// js/ui/mergeCalculator.js - Calculadora de Merge (3 peças simultâneas)

const UI_MergeCalculator = {
  // Taxas oficiais do RollerCoin, conferidas uma a uma contra a tela de merge do jogo em
  // 27/08/2026. São as taxas CHEIAS: a conta pode ter desconto (aparece riscado no jogo),
  // mas ele varia por conta, então o app calcula sempre pelo valor sem desconto.
  // Valores antigos estavam mais altos que o atual (a RollerCoin mudou em algum momento não
  // registrado); as quantidades (50/20/10/5) não mudaram.
  mergeCosts: {
    common: { need: 50, cost: 0.002 },      // 50 Common → 1 Uncommon = 0.002 RLT
    uncommon: { need: 20, cost: 0.05 },     // 20 Uncommon → 1 Rare = 0.05 RLT
    rare: { need: 10, cost: 0.75 },         // 10 Rare → 1 Epic = 0.75 RLT
    epic: { need: 5, cost: 1.6 }            // 5 Epic → 1 Legendary = 1.6 RLT
  },

  TIERS: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  TIER_EMOJI: { common: '⚪', uncommon: '🟢', rare: '🔵', epic: '🟣', legendary: '🟡' },


  // Preços do marketplace colados pelo usuário na aba Inventário, guardados no localStorage.
  // Common fica sempre nulo porque a RollerCoin tirou essa peça do marketplace.
  marketPrices: null,

  _carregarPrecos: function() {
    try {
      const saved = localStorage.getItem('rollercoin_market_prices');
      this.marketPrices = saved ? JSON.parse(saved) : null;
    } catch (e) {
      this.marketPrices = null;
    }
    return this.marketPrices;
  },

  // Lê a lista de preços colada da página Marketplace > Buy > Parts. Chamado pela aba
  // Inventário, que é onde o usuário cola tudo hoje.
  parsearPrecos(text, existing) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    const prices = {
      common: { fan: null, wire: null, hashboard: null },
      uncommon: { fan: null, wire: null, hashboard: null },
      rare: { fan: null, wire: null, hashboard: null },
      epic: { fan: null, wire: null, hashboard: null },
      legendary: { fan: null, wire: null, hashboard: null }
    };

    const partMap = { 'Fan': 'fan', 'Wire': 'wire', 'Hashboard': 'hashboard' };
    const tierMap = {
      'Common': 'common', 'Uncommon': 'uncommon', 'Rare': 'rare',
      'Epic': 'epic', 'Legendary': 'legendary'
    };

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(Common|Uncommon|Rare|Epic|Legendary)\s+(Fan|Wire|Hashboard)$/i);
      if (!match) continue;
      const tier = tierMap[match[1]];
      const part = partMap[match[2]];

      // O preço aparece nas linhas seguintes, em dois formatos possíveis.
      for (let j = i + 1; j < i + 10 && j < lines.length; j++) {
        // Mobile: "From: 2.152499 RLT" tudo na mesma linha.
        const mobileMatch = lines[j].match(/^From:\s*([\d\s.,]+)\s*RLT/i);
        if (mobileMatch) {
          const price = this.parsePrice(mobileMatch[1]);
          if (price > 0) { prices[tier][part] = price; break; }
        }
        // Desktop: "From" numa linha, o valor na próxima.
        if (lines[j] === 'From' && j + 1 < lines.length) {
          const desktopMatch = lines[j + 1].match(/([\d\s.,]+)\s*RLT/i);
          if (desktopMatch) {
            const price = this.parsePrice(desktopMatch[1]);
            if (price > 0) { prices[tier][part] = price; break; }
          }
        }
      }
    }

    // A RollerCoin tirou peça Common do marketplace: não tem preço "From" pra ela e nunca vai
    // ter, então nem entra na validação nem herda preço antigo (que ficaria obsoleto).
    prices.common = { fan: null, wire: null, hashboard: null };

    // Peças que não apareceram no texto colado (fora Common): mantém o preço salvo
    // anteriormente em vez de travar tudo, e só sinaliza quem ficou sem preço nenhum.
    let achados = 0;
    const semPreco = [];
    Object.keys(prices).forEach(tier => {
      if (tier === 'common') return;
      Object.keys(prices[tier]).forEach(part => {
        if (prices[tier][part] !== null) {
          achados++;
        } else if (existing && existing[tier] && existing[tier][part] != null) {
          prices[tier][part] = existing[tier][part];
        } else {
          semPreco.push(`${tier} ${part}`);
        }
      });
    });

    if (achados === 0) {
      throw new Error('Nenhum preço reconhecido no texto colado. Verifique se copiou corretamente.');
    }

    prices._semPreco = semPreco;
    return prices;
  },

  parsePrice(priceStr) {
    priceStr = priceStr.replace(/\s/g, '');
    if (priceStr.includes(',') && !priceStr.includes('.')) {
      priceStr = priceStr.replace(',', '.');
    } else if (priceStr.includes('.') && priceStr.includes(',')) {
      // Tendo os dois separadores, o último é o decimal.
      if (priceStr.lastIndexOf(',') > priceStr.lastIndexOf('.')) {
        priceStr = priceStr.replace(/\./g, '').replace(',', '.');
      } else {
        priceStr = priceStr.replace(/,/g, '');
      }
    }
    const price = parseFloat(priceStr);
    return (!isNaN(price) && price > 0) ? price : 0;
  },

  // Preço de 1 peça pronta na lista do marketplace, que é exatamente o que o comprador paga
  // (a comissão de 5% sai do vendedor, não de quem compra), ou null quando não dá pra comprar:
  // sem preço informado, ou Common, que saiu do marketplace.
  _precoMercado: function(tier, nome) {
    if (tier === 'common') return null;
    const precos = this.marketPrices || this._carregarPrecos();
    const v = precos?.[tier]?.[String(nome).toLowerCase()];
    return (typeof v === 'number' && v > 0) ? v : null;
  },

  // Estoque real de peças vindo da aba Inventário, no formato { common: 21276, rare: 3, ... }
  // pra um tipo de peça. Sem inventário colado, devolve tudo zero.
  _estoqueDe: function(nome) {
    const cache = (typeof UI_Inventario !== 'undefined' && UI_Inventario.partsCached) || {};
    const out = {};
    this.TIERS.forEach(t => {
      const chave = `${nome}|${this.getTierName(t)}`;
      out[t] = cache[chave] || 0;
    });
    return out;
  },

  // Quantas peças do tier `idx` o estoque inteiro consegue produzir, somando o que já existe
  // naquele tier com o que dá pra fundir vindo de baixo. Serve pra saber onde o estoque
  // "acaba", que é exatamente o ponto onde a estratégia muda de fundir pra comprar.
  _capacidadeDoEstoque: function(estoque) {
    const cap = [];
    this.TIERS.forEach((tier, i) => {
      const proprio = estoque[tier] || 0;
      if (i === 0) { cap[i] = proprio; return; }
      const regra = this.mergeCosts[this.TIERS[i - 1]];
      cap[i] = proprio + Math.floor(cap[i - 1] / regra.need);
    });
    return cap;
  },

  // Sem nenhum estoque, qual o jeito mais barato de obter 1 peça de cada tier: comprar pronta
  // ali, ou comprar mais barato lá embaixo e fundir pra cima. Devolve também em qual tier
  // vale a pena comprar, que é o que permite dizer "compre Uncommon e funda até Rare".
  _custoUnitarioSemEstoque: function(nome) {
    const unit = [];
    this.TIERS.forEach((tier, i) => {
      const preco = this._precoMercado(tier, nome);
      const comprarAqui = preco != null ? preco : Infinity;
      let fundirDeBaixo = Infinity;
      if (i > 0 && unit[i - 1].custo !== Infinity) {
        const regra = this.mergeCosts[this.TIERS[i - 1]];
        fundirDeBaixo = unit[i - 1].custo * regra.need + regra.cost;
      }
      unit[i] = fundirDeBaixo < comprarAqui
        ? { custo: fundirDeBaixo, compraEm: unit[i - 1].compraEm }
        : { custo: comprarAqui, compraEm: comprarAqui === Infinity ? null : i };
    });
    return unit;
  },

  // Jeito MAIS BARATO de obter `qtd` peças de `tierAlvo`, combinando três fontes: o estoque
  // que você já tem, fundir de baixo pra cima, e comprar pronto no marketplace. Divide a
  // quantidade quando compensa ("funde 3 com o que tem, compra os outros 2"), em vez de
  // decidir tudo-ou-nada, que é o que a antiga comparação de 3 opções fazia.
  //
  // Em cada degrau avalia três caminhos e fica com o mais barato de verdade (simulando, não
  // por estimativa): fundir só o que o estoque cobre e resolver o resto à parte, fundir tudo
  // comprando a matéria-prima que faltar, ou comprar pronto ali mesmo. São 5 raridades, então
  // testar os três caminhos em cada uma é barato e evita ter que adivinhar qual vale.
  //
  // Não altera o estoque recebido: cada ramo trabalha na própria cópia.
  // Custo de fundir `qtd` peças de `tierAlvo` do ZERO: ignora estoque e ignora a opção de
  // comprar, é só a soma das taxas de fusão descendo até Common. Serve de baseline pra
  // comparar contra a rota real ("quanto eu perderia se só fundisse, sem usar estoque nem
  // comprar nada?"), que é diferente de comparar contra "comprar tudo pronto".
  _custoFundirPuro: function(tierAlvo, qtd) {
    const alvoIdx = this.TIERS.indexOf(tierAlvo);
    if (alvoIdx <= 0 || qtd <= 0) return 0;
    let custo = 0, n = qtd;
    for (let i = alvoIdx; i > 0; i--) {
      const regra = this.mergeCosts[this.TIERS[i - 1]];
      custo += n * regra.cost;
      n *= regra.need;
    }
    return custo;
  },

  _rotaMaisBarata: function(nome, tierAlvo, qtd, estoque) {
    const alvoIdx = this.TIERS.indexOf(tierAlvo);
    if (alvoIdx < 0 || qtd <= 0) return null;

    const melhor = (a, b) => {
      if (!a || !a.possivel) return b;
      if (!b || !b.possivel) return a;
      return b.custo < a.custo ? b : a;
    };

    const resolver = (idx, precisa, est) => {
      if (precisa <= 0) return { possivel: true, custo: 0, acoes: [], est };
      const tier = this.TIERS[idx];

      // Estoque do próprio tier sempre entra primeiro: é de graça e não tem contrapartida.
      const usar = Math.min(est[tier] || 0, precisa);
      let acoesBase = [];
      let estBase = est;
      if (usar > 0) {
        estBase = { ...est, [tier]: est[tier] - usar };
        precisa -= usar;
        acoesBase = [{ tier, tipo: 'estoque', qtd: usar, custo: 0 }];
      }
      if (precisa <= 0) return { possivel: true, custo: 0, acoes: acoesBase, est: estBase };

      const juntar = (r) => r && r.possivel
        ? { possivel: true, custo: r.custo, acoes: acoesBase.concat(r.acoes), est: r.est }
        : { possivel: false, custo: Infinity, acoes: acoesBase, est: estBase, faltou: r?.faltou || { tier, qtd: precisa } };

      // Caminho A: comprar pronto neste tier.
      const precoUnit = this._precoMercado(tier, nome);
      const comprar = precoUnit != null
        ? { possivel: true, custo: precoUnit * precisa, est: estBase,
            acoes: [{ tier, tipo: 'comprar', qtd: precisa, custo: precoUnit * precisa, precoUnit }] }
        : null;

      if (idx === 0) return juntar(comprar || { possivel: false, faltou: { tier, qtd: precisa } });

      const regra = this.mergeCosts[this.TIERS[idx - 1]];
      const fundirQtd = (n, estAtual) => {
        if (n <= 0) return { possivel: true, custo: 0, acoes: [], est: estAtual };
        const abaixo = resolver(idx - 1, n * regra.need, estAtual);
        if (!abaixo.possivel) return { possivel: false, custo: Infinity, faltou: abaixo.faltou };
        const taxa = n * regra.cost;
        return {
          possivel: true, custo: abaixo.custo + taxa, est: abaixo.est,
          acoes: abaixo.acoes.concat([{ tier, tipo: 'fundir', qtd: n, custo: taxa, de: this.TIERS[idx - 1], consome: n * regra.need }])
        };
      };

      // Caminho B: fundir tudo (comprando matéria-prima abaixo se precisar).
      const fundirTudo = fundirQtd(precisa, estBase);

      // Caminho C: fundir só o que o estoque de baixo cobre sozinho e resolver o resto
      // separado. É esse ramo que produz o "funde 3, compra 2" quando o estoque não dá pra
      // tudo mas jogar fora o que tem também seria desperdício.
      let misto = null;
      const capacidade = this._capacidadeDoEstoque(estBase);
      const deGraca = Math.min(precisa, Math.floor(capacidade[idx - 1] / regra.need));
      if (deGraca > 0 && deGraca < precisa) {
        const parte = fundirQtd(deGraca, estBase);
        if (parte.possivel) {
          const resto = resolver(idx, precisa - deGraca, parte.est);
          if (resto.possivel) {
            misto = { possivel: true, custo: parte.custo + resto.custo, acoes: parte.acoes.concat(resto.acoes), est: resto.est };
          }
        }
      }

      return juntar(melhor(melhor(comprar, fundirTudo), misto));
    };

    const r = resolver(alvoIdx, qtd, { ...estoque });
    return { possivel: r.possivel, custoTotal: r.custo, acoes: r.acoes, faltou: r.faltou, estoqueDepois: r.est };
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
            ${this.TIERS.slice(0, -1).map((tier, i) => {
              const regra = this.mergeCosts[tier];
              return `<tr>
              <td>${this.TIER_EMOJI[tier]} → ${this.TIER_EMOJI[this.TIERS[i + 1]]}</td>
              <td><strong>${regra.need}</strong> ${this.getTierName(tier)}</td>
              <td>${regra.cost} RLT</td>
            </tr>`;
            }).join('')}
          </table>
          <p class="rates-note">
            ℹ️ Taxas iguais para Fan, Wire e Hashboard, e sem desconto.  Se a sua conta tiver desconto de merge, o jogo mostra o valor riscado e você paga menos que o calculado aqui.
          </p>
        </div>
      </div>

      <div id="resultadoMergeCalc"></div>

      <hr class="merge-separator">

      <!-- SEÇÃO 2: ROTA MAIS BARATA -->
      <h3>🎯 Quero N peças, qual o jeito mais barato?</h3>
      <div class="info-box-blue">
        <p>
          Compara <strong>usar o que você já tem</strong>, <strong>fundir de baixo pra cima</strong> e <strong>comprar pronta no marketplace</strong>, degrau por degrau, e monta a rota mais barata.  Pode misturar: se compensar, ele diz pra fundir uma parte e comprar o resto.
        </p>
        ${this._avisoFontesHtml()}
      </div>

      <div class="summary-item">
        <h4>🎯 Seu Objetivo</h4>
        <div class="merge-grid-3">
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

        <button onclick="UI_MergeCalculator.calcularRotaBarata()" class="btn-calc-reverse">
          🔍 Achar rota mais barata
        </button>
      </div>

      <div id="resultadoReverso"></div>
    `;
  },

  // Diz de onde vêm os dois insumos do cálculo (estoque e preços), porque sem eles a resposta
  // muda de sentido: sem estoque ele assume que você não tem nada, sem preço ele não pode
  // sequer considerar comprar pronta.
  _avisoFontesHtml: function() {
    const temEstoque = typeof UI_Inventario !== 'undefined' && UI_Inventario.partsCached
      && Object.keys(UI_Inventario.partsCached).length > 0;
    const quando = localStorage.getItem('rollercoin_prices_update');
    const linhas = [];
    linhas.push(temEstoque
      ? '✅ Usando o <strong>seu estoque de peças</strong> da aba Inventário.'
      : '⚠️ Sem <strong>estoque de peças</strong> colado na aba Inventário, o cálculo assume que você não tem nenhuma peça.');
    linhas.push(quando
      ? `✅ Usando <strong>preços do marketplace</strong> de ${new Date(quando).toLocaleString('pt-BR')}.`
      : '⚠️ Sem <strong>preços do marketplace</strong> colados na aba Inventário, só dá pra considerar fundir, nunca comprar pronta.');
    return `<p class="parts-fontes">${linhas.join('<br>')}</p>`;
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
        const finalTier = mergeChain[mergeChain.length - 1].to;
        const finalQty = mergeChain[mergeChain.length - 1].outputQty;
        const precoUnit = this._precoMercado(finalTier, part.name);
        const custoComprar = precoUnit != null ? precoUnit * finalQty : null;
        results.push({
          ...part,
          chain: mergeChain,
          chainCost: chainCost,
          finalTier: finalTier,
          finalQty: finalQty,
          precoUnitMercado: precoUnit,
          custoComprarPronta: custoComprar
        });
        totalCost += chainCost;
      }
    });

    if (typeof Analytics !== 'undefined') Analytics.partsCalculado('normal', results.length);
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
      `;

      // Comparação com o mercado: fundir do zero até raridade alta pode custar mais que
      // comprar pronta (a taxa de fusão sobe muito rápido a cada raridade). Só mostra quando
      // o usuário colou preços na aba Inventário, senão fica sem base real de comparação.
      if (result.custoComprarPronta != null) {
        const fundirMaisCaro = result.chainCost > result.custoComprarPronta;
        html += `
          <div class="merge-market-compare ${fundirMaisCaro ? 'pior' : 'melhor'}">
            ${fundirMaisCaro
              ? `⚠️ Comprar pronta sairia mais barato: <strong>${result.custoComprarPronta.toFixed(2)} RLT</strong> por ${result.finalQty}× (contra ${result.chainCost.toFixed(2)} RLT fundindo).`
              : `✅ Fundir sai mais barato que comprar pronta (que custaria ${result.custoComprarPronta.toFixed(2)} RLT por ${result.finalQty}×).`}
          </div>
        `;
      }

      html += `
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
        <h4>💡 Fundir nem sempre é mais barato</h4>
        <p>
          A taxa de fusão sobe rápido a cada raridade (fundir até Legendary custa bem mais que os passos anteriores somados), então pra raridade alta comprar pronta no marketplace pode sair mais barato que fundir do zero.<br>
          📊 Cole os preços do marketplace na aba <strong>Inventário</strong> pra ver a comparação real em cada peça acima.<br>
          💰 Common não tem esse comparativo porque a RollerCoin tirou essa peça do marketplace, só dá pra conseguir fundindo.
        </p>
      </div>
    `;

    resultDiv.innerHTML = html;
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // ========== ROTA MAIS BARATA ==========
  calcularRotaBarata() {
    this._carregarPrecos();
    const parts = [
      { type: 'fan', emoji: '🌀', name: 'Fan',
        targetTier: document.getElementById('fanTargetTier').value,
        quantity: parseInt(document.getElementById('fanTargetQty').value) || 0 },
      { type: 'wire', emoji: '🔌', name: 'Wire',
        targetTier: document.getElementById('wireTargetTier').value,
        quantity: parseInt(document.getElementById('wireTargetQty').value) || 0 },
      { type: 'hashboard', emoji: '💾', name: 'Hashboard',
        targetTier: document.getElementById('hashTargetTier').value,
        quantity: parseInt(document.getElementById('hashTargetQty').value) || 0 }
    ];

    const selecionadas = parts.filter(p => p.targetTier && p.quantity > 0);
    const resultDiv = document.getElementById('resultadoReverso');

    if (selecionadas.length === 0) {
      resultDiv.innerHTML = `
        <div class="info-box-red">
          <h4>⚠️ Nenhuma Peça Selecionada</h4>
          <p>Escolha pelo menos uma peça, a raridade que você quer e a quantidade.</p>
        </div>
      `;
      return;
    }

    const resultados = selecionadas.map(p => ({
      ...p,
      rota: this._rotaMaisBarata(p.name, p.targetTier, p.quantity, this._estoqueDe(p.name))
    }));

    if (typeof Analytics !== 'undefined') Analytics.partsCalculado('rota', resultados.length);
    this.mostrarRotaBarata(resultados);
  },

  mostrarRotaBarata(resultados) {
    const resultDiv = document.getElementById('resultadoReverso');
    const emo = this.TIER_EMOJI;
    let total = 0;
    let algumImpossivel = false;

    let html = '<div class="info-box-green"><h3>🎯 Rota mais barata</h3>';

    resultados.forEach(r => {
      const rota = r.rota;
      if (!rota) return;
      if (rota.possivel) total += rota.custoTotal;
      else algumImpossivel = true;

      html += `
        <div class="reverse-result-card">
          <div class="merge-result-header">
            <div>
              <h4 class="merge-result-title">${r.emoji} ${r.quantity}× ${emo[r.targetTier]} ${this.getTierName(r.targetTier)} ${r.name}</h4>
            </div>
            <div>
              <span class="merge-cost-badge">${rota.possivel ? rota.custoTotal.toFixed(4) + ' RLT' : 'não dá'}</span>
            </div>
          </div>
      `;

      if (!rota.possivel) {
        const f = rota.faltou;
        html += `
          <div class="merge-market-compare pior">
            ⚠️ Não dá pra chegar lá: faltam <strong>${f ? f.qtd.toLocaleString('pt-BR') + '× ' + this.getTierName(f.tier) : 'peças'}</strong> e essa raridade não está à venda no marketplace, então só fundindo, mas seu estoque não cobre.
          </div>
        `;
      } else {
        html += '<div class="rota-passos">';
        rota.acoes.forEach(a => {
          if (a.tipo === 'estoque') {
            html += `
              <div class="rota-passo rota-estoque">
                <span class="rota-passo-icone">📦</span>
                <span class="rota-passo-texto">Use <strong>${a.qtd.toLocaleString('pt-BR')}× ${emo[a.tier]} ${this.getTierName(a.tier)}</strong> que você já tem</span>
                <span class="rota-passo-custo">grátis</span>
              </div>
            `;
          } else if (a.tipo === 'comprar') {
            html += `
              <div class="rota-passo rota-comprar">
                <span class="rota-passo-icone">🛒</span>
                <span class="rota-passo-texto">Compre <strong>${a.qtd.toLocaleString('pt-BR')}× ${emo[a.tier]} ${this.getTierName(a.tier)}</strong> no marketplace <span class="dim">(${a.precoUnit} RLT cada)</span></span>
                <span class="rota-passo-custo">${a.custo.toFixed(4)} RLT</span>
              </div>
            `;
          } else {
            html += `
              <div class="rota-passo rota-fundir">
                <span class="rota-passo-icone">🔩</span>
                <span class="rota-passo-texto">Funda <strong>${a.qtd.toLocaleString('pt-BR')}× ${emo[a.tier]} ${this.getTierName(a.tier)}</strong> <span class="dim">(consome ${a.consome.toLocaleString('pt-BR')}× ${this.getTierName(a.de)})</span></span>
                <span class="rota-passo-custo">${a.custo.toFixed(4)} RLT</span>
              </div>
            `;
          }
        });
        html += '</div>';

        // Comparação com os dois extremos ("só comprar" e "só fundir do zero"), mesmo quando
        // a rota escolhida É um deles: sem isso, quem não tem estoque via só "compre tudo"
        // sem saber se fundir do zero teria sido pior, e quanto.
        const soComprar = this._precoMercado(r.targetTier, r.name);
        if (soComprar != null) {
          const custoSoComprar = soComprar * r.quantity;
          const dif = custoSoComprar - rota.custoTotal;
          if (dif > 0.0001) {
            html += `<p class="rota-economia">💡 Comprar tudo pronto custaria ${custoSoComprar.toFixed(2)} RLT, essa rota economiza <strong>${dif.toFixed(2)} RLT</strong>.</p>`;
          } else if (dif < -0.0001) {
            html += `<p class="rota-economia pior">⚠️ Comprar tudo pronto seria mais barato: ${custoSoComprar.toFixed(2)} RLT, <strong>${Math.abs(dif).toFixed(2)} RLT</strong> a menos que essa rota.</p>`;
          }
        }
        const custoFundirTudo = this._custoFundirPuro(r.targetTier, r.quantity);
        if (custoFundirTudo > 0) {
          const difF = custoFundirTudo - rota.custoTotal;
          if (difF > 0.0001) {
            html += `<p class="rota-economia">💡 Fundir tudo do zero custaria ${custoFundirTudo.toFixed(2)} RLT, essa rota economiza <strong>${difF.toFixed(2)} RLT</strong>.</p>`;
          } else if (difF < -0.0001) {
            html += `<p class="rota-economia pior">⚠️ Fundir tudo do zero seria mais barato: ${custoFundirTudo.toFixed(2)} RLT, <strong>${Math.abs(difF).toFixed(2)} RLT</strong> a menos que essa rota.</p>`;
          }
        }
      }

      html += '</div>';
    });

    html += `
        <div class="merge-total-box merge-total-box-reverse">
          <h3>💰 CUSTO TOTAL</h3>
          <p class="merge-total-value">${total.toFixed(4)} RLT</p>
          <p class="merge-total-subtitle">
            ${algumImpossivel ? 'Considerando só o que é possível conseguir' : `Pelo caminho mais barato entre fundir, comprar e usar o que você tem`}
          </p>
        </div>
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