// js/ui/minerMerge.js - MinerMerge: plano de merges/fusoes com base no inventario atual

const UI_MinerMerge = {
  mergeSortMode: 'efficiency',
  qualityFilter: 'all',
  pieceFilter: 'all',
  activeGroup: 'ready',
  budgetRLT: null,
  budgetRST: null,
  budgetSortMode: 'eficiencia',
  // Bloco "Explorar todos os merges" fica fechado por padrão, mas precisa lembrar que foi
  // aberto: qualquer clique em ordenar/filtrar/aba re-renderiza tudo, e sem isso ele fecharia
  // na cara do usuário no meio do uso.
  _explorarAberto: false,

  mostrar: function(user) {
    const div = document.getElementById('minermerge');
    if (!div) return;

    if (!UI_Inventario.minersCached) {
      div.innerHTML = '<div class="inv-box-yellow" style="margin-top:20px;">📦 Calcule seu inventário na aba <strong>Inventário</strong> primeiro para ver o plano de merges aqui.</div>';
      return;
    }

    const html = this.renderMergePlanner();
    div.innerHTML = html || '<div class="inv-box-blue" style="margin-top:20px;">Nenhum merge disponível com o inventário atual.</div>';
    ChipTooltip.init();
  },

  renderMergePlanner: function() {
    if (!UI_Inventario.minersCached) return '';
    const userData = State.getUserData();
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };

    let prontos = [];
    let faltaPartes = [];
    let faltaMiners = [];
    const totalRoomPower = this._totalRoomPower(userData);

    const categorize = (entry, info) => {
      if (info.podeFazer) prontos.push(entry);
      else if (info.ingredientes.filter(i => !i.ok).every(i => i.tipo === 'parte')) faltaPartes.push(entry);
      else if (info.ingredientes.some(i => i.tipo === 'miner' && !i.ok)) faltaMiners.push(entry);
    };

    // Miners do inventário (pelo menos 1 cópia para considerar)
    UI_Inventario.minersCached.forEach(m => {
      if (UI_Inventario.getTotalMinerCount(m) < 1) return;
      const info = UI_Inventario.getMergeInfoForMiner(m);
      if (!info) return;
      const { currentPowerHz, resultPowerHz } = info;
      const isolatedGain = resultPowerHz - currentPowerHz;
      const impactoReal = this._calcularImpactoReal(m, info, userData);
      const impactoPct = (impactoReal != null && totalRoomPower) ? (impactoReal / totalRoomPower) * 100 : null;
      const cadeia = this._calcularCadeia(m, info, userData);
      const alcance = this._calcularAlcanceReal(m, info, userData);
      categorize({ m, info, gain: impactoReal != null ? impactoReal : isolatedGain, isolatedGain, impactoReal, impactoPct, cadeia, alcance }, info);
    });

    // Miners apenas na sala (2+ instaladas, sem cópia no inventário)
    if (userData?.roomData?.miners) {
      const invNames = new Set(UI_Inventario.minersCached.map(m => m.name.toLowerCase() + '|' + m.level));
      const roomGroups = {};
      userData.roomData.miners.forEach(rm => {
        const label = rm.level_label || CONFIG.MINER_LEVELS[rm.level] || 'Common';
        const key = rm.name.toLowerCase() + '|' + label;
        if (!invNames.has(key)) roomGroups[key] = (roomGroups[key] || []).concat(rm);
      });
      Object.values(roomGroups).forEach(group => {
        if (group.length < 2) return;
        const rm = group[0];
        const label = rm.level_label || CONFIG.MINER_LEVELS[rm.level] || 'Common';
        const catalogData = APIData.findByName(rm.name).find(d => {
          const lbl = d.type === 'merge' ? (rarityMap[d.level] || 'Unknown') : (d.rarityGroup?.title || 'Common');
          return lbl === label;
        });
        if (!catalogData) return;
        const fakeM = {
          name: rm.name,
          power: rm.power,
          level: label,
          quantity: 0,
          cells: catalogData.width || 2,
          bonus: catalogData.bonusPower / 100 || 0,
          impacto: 0,
          catalogData: catalogData,
          isManual: false
        };
        const info = UI_Inventario.getMergeInfoForMiner(fakeM);
        if (!info) return;
        const { currentPowerHz, resultPowerHz } = info;
        const isolatedGain = resultPowerHz - currentPowerHz;
        const impactoReal = this._calcularImpactoReal(fakeM, info, userData);
        const impactoPct = (impactoReal != null && totalRoomPower) ? (impactoReal / totalRoomPower) * 100 : null;
        const cadeia = this._calcularCadeia(fakeM, info, userData);
        const alcance = this._calcularAlcanceReal(fakeM, info, userData);
        categorize({ m: fakeM, info, gain: impactoReal != null ? impactoReal : isolatedGain, isolatedGain, impactoReal, impactoPct, cadeia, alcance }, info);
      });
    }

    if (prontos.length === 0 && faltaPartes.length === 0 && faltaMiners.length === 0) return '';

    if (typeof Analytics !== 'undefined') {
      Analytics.mergePlannerVisto(prontos.length, faltaPartes.length, faltaMiners.length);
    }

    const sortEntries = (list) => {
      const mode = this.mergeSortMode;
      list.sort((a, b) => {
        if (mode === 'cost') {
          const ca = a.info.nextTier.price || 0;
          const cb = b.info.nextTier.price || 0;
          return ca - cb;
        }
        if (mode === 'efficiency') {
          const priceA = a.info.nextTier.price || 0;
          const priceB = b.info.nextTier.price || 0;
          // merges gratuitos ficam no topo; entre pagos, maior H/s por RLT primeiro
          if (priceA === 0 && priceB === 0) return b.gain - a.gain;
          if (priceA === 0) return -1;
          if (priceB === 0) return 1;
          return (b.gain / priceB) - (a.gain / priceA);
        }
        if (mode === 'chain') {
          // custo-benefício considerando a cadeia completa até o tier máximo, não só o
          // próximo passo — usa o único passo (gain/preço) quando não há cadeia adiante
          const effA = this._chainEfficiency(a);
          const effB = this._chainEfficiency(b);
          return effB - effA;
        }
        // gain (padrão)
        return b.gain - a.gain;
      });
    };

    sortEntries(prontos);
    sortEntries(faltaPartes);
    sortEntries(faltaMiners);

    // Atribui tier de qualidade comparando TODOS os merges juntos (não por categoria
    // separada) — senão um grupo pequeno (ex: 3 itens em "falta miners") dava "Ótimo" pro
    // menos ruim dos três só por posição relativa local, mesmo sendo medíocre no geral.
    // Piso absoluto: impacto real negativo/zero nunca vira "Ótimo"/"Ok" (tier 4, fora do
    // ranking); e mesmo positivo, só entra no top (tier 1/2) se o impacto real for
    // minimamente relevante (>= 0.01% do poder total) ou o merge for gratuito — só ficar
    // bem posicionado entre os outros não basta se o ganho em si for insignificante.
    // Exceção: se o passo isolado é negativo só por causa do recálculo do bônus de
    // coleção da sala inteira, mas a cadeia completa até o tier máximo fecha positiva,
    // não é justo marcar como "prejudica a sala" (tier 4) — vira tier 5, uma categoria
    // à parte (nem ranqueado como bom, nem como ruim de verdade).
    const PISO_RELEVANCIA_PCT = 0.01;
    const todos = [...prontos, ...faltaPartes, ...faltaMiners];
    if (todos.length > 0) {
      const negativos = todos.filter(e => e.impactoReal != null && e.impactoReal <= 0);
      const positivos = todos.filter(e => !(e.impactoReal != null && e.impactoReal <= 0));
      negativos.forEach(e => {
        const recupera = (e.alcance && e.alcance.impactoFinal > 0) || (e.cadeia && e.cadeia.finalImpacto > 0);
        e._tier = recupera ? 5 : 4;
      });

      const relevantes = positivos.filter(e => {
        const price = e.info.nextTier.price || 0;
        if (price === 0) return true;
        return e.impactoPct == null || Math.abs(e.impactoPct) >= PISO_RELEVANCIA_PCT;
      });
      const irrelevantes = positivos.filter(e => !relevantes.includes(e));
      irrelevantes.forEach(e => { e._tier = 3; }); // positivo mas insignificante: nunca melhor que "baixo valor"

      if (relevantes.length > 0) {
        const scored = relevantes.map(e => ({ e, score: this._qualityScore(e) }))
          .sort((a, b) => b.score - a.score);
        const n = scored.length;
        scored.forEach(({ e }, rank) => {
          const pct = rank / n;
          e._tier = pct < 0.25 ? 1 : pct < 0.6 ? 2 : 3;
        });
      }
    }

    // Tier 5 (cai no passo isolado mas recupera seguindo a cadeia/alcance real) sai das
    // categorias normais e vira aba própria — senão fica perdido lá embaixo da lista,
    // já que a maioria dos modos de ordenação empurra impacto negativo pro fim.
    const extrairRecuperaveis = (list) => {
      const recuperaveis = list.filter(e => e._tier === 5);
      const resto = list.filter(e => e._tier !== 5);
      return { recuperaveis, resto };
    };
    const exProntos = extrairRecuperaveis(prontos);
    const exPartes   = extrairRecuperaveis(faltaPartes);
    const exMiners    = extrairRecuperaveis(faltaMiners);
    prontos     = exProntos.resto;
    faltaPartes = exPartes.resto;
    faltaMiners = exMiners.resto;
    const recuperaCadeia = [...exProntos.recuperaveis, ...exPartes.recuperaveis, ...exMiners.recuperaveis];

    const filterByQuality = (list) => {
      if (this.qualityFilter === 'good')  return list.filter(e => e._tier === 1);
      if (this.qualityFilter === 'valid') return list.filter(e => e._tier <= 2);
      return list;
    };
    // Filtra por tipo de peça (Fan/Wire/Hashboard): mostra só merge que usa aquela peça como
    // ingrediente do próximo passo, útil quando você tem muito de um tipo só e quer focar
    // nele (ex: 300 mil Wire sobrando, sem nada de Fan/Hashboard).
    const filterByPeca = (list) => {
      if (this.pieceFilter === 'all') return list;
      return list.filter(e => (e.info?.ingredientes || []).some(
        ing => ing.tipo === 'parte' && ing.nome === this.pieceFilter
      ));
    };
    const prontosVis        = filterByPeca(filterByQuality(prontos));
    const faltaPartesVis    = filterByPeca(filterByQuality(faltaPartes));
    const faltaMinersVis    = filterByPeca(filterByQuality(faltaMiners));
    const recuperaCadeiaVis = filterByPeca(recuperaCadeia);

    const rarityEmoji = { 'Common': '⚪', 'Uncommon': '🟢', 'Rare': '🔵', 'Epic': '🟣', 'Legendary': '🟡', 'Unreal': '🔴' };
    const tierMeta = { 1: { cls: 'tier-good', label: '🟢 Ótimo' }, 2: { cls: 'tier-ok', label: '🟡 Ok' }, 3: { cls: 'tier-low', label: '🔴 Baixo valor' }, 4: { cls: 'tier-low', label: '⛔ Prejudica a sala' }, 5: { cls: 'tier-ok', label: '↩️ Recupera depois' } };

    // Linha compacta por merge: tudo que decide de cara sempre visível (imagem, níveis que
    // você tem, impacto real, custo); o resto (ingredientes, cadeia, alcance, power bruto)
    // fica dentro de um <summary>/<details> nativo, sem esconder nada que seja decisivo.
    const buildRow = (entry) => {
      const { m, info, impactoReal, impactoPct, cadeia, alcance } = entry;
      const { nextTier, ingredientes, tiers, userHasLevel, currentPowerHz, resultPowerHz, nextTierAlreadyOwned, currentDbEntry } = info;

      const imgUrl = m.catalogData?.imageUrl || nextTier.imageUrl || '';
      const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="${m.name}" class="merge-row-img">` : '';
      const nextLabel = nextTier.type === 'merge' ? (rarityMap[nextTier.level] || 'Lv' + nextTier.level) : (nextTier.rarityGroup?.title || 'Common');
      const badgeHtml = entry._tier ? `<span class="merge-quality-badge ${tierMeta[entry._tier].cls}">${tierMeta[entry._tier].label}</span>` : '';

      // níveis que possui — SEMPRE visível, compacto (sem tooltip completo, só o essencial)
      const levelsHtml = this._levelsChipsHtml(entry, userData);

      // resumo de decisão — impacto real + custo, sempre visível
      const priceRlt = nextTier.price ? (nextTier.price / 1000000).toFixed(2) : '0';
      // Passo isolado negativo é comum quando a miner trocada muda a chave "nome+nível" que
      // conta pro bônus de coleção da sala inteira — como esse bônus multiplica o poder de
      // TODOS os miners, uma variação pequena de percentual pode gerar queda líquida maior
      // que o ganho da própria miner só nesse passo, mesmo que continuar fundindo reverta
      // isso lá na frente. Prioriza o ALCANCE REAL (até onde dá pra chegar com as cópias que
      // você tem hoje) em vez da cadeia teórica até o tier máximo — não adianta prometer
      // recuperação no Unreal se você só consegue chegar no Legendary de fato.
      const recuperacao = (alcance && alcance.impactoFinal > 0)
        ? { label: alcance.label, impacto: alcance.impactoFinal, realista: true }
        : (cadeia && cadeia.finalImpacto > 0)
          ? { label: cadeia.finalLabel, impacto: cadeia.finalImpacto, realista: false }
          : null;
      const recuperaNaCadeia = impactoReal != null && impactoReal < 0 && recuperacao != null;
      let summaryHtml = '<div class="merge-row-metrics">';
      if (recuperaNaCadeia) {
        // Destaque vai pro resultado que importa (fechar a cadeia até onde dá pra chegar),
        // não pro mergulho passageiro do passo 1 — senão o vermelho rouba a cena e passa a
        // ideia errada de "não faça esse merge".
        const origem = recuperacao.realista ? 'com o que você tem hoje' : 'projeção teórica, pode não ser alcançável agora';
        const tip = `Fundir esse nível sozinho cai ${Utils.formatPowerSigned(impactoReal)} por causa do recálculo do bônus de coleção/rack da sala inteira — mas isso é temporário: continuando até ${recuperacao.label} (${origem}) o resultado reverte e fecha positivo.`;
        summaryHtml += `<span class="summary-chip" title="${tip}">📈 até ${recuperacao.label}: <strong style="color:#28a745;">${Utils.formatPowerSigned(recuperacao.impacto)}</strong>${recuperacao.realista ? '' : ' *'}</span>`;
        summaryHtml += `<span class="summary-chip dim">(passo 1 sozinho: ${Utils.formatPowerSigned(impactoReal)} ⓘ)</span>`;
      } else if (impactoReal != null) {
        const cor = impactoReal >= 0 ? '#28a745' : '#dc3545';
        const pctTxt = impactoPct != null ? ` <span class="dim">(${impactoPct >= 0 ? '+' : ''}${impactoPct.toFixed(2)}%)</span>` : '';
        summaryHtml += `<span class="summary-chip">🏠 <strong style="color:${cor};">${Utils.formatPowerSigned(impactoReal)}</strong>${pctTxt}</span>`;
      }
      summaryHtml += `<span class="summary-chip">💰 <strong>${priceRlt} RLT</strong></span>`;
      summaryHtml += '</div>';

      let html = '<details class="merge-row">';
      html += '<summary class="merge-row-summary">';
      html += '<span class="merge-row-caret">▸</span>';
      html += imgHtml;
      html += `<span class="merge-row-title">${m.name} <span class="dim">${m.level}</span> → <strong>${nextLabel}</strong></span>`;
      html += badgeHtml;
      html += levelsHtml;
      html += summaryHtml;
      html += '</summary>';

      html += '<div class="merge-row-body">';

      // power detalhado + bônus
      html += '<div class="merge-card-power">';
      html += `<span>${Utils.formatPower(currentPowerHz)}</span>`;
      html += '<span style="opacity:.5;">→</span>';
      html += `<span><strong>${Utils.formatPower(resultPowerHz)}</strong></span>`;
      html += `<span class="gain">+${Utils.formatPower(resultPowerHz - currentPowerHz)}</span>`;
      if (nextTier.bonusPower) {
        const curBonus  = ((currentDbEntry?.bonusPower  || 0) / 100).toFixed(2);
        const nextBonus = (nextTier.bonusPower / 100).toFixed(2);
        const diffBonus = ((nextTier.bonusPower - (currentDbEntry?.bonusPower || 0)) / 100).toFixed(2);
        html += `<span style="opacity:.65; font-size:11px;">🎯 ${curBonus}% → ${nextBonus}% <strong style="color:#28a745;">+${diffBonus}%</strong> bônus</span>`;
      }
      const scoreText = this._formatScore(entry);
      if (scoreText) html += `<span class="dim" style="font-size:11px;margin-left:8px;">⚡ ${scoreText}</span>`;
      html += '</div>';

      // aviso de duplicado
      if (nextTierAlreadyOwned) {
        const { status: dupStatus, count: dupCount } = userHasLevel[nextTier.id] || { status: null, count: 1 };
        const onde = dupStatus === 'both' ? 'no inventário e na sala' : dupStatus === 'room' ? 'na sala' : 'no inventário';
        const minerIngredient = ingredientes.find(i => i.tipo === 'miner');
        const consumeDesc = minerIngredient ? minerIngredient.precisa + '× ' + m.level : '2× ' + m.level;
        html += `<div class="merge-alert">⚠️ Este merge consome <strong>${consumeDesc}</strong> e produz <strong>1 ${nextLabel}</strong>. Você já tem <strong>${dupCount} ${nextLabel}</strong> ${onde} — ficará com <strong>${dupCount + 1} ${nextLabel}s</strong>.</div>`;
      }

      // ingredientes
      const partesIngr = ingredientes.filter(i => i.tipo === 'parte');
      const totalPecas = partesIngr.reduce((s, i) => s + i.precisa, 0);
      const labelIngr  = totalPecas > 0
        ? `Ingredientes <span class="merge-parts-total">🔩 ${totalPecas} peça${totalPecas !== 1 ? 's' : ''}</span>`
        : 'Ingredientes';
      html += `<div class="merge-card-section-label">${labelIngr}</div>`;
      html += '<div class="merge-card-ingredients">';
      ingredientes.forEach(ing => {
        const label = ing.tipo === 'miner'
          ? `${ing.precisa}× ${ing.nome} (${ing.rarity})`
          : `${ing.precisa}× ${ing.rarity} ${ing.nome}`;
        const pct = Math.min(100, ing.precisa > 0 ? Math.round((ing.tem / ing.precisa) * 100) : 0);
        html += `<div class="merge-ingredient-chip ${ing.ok ? 'ok' : 'nok'}">`;
        html += `<span class="ing-label">${ing.ok ? '✅' : '❌'} ${label}</span>`;
        html += `<div class="ing-progress-wrap"><div class="ing-progress-fill" style="width:${pct}%"></div></div>`;
        html += `<span class="ing-fraction">${ing.tem}/${ing.precisa}</span>`;
        html += `</div>`;
      });
      html += '</div>';

      // projeção: cadeia completa + alcance real com o que você tem
      if (cadeia) {
        const corC = cadeia.finalImpacto >= 0 ? '#28a745' : '#dc3545';
        const custoRlt = (cadeia.totalCost / 1e6).toFixed(2);
        html += `<div class="merge-card-real-impact">🔗 Potencial até <strong>${cadeia.finalLabel}</strong> (${cadeia.stepsCount} merges, ${custoRlt} RLT): <strong style="color:${corC};">${Utils.formatPowerSigned(cadeia.finalImpacto)}</strong></div>`;
      }
      if (alcance) {
        const custoAlcanceRlt = (alcance.totalCost / 1e6).toFixed(2);
        const custoTxt = alcance.totalCost > 0 ? `${custoAlcanceRlt} RLT em fusões` : 'de graça';
        const corA = alcance.impactoFinal != null ? (alcance.impactoFinal >= 0 ? '#28a745' : '#dc3545') : null;
        const impactoTxt = alcance.impactoFinal != null ? `: <strong style="color:${corA};">${Utils.formatPowerSigned(alcance.impactoFinal)}</strong>` : '';
        html += `<div class="merge-card-real-impact">📦 Com suas <strong>${alcance.startQty}× ${m.level}</strong> hoje, dá pra fundir até <strong>${alcance.label}</strong> (${alcance.steps} merge${alcance.steps !== 1 ? 's' : ''}, sobrando ${alcance.qtyFinal}×), gastando ${custoTxt}${impactoTxt} <span class="real-impact-note" title="Peças extras exigidas em cada merge não são conferidas a partir do 2º passo — assume que você vai conseguir farmar/craftar o que faltar">ⓘ peças não conferidas além do 1º passo</span></div>`;
      }

      html += '</div></details>';
      return html;
    };

    const sortMode    = this.mergeSortMode;
    const filterMode  = this.qualityFilter;

    const groups = [
      { key: 'ready',    color: '#28a745', icon: '✅',  title: 'Prontos para merge', vis: prontosVis,        total: prontos,        empty: 'Nenhum merge disponível agora.' },
      { key: 'parts',    color: '#c2650a', icon: '🔩',  title: 'Falta só peças',     vis: faltaPartesVis,    total: faltaPartes,    empty: 'Nenhum merge nessa situação.' },
      { key: 'miners',   color: '#6c757d', icon: '⛏️', title: 'Miners não prontas', vis: faltaMinersVis,    total: faltaMiners,    empty: 'Nenhum merge nessa situação.' },
      { key: 'recupera', color: '#a07800', icon: '↩️',  title: 'Cai e recupera',     vis: recuperaCadeiaVis, total: recuperaCadeia, empty: 'Nenhum merge nessa situação.' },
    ];
    if (!groups.some(g => g.key === this.activeGroup) || groups.find(g => g.key === this.activeGroup).total.length === 0) {
      const primeiraComItens = groups.find(g => g.total.length > 0);
      this.activeGroup = primeiraComItens ? primeiraComItens.key : 'ready';
    }

    let html = '<div class="merge-planner">';
    html += '<div class="merge-planner-header">';
    html += '<h3 style="margin:0;">🔧 Plano de Merges</h3>';
    html += '</div>';
    html += '<p class="merge-planner-intro">Aqui você vê pra onde vale a pena fundir suas miners — considerando o efeito <strong>real</strong> na sua sala (bônus de coleção e rack incluídos), não só o power isolado do merge.</p>';
    html += '<details class="merge-card-details merge-planner-explainer"><summary>▸ Como isso funciona?</summary>';
    html += `<ul class="guia-tl-list" style="font-size:12px;">
      <li><strong>🏠 Impacto real</strong> — quanto o poder total da sua sala mudaria com aquele merge específico, recalculando o bônus de coleção (só a 1ª cópia de cada nível conta) e o bônus de rack. Pode ser diferente do ganho isolado da miner.</li>
      <li><strong>🔗 Cadeia completa</strong> — o potencial de seguir fundindo até o tier máximo daquela miner, não só o próximo passo, incluindo custo total em RLT.</li>
      <li><strong>📦 Alcance real</strong> — até onde você consegue chegar de fato com as cópias que já tem hoje (somando duplicatas que já possui nos níveis intermediários pelo caminho).</li>
      <li><strong>↩️ Recupera depois</strong> — às vezes o próximo passo isolado reduz o poder da sala (o bônus recalcula pra sala inteira), mas continuar a fundir reverte isso. Esses casos ganham aba própria em vez de ficarem escondidos no fim da lista.</li>
      <li><strong>Badges de qualidade</strong> (🟢 Ótimo / 🟡 Ok / 🔴 Baixo valor) — comparam TODOS os merges disponíveis entre si, não só dentro da categoria; e exigem um ganho minimamente relevante (não só barato) pra valer "Ótimo".</li>
    </ul>`;
    html += '</details>';

    // ===== 1. ORÇAMENTO =====
    // Vem primeiro porque é a ação principal da aba. Antes ficava depois dos controles de
    // ordenação/filtro da lista de exploração, então você configurava a lista de baixo antes
    // de chegar no que realmente resolve.
    html += '<div class="merge-etapa">';
    html += '<div class="merge-etapa-titulo">1. Quanto você tem</div>';
    html += this._budgetControlsHtml();
    html += '<div class="merge-etapa-nota">🎯 <strong>Rode o Auto-Otimizar no SmartRoom antes de decidir.</strong> Sem isso o plano compara os merges contra miners fracas que ainda ocupam vaga, e o ganho mostrado fica inflado. <button type="button" class="merge-goto-smartroom-btn" onclick="UI_Tabs.switchTo(\'roomplanner\')">Abrir SmartRoom →</button></div>';
    html += '</div>';

    // ===== 2. PLANO =====
    html += this._planoHtml(prontos, userData);

    // ===== 3. EXPLORAÇÃO (fechada por padrão) =====
    // Ordenação, filtros, abas e a lista completa vivem aqui dentro. Ficavam soltos no topo
    // competindo com o plano, e o "Ordenar por" daqui era confundido com o do plano.
    html += `<details class="merge-explorar"${this._explorarAberto ? ' open' : ''} ontoggle="UI_MinerMerge._explorarAberto = this.open">`;
    html += `<summary class="merge-explorar-summary">🔍 Explorar todos os merges <span class="dim">(${prontos.length + faltaPartes.length + faltaMiners.length + recuperaCadeia.length})</span></summary>`;
    html += '<div class="merge-explorar-corpo">';
    html += '<div class="merge-planner-warning">⚠️ O <strong>impacto real na sala</strong> mostrado em cada linha é estimado com base no último estado que você deixou na aba <strong>SmartRoom</strong>, a sala real ou a simulação otimizada, o que estiver ativo lá.</div>';
    html += '<div class="merge-planner-header">';
    html += '<div class="merge-header-controls">';
    html += '<div class="merge-sort-controls">';
    html += '<span style="font-size:12px;opacity:.6;margin-right:6px;">Ordenar por:</span>';
    const sortOptions = [
      { key: 'efficiency', label: '⚡ Custo-benefício', desc: 'Quem entrega mais poder real por RLT gasto. Não é só "o mais barato" — um merge caro pode vencer se o ganho compensar muito além da diferença de custo; ganhos irrisórios não sobem só por serem baratos.' },
      { key: 'chain',      label: '🔗 Cadeia completa', desc: 'Mesmo critério de custo-benefício, mas olhando o potencial de continuar fundindo até o tier máximo daquela miner, não só o próximo passo. Bom pra decidir se vale investir além do próximo merge.' },
      { key: 'gain',       label: '📈 Maior impacto real', desc: 'Ordena só pelo tamanho do ganho real na sala (do maior pro menor), sem levar o custo em RLT em conta — útil quando dinheiro não é o fator limitante.' },
      { key: 'cost',       label: '💰 Menor custo', desc: 'Do merge mais barato pro mais caro em RLT, ignorando o quanto cada um realmente ajuda — útil quando você quer gastar pouco, não importa o retorno.' },
    ];
    sortOptions.forEach(({ key, label, desc }) => {
      const active = sortMode === key;
      html += `<button class="merge-sort-btn${active ? ' active' : ''}" title="${desc}" onclick="UI_MinerMerge.setMergeSort('${key}')">${label}</button>`;
    });
    html += '</div>';
    const sortAtiva = sortOptions.find(o => o.key === sortMode);
    if (sortAtiva) html += `<div class="merge-sort-desc">${sortAtiva.label}: ${sortAtiva.desc}</div>`;
    html += '<div class="merge-sort-controls">';
    html += '<span style="font-size:12px;opacity:.6;margin-right:6px;">Filtrar:</span>';
    [
      { key: 'all',   label: 'Todos', desc: 'Mostra todos os merges, incluindo os de baixo valor ou que prejudicam a sala.' },
      { key: 'valid', label: '🟢🟡 Válidos', desc: 'Esconde merges de baixo valor e os que reduzem o poder da sala; mostra só os classificados como Ótimo ou Ok.' },
      { key: 'good',  label: '🟢 Ótimos', desc: 'Mostra só os melhores merges (badge 🟢 Ótimo) — os mais raros e com melhor retorno de verdade.' },
    ].forEach(({ key, label, desc }) => {
      const active = filterMode === key;
      html += `<button class="merge-sort-btn${active ? ' active' : ''}" title="${desc}" onclick="UI_MinerMerge.setQualityFilter('${key}')">${label}</button>`;
    });
    html += '</div>';
    html += '<div class="merge-sort-controls">';
    html += '<span style="font-size:12px;opacity:.6;margin-right:6px;">Peça:</span>';
    [
      { key: 'all',       label: 'Todas', desc: 'Mostra merge de qualquer peça.' },
      { key: 'Fan',       label: '🌀 Fan', desc: 'Só merges que usam Fan como ingrediente do próximo passo.' },
      { key: 'Wire',      label: '🔌 Wire', desc: 'Só merges que usam Wire como ingrediente do próximo passo.' },
      { key: 'Hashboard', label: '💾 Hashboard', desc: 'Só merges que usam Hashboard como ingrediente do próximo passo.' },
    ].forEach(({ key, label, desc }) => {
      const active = this.pieceFilter === key;
      html += `<button class="merge-sort-btn${active ? ' active' : ''}" title="${desc}" onclick="UI_MinerMerge.setPieceFilter('${key}')">${label}</button>`;
    });
    html += '</div></div></div>';


    // Tabs em vez de 3 colunas lado a lado: só uma categoria por vez, menos informação de
    // uma vez só na tela — o usuário escolhe onde focar.
    html += '<div class="merge-tabs">';
    groups.forEach(g => {
      const active = this.activeGroup === g.key;
      const countLabel = g.vis.length < g.total.length ? `${g.vis.length}/${g.total.length}` : `${g.total.length}`;
      html += `<button type="button" class="merge-tab${active ? ' active' : ''}" style="--tab-color:${g.color};" onclick="UI_MinerMerge.setGroup('${g.key}')">${g.icon} ${g.title} <span class="merge-tab-count">${countLabel}</span></button>`;
    });
    html += '</div>';

    const activeG = groups.find(g => g.key === this.activeGroup);
    if (activeG.key === 'recupera') {
      html += '<div class="merge-planner-warning">↩️ Esses merges reduzem o poder da sala nesse passo isolado (o bônus de coleção recalcula pra sala inteira), mas seguir fundindo até o tier indicado em "recupera até X" reverte isso e fecha positivo. Cada linha mostra se esse alcance é realista com o que você tem hoje ou só uma projeção teórica.</div>';
    }
    html += '<div class="merge-rows">';
    if (activeG.vis.length === 0) {
      html += `<p style="opacity:.5; font-size:13px;">${activeG.total.length > 0 ? 'Nenhum visível com o filtro atual.' : activeG.empty}</p>`;
    } else {
      activeG.vis.forEach(e => { html += buildRow(e); });
    }
    html += '</div>';

    html += '</div></details>'; // fecha merge-explorar-corpo + merge-explorar
    html += '</div>';
    return html;
  },

  // Impacto real de "trocar" a miner atual por outro nível/tier no poder total da sala:
  // remove 1 unidade do nível atual do pool instalado (se houver) e adiciona 1 unidade
  // do nível alvo, recalculando bônus de coleção (só a primeira cópia de cada nível
  // conta) e bônus de rack — mesma fórmula usada no banco do SmartRoom (roomPlanner.js
  // _anexarImpactoBanco), mas como troca em vez de soma pura, já que a miner atual
  // normalmente é consumida no merge.
  // O pool usado é sempre UI_RoomPlanner.sim (garantido inicializado aqui se ainda não
  // estiver) — reflete o último estado que o usuário deixou no SmartRoom, seja a sala
  // real (espelhada automaticamente) ou uma simulação/otimização que ele tenha feito lá.
  _calcularImpactoTroca: function(m, targetLabel, targetPowerHz, targetBonusPower, userData, qtdDaSala) {
    const ctx = this._roomCalcContext(userData);
    if (!ctx) return null;
    const { poolOriginal, calcPoder, rackFactorMap } = ctx;

    // Entre várias cópias instaladas do nível atual (mesma miner/nível em racks
    // diferentes), escolhe pra "sacrificar" na simulação a que está no rack de MENOR
    // bônus — é o que você faria na prática. Escolher a primeira que aparecesse no array
    // (ordem arbitrária) podia acidentalmente sacrificar a cópia no seu MELHOR rack,
    // fazendo um merge claramente positivo (poder bruto sobe bastante) aparecer negativo
    // só porque a simulação perdeu um bônus de rack que na vida real você não perderia.
    // Quantas cópias saem DA SALA. Antes era sempre 1, o que errava nos dois sentidos: se o
    // merge consome 2 da sala, superestimava o ganho (só descontava uma); se consome tudo do
    // inventário, desinstalava uma à toa e subestimava. `qtdDaSala` vem de quem chama, que
    // sabe a receita e o estoque; sem ele, mantém o comportamento antigo de 1.
    const quantasRemover = Math.max(0, qtdDaSala == null ? 1 : qtdDaSala);

    // Entre várias cópias instaladas, sacrifica sempre as de MENOR bônus de rack primeiro,
    // que é o que se faria na prática.
    const candidatas = [];
    poolOriginal.forEach((mm, i) => {
      if (mm.name.toLowerCase() !== m.name.toLowerCase() || String(mm.level || '').toLowerCase() !== String(m.level).toLowerCase()) return;
      candidatas.push({ i, fator: rackFactorMap[mm._rackId] || 0 });
    });
    candidatas.sort((a, b) => a.fator - b.fator);
    const remover = candidatas.slice(0, quantasRemover);

    // rackDaNova só recebe um rack se alguma cópia saiu da sala: a nova unidade herda o rack
    // da melhor que saiu, então o bônus de rack dela entra no cálculo. Se nada saiu (consumiu
    // só do inventário), rackDaNova fica undefined: rackFactorMap[undefined] é undefined, o
    // `|| 0` em calcPoder zera esse termo, e o resultado usa só poder base + bônus de coleção.
    let rackDaNova;
    if (remover.length) {
      rackDaNova = poolOriginal[remover[remover.length - 1].i]._rackId;
    }
    const idxParaRemover = new Set(remover.map(r => r.i));
    const poolDepois = poolOriginal.filter((_, i) => !idxParaRemover.has(i));
    poolDepois.push({
      name: m.name,
      level: targetLabel,
      power: targetPowerHz / 1e9,
      bonus_percent: targetBonusPower || 0,
      _rackId: rackDaNova,
    });

    const poderAntes = calcPoder(poolOriginal);
    const poderDepois = calcPoder(poolDepois);
    return (poderDepois - poderAntes) * 1e9;
  },

  // Contexto compartilhado (pool instalado + função de cálculo de poder) usado tanto pela
  // troca de uma miner quanto pelo poder total da sala — evita duplicar a fórmula de bônus.
  _roomCalcContext: function(userData) {
    if (typeof UI_RoomPlanner === 'undefined' || !userData?.roomData?.racks) return null;
    if (!UI_RoomPlanner.sim) return null;

    UI_RoomPlanner.sim.garantirInicializado(userData);
    const poolOriginal = Object.values(UI_RoomPlanner.sim.rackAssignments || {}).flat();

    const racks = userData.roomData.racks || [];
    const rackFactorMap = {};
    racks.forEach(r => rackFactorMap[r._id] = (r.bonus || 0) / 10000);
    const extras = (userData.powerData.games || 0) + (userData.powerData.temp || 0);

    // Bônus de SET (ex: Royal Set) reaproveita a função do roomPlanner em vez de duplicar ,
    // é tudo-ou-nada por faixa máxima e só conta peça instalada no rack temático do próprio
    // set (ver comentário de _calcularBonusDeSetsNoPool). Sem isso, uma peça de set com
    // poder base baixo (mas que seria a diferença entre o set completo e quebrado) aparecia
    // com impacto real artificialmente pequeno em qualquer cálculo daqui, inclusive no piso
    // do plano por orçamento, que chegou a escolher uma peça de set assim como "a mais fraca
    // instalada" só porque a perda de bônus de set dela não estava sendo contada.
    const calcPoder = (pool) => {
      const base = pool.reduce((s, mm) => s + mm.power, 0);
      const chaves = new Set();
      let bonusPct = 0;
      pool.forEach(mm => {
        const key = mm.name.toLowerCase() + '|' + String(mm.level || '').toLowerCase();
        if (!chaves.has(key)) { chaves.add(key); bonusPct += (mm.bonus_percent || 0) / 10000; }
      });
      const rackBonus = pool.reduce((s, mm) => s + mm.power * (rackFactorMap[mm._rackId] || 0), 0);
      const bonusDeSets = UI_RoomPlanner._calcularBonusDeSetsNoPool(pool, base, racks);
      return base + base * bonusPct + rackBonus + bonusDeSets.percent + bonusDeSets.flat + extras;
    };

    return { poolOriginal, calcPoder, rackFactorMap };
  },

  // Poder total atual da sala (H/s), usado para expressar o impacto de um merge como
  // percentual do que o usuário já tem — deixa claro quando um ganho é insignificante
  // mesmo com boa relação custo-benefício absoluta.
  _totalRoomPower: function(userData) {
    const ctx = this._roomCalcContext(userData);
    if (!ctx) return null;
    return ctx.calcPoder(ctx.poolOriginal) * 1e9;
  },

  // Impacto real (H/s) da miner instalada mais fraca hoje, não o poder BRUTO dela, mas
  // quanto a sala perde se essa cópia específica sair (mesma métrica de _calcularImpactoTroca,
  // já descontando bônus de coleção/rack). Uma peça Legendary de bônus % alto pode ter poder
  // bruto baixo mas impacto real relevante, então comparar bruto contra bruto (como a 1ª
  // versão fazia) sub-representava peças assim, o piso certo é impacto contra impacto.
  // Usado como "piso" real de uso: um merge cujo impacto real fica abaixo do que a pior peça
  // já instalada hoje contribui não compete de verdade por espaço na sala, então tende a
  // ficar encalhado no banco em vez de ser instalado de fato.
  // Fração da mediana abaixo da qual uma miner instalada é tratada como LASTRO, não como
  // piso de verdade. Vem de um caso real: o usuário instala miners propositalmente fraquíssimas
  // pra ocupar célula sem empurrar o poder (evitando subir de liga sem querer). Usar o mínimo
  // absoluto fazia essas peças definirem o piso, e o filtro parava de filtrar: numa conta real,
  // 8 miners de 12 a 23 Ph/s derrubavam o piso pra 0,012 Eh/s enquanto o resto da sala vivia
  // entre 9 e 24 Eh/s. O vão entre lastro e miner real é enorme (150x nesse caso), então um
  // corte por fração da mediana separa os dois grupos com folga.
  _FRACAO_LASTRO: 0.10,

  _impactoMinimoInstalado: function(userData) {
    const ctx = this._roomCalcContext(userData);
    if (!ctx || !ctx.poolOriginal.length) return null;
    const { poolOriginal, calcPoder } = ctx;
    const poderComTudo = calcPoder(poolOriginal);
    const impactos = poolOriginal
      .map(mm => (poderComTudo - calcPoder(poolOriginal.filter(x => x !== mm))) * 1e9)
      .sort((a, b) => a - b);
    if (!impactos.length) return null;

    const mediana = impactos[Math.floor(impactos.length / 2)];
    const corteLastro = mediana * this._FRACAO_LASTRO;
    // Piso = a mais fraca que NÃO é lastro. Se por acaso tudo cair abaixo do corte (sala só
    // de peças fracas), cai no mínimo absoluto pra não devolver piso nulo.
    const semLastro = impactos.filter(i => i >= corteLastro);
    return semLastro.length ? semLastro[0] : impactos[0];
  },

  // Impacto real específico do merge (m → nextTier), usado no card e na ordenação.
  // Chips compactos de "quais níveis você já tem" (✅ inventário / 🏠 sala / ❌ nada), com
  // tooltip de poder/bônus/custo/impacto por raridade. Extraído de buildRow pra reaproveitar
  // no plano por orçamento: lá o modo "cadeia" só mostrava os ingredientes do 1º passo, sem
  // deixar claro o que já estava pronto nos níveis seguintes até o alvo.
  _levelsChipsHtml: function(entry, userData) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const rarityEmoji = { 'Common': '⚪', 'Uncommon': '🟢', 'Rare': '🔵', 'Epic': '🟣', 'Legendary': '🟡', 'Unreal': '🔴' };
    const { m, info, impactoReal } = entry;
    const { nextTier, tiers, userHasLevel } = info;

    let html = '<div class="merge-row-levels">';
    tiers.forEach(t => {
      const lbl = t.type === 'merge' ? (rarityMap[t.level] || 'Lv' + t.level) : (t.rarityGroup?.title || 'Common');
      const { status, count } = userHasLevel[t.id] || { status: null, count: 0 };
      const isNext = t.id === nextTier.id;
      const chipClass = status === 'both' ? 'has-both' : status === 'inv' ? 'has-inv' : status === 'room' ? 'has-room' : 'missing';
      const statusIcon = status === 'both' ? '✅🏠' : status === 'inv' ? '✅' : status === 'room' ? '🏠' : '❌';
      const rarityDot = rarityEmoji[lbl] || '';
      const countBadge = count > 0 ? `×${count}` : '';
      const statusTip = status === 'both' ? `No inventário e instalada na sala (${count}×)` : status === 'inv' ? `No inventário (${count}×)` : status === 'room' ? `Instalada na sala (${count}×)` : 'Não possui';
      const powerVal = Utils.formatPower(t.power * 1e9);
      const bonusVal = t.bonusPower ? `${(t.bonusPower / 100).toFixed(2)}%` : '';
      const costVal = t.price ? `${(t.price / 1e6).toFixed(2)} RLT` : (t.level > 0 ? 'gratuito' : '');
      const partsEncoded = (t.craftRecipe || []).map(r => `${r.name}|${r.rarity || ''}|${r.count}`).join('~');
      const tierImpacto = isNext ? impactoReal : this._calcularImpactoTroca(m, lbl, t.power * 1e9, t.bonusPower, userData);
      const impactAttr = tierImpacto != null
        ? ` data-tip-impact="${Utils.formatPowerSigned(tierImpacto)} (estimado, sala/SmartRoom)"`
        : '';
      html += `<span class="merge-level-chip mini ${chipClass}${isNext ? ' next-tier' : ''}" data-tip-status="${statusTip}" data-tip-power="${powerVal}" data-tip-bonus="${bonusVal}" data-tip-cost="${costVal}" data-tip-parts="${partsEncoded}"${impactAttr}>${statusIcon}${rarityDot}${countBadge}</span>`;
    });
    html += '</div>';
    return html;
  },

  _calcularImpactoReal: function(m, info, userData) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const { nextTier, resultPowerHz } = info;
    const nextLabel = nextTier.type === 'merge' ? (rarityMap[nextTier.level] || 'Unknown') : (nextTier.rarityGroup?.title || 'Common');
    return this._calcularImpactoTroca(m, nextLabel, resultPowerHz, nextTier.bonusPower, userData, this._quantasSaemDaSala(m, info));
  },

  // Quantas cópias precisam ser DESINSTALADAS pra fazer o merge: o que a receita pede menos o
  // que já está solto no inventário. Consumir do inventário não custa poder nenhum; só sai da
  // sala o que faltar depois disso.
  _quantasSaemDaSala: function(m, info) {
    const minerIng = (info.ingredientes || []).find(i => i.tipo === 'miner');
    if (!minerIng) return 0;
    const noInventario = m.quantity || 0;
    return Math.max(0, (minerIng.precisa || 0) - noInventario);
  },

  // Potencial da cadeia completa de merges a partir daqui (não só o próximo tier): soma o
  // custo de todos os merges até o tier máximo disponível e calcula o impacto real na sala
  // de chegar lá direto. Não valida se dá pra craftar cada etapa (é uma projeção), só ajuda
  // a enxergar se vale a pena continuar investindo nessa miner além do próximo passo.
  _calcularCadeia: function(m, info, userData) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const { tiers, currentDbEntry, currentPowerHz } = info;
    const scaleFactor = currentDbEntry.power > 0 ? currentPowerHz / currentDbEntry.power : 1;
    const futureTiers = tiers.filter(t => t.level > currentDbEntry.level).sort((a, b) => a.level - b.level);
    if (futureTiers.length <= 1) return null; // só o próximo tier, cadeia = merge atual

    const totalCost = futureTiers.reduce((s, t) => s + (t.price || 0), 0);
    const finalTier = futureTiers[futureTiers.length - 1];
    const finalLabel = finalTier.type === 'merge' ? (rarityMap[finalTier.level] || 'Unknown') : (finalTier.rarityGroup?.title || 'Common');
    const finalPowerHz = finalTier.power * scaleFactor;
    const finalImpacto = this._calcularImpactoTroca(m, finalLabel, finalPowerHz, finalTier.bonusPower, userData);
    if (finalImpacto == null) return null;

    return { totalCost, finalImpacto, stepsCount: futureTiers.length, finalLabel, finalPowerHz };
  },

  // Alcance real: com a quantidade que você REALMENTE tem do nível atual (inventário + sala),
  // até onde dá pra subir só fundindo cópias em cadeia, e quanto isso custaria em RLT de merge.
  // Em cada passo, soma às unidades produzidas pela cadeia as duplicatas que você JÁ possui
  // naquele tier intermediário (ex: já ter 1 Rare instalado entra na conta antes de decidir
  // se dá pra seguir pro Epic) — senão o cálculo ignora estoque real que ajudaria a continuar.
  // Só conta peças/ingredientes extras no primeiro passo (onde já sabemos se tem ou não); dos
  // passos seguintes em diante assume que as peças vão ser conseguidas — por isso o aviso no
  // card. Para de subir quando não sobra cópia suficiente pro próximo merge (2 em 2, etc.) ou
  // quando a receita do próximo tier não é feita a partir da mesma miner (ingrediente diferente).
  _calcularAlcanceReal: function(m, info, userData) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const { tiers, currentDbEntry, userHasLevel, currentPowerHz } = info;
    const startQty = userHasLevel[currentDbEntry.id]?.count || 0;
    if (startQty < 2) return null;

    const scaleFactor = currentDbEntry.power > 0 ? currentPowerHz / currentDbEntry.power : 1;
    const futureTiers = tiers.filter(t => t.level > currentDbEntry.level).sort((a, b) => a.level - b.level);
    let available = startQty, totalCost = 0, steps = 0, reachedTier = null, qtyFinal = 0;
    const passos = []; // detalhamento por etapa: de qual raridade pra qual, quantas fusões, custo

    for (const t of futureTiers) {
      if (!t.craftRecipe || !t.craftRecipe.length) break;
      const minerIng = t.craftRecipe.find(ing => ing.rarity === null || ing.rarity === undefined);
      if (!minerIng || minerIng.name.toLowerCase() !== m.name.toLowerCase()) break;
      const need = minerIng.count || 1;
      const produced = Math.floor(available / need);
      if (produced < 1) break;
      const custoEtapa = produced * (t.price || 0);
      totalCost += custoEtapa;
      const deLabel = steps === 0 ? m.level : passos[passos.length - 1].paraLabel;
      const paraLabel = t.type === 'merge' ? (rarityMap[t.level] || 'Unknown') : (t.rarityGroup?.title || 'Common');
      // Receita de PEÇAS deste passo (ingrediente com rarity preenchida; o de rarity nula é a
      // própria miner). Guardada aqui pra Etapa 2 conseguir cobrar as peças de todos os passos
      // da cadeia, não só do primeiro.
      const pecas = (t.craftRecipe || [])
        .filter(ing => ing.rarity !== null && ing.rarity !== undefined)
        .map(ing => ({ nome: ing.name, rarity: ing.rarity, count: ing.count || 0 }));
      passos.push({ deLabel, paraLabel, fusoes: produced, custo: custoEtapa, pecas });
      const ownedAtTarget = userHasLevel[t.id]?.count || 0;
      available = produced + ownedAtTarget;
      qtyFinal = available;
      steps++;
      reachedTier = t;
    }
    if (!reachedTier) return null;

    const label = reachedTier.type === 'merge' ? (rarityMap[reachedTier.level] || 'Unknown') : (reachedTier.rarityGroup?.title || 'Common');
    const finalPowerHz = reachedTier.power * scaleFactor;
    const impactoFinal = this._calcularImpactoTroca(m, label, finalPowerHz, reachedTier.bonusPower, userData);
    return { label, startQty, qtyFinal, totalCost, steps, impactoFinal, finalPowerHz, passos };
  },

  // Custo-benefício considerando a cadeia completa (H/s reais por RLT até o tier máximo).
  // Sem cadeia adiante (já é o tier final), cai no custo-benefício do próprio merge.
  _chainEfficiency: function(entry) {
    const price = entry.info.nextTier.price || 0;
    if (entry.cadeia) {
      if (entry.cadeia.totalCost === 0) return entry.cadeia.finalImpacto + 1e18;
      return entry.cadeia.finalImpacto / entry.cadeia.totalCost;
    }
    if (price === 0) return entry.gain + 1e18;
    return entry.gain / price;
  },

  // Score usado SÓ pra badge de qualidade (Ótimo/Ok/Baixo valor) — independente do modo de
  // ordenação escolhido pelo usuário. Gain/preço puro (o que _efficiencyScore usa pro modo
  // "custo-benefício") penaliza linearmente pelo custo: um merge que custa 16x mais mas
  // entrega quase 1000x mais poder real perdia pra um baratinho de ganho irrisório, porque
  // a razão pura só olha proporção, não o quanto RLT é (ou não) um recurso escasso aqui.
  // Usa raiz quadrada do preço em vez de preço linear — ainda penaliza gasto alto, mas não
  // afunda um merge só por custar proporcionalmente mais quando o ganho absoluto compensa
  // muito além disso.
  _qualityScore: function(entry) {
    const price = entry.info.nextTier.price || 0;
    const gain = entry.gain || 0;
    if (price === 0) return gain + 1e18;
    return gain / Math.sqrt(price);
  },

  // Score numérico usado pra ORDENAR a lista conforme o modo escolhido pelo usuário
  // (⚡ Custo-benefício / 🔗 Cadeia / 📈 Impacto / 💰 Custo). Gratuitos recebem bônus
  // enorme para ficarem sempre acima dos pagos.
  _efficiencyScore: function(entry) {
    const price = entry.info.nextTier.price || 0;
    const mode  = this.mergeSortMode;
    if (mode === 'cost') return price === 0 ? -Infinity : -price;
    if (mode === 'gain') return entry.gain;
    if (mode === 'chain') return this._chainEfficiency(entry);
    if (price === 0) return entry.gain + 1e18;
    return entry.gain / price;
  },

  // Texto de eficiência exibido no card (apenas em modo eficiência, para deixar claro o trade-off).
  // price está em microRLT no banco (1 RLT = 1 000 000); converte antes de exibir.
  _formatScore: function(entry) {
    if (this.mergeSortMode !== 'efficiency') return null;
    const price = entry.info.nextTier.price || 0;
    if (price === 0) return 'Gratuito ✨';
    if (!entry.gain) return null;
    const priceRlt = price / 1e6;
    return `${Utils.formatPower(entry.gain / priceRlt)} / RLT`;
  },

  // ===== Etapa 2: custo real das PEÇAS, não só a taxa de fusão da miner =====

  _PART_ORDER: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],

  // Taxas de fusão de peça vêm do Parts Calculator (fonte única), se aquele arquivo mudar a
  // tabela oficial, o plano acompanha sozinho. Fallback local só pra não quebrar se a aba
  // ainda não carregou.
  _taxasDePeca: function() {
    if (typeof UI_MergeCalculator !== 'undefined' && UI_MergeCalculator.mergeCosts) {
      return UI_MergeCalculator.mergeCosts;
    }
    return {
      common:   { need: 50, cost: 0.002 },
      uncommon: { need: 20, cost: 0.05 },
      rare:     { need: 10, cost: 0.75 },
      epic:     { need: 5,  cost: 1.6 },
    };
  },

  // Quanto vale cada raridade em peças Common, derivado das próprias receitas de fusão
  // (50 Common = 1 Uncommon, 20 Uncommon = 1 Rare, e assim por diante). Serve pra somar
  // matéria-prima de raridades diferentes num número só: contar "526 peças" quando uma delas
  // é Epic engana, porque aquele Epic sozinho vale 10.000 Common.
  _equivalenciaEmCommon: function() {
    const taxas = this._taxasDePeca();
    const ordem = this._PART_ORDER;
    const eq = { [ordem[0]]: 1 };
    for (let i = 1; i < ordem.length; i++) {
      const abaixo = ordem[i - 1];
      const regra = taxas[abaixo.toLowerCase()];
      eq[ordem[i]] = regra ? eq[abaixo] * regra.need : eq[abaixo];
    }
    return eq;
  },

  // Cascata de UMA peça: quanto custa (em RLT de taxa) obter `precisa` unidades de
  // `nome`/`rarity`, partindo do que existe em `estoque` e fundindo de baixo pra cima.
  //
  // Trabalha de cima pra baixo convertendo falta em matéria-prima: faltam N do alvo → precisa
  // de N×need do tier abaixo → o que não tiver lá vira falta naquele tier, e assim por diante
  // até Common. Se o Common não fechar sozinho, tenta cobrir com RST antes de desistir
  // (decisão do usuário: RST é mais fácil de conseguir que RLT, então usa sempre que der).
  // `rstDisponivel` é só consultado, nunca alterado aqui, quem chama decide se confirma o
  // gasto (mesmo motivo do estoque de peças: só compromete o que realmente entrar no plano).
  //
  // NÃO altera `estoque`: devolve `estoqueDepois` já com o consumo aplicado, pra quem chamou
  // decidir se aceita o gasto (o plano só confirma o consumo se o merge entrar de fato).
  _cascataDePeca: function(nome, rarity, precisa, estoque, rstDisponivel) {
    const ordem = this._PART_ORDER;
    const taxas = this._taxasDePeca();
    const est = { ...estoque };
    const chave = r => `${nome}|${r}`;
    const idx = ordem.indexOf(rarity);
    if (idx < 0) return { possivel: false, custoRLT: 0, estoqueDepois: est, passos: [], faltaQtd: precisa, faltaRarity: rarity, rstUsado: 0 };

    // Primeiro gasta o que já existe no próprio tier alvo.
    const temNoAlvo = est[chave(rarity)] || 0;
    const usarDoAlvo = Math.min(temNoAlvo, precisa);
    est[chave(rarity)] = temNoAlvo - usarDoAlvo;
    let produzir = precisa - usarDoAlvo;
    if (produzir <= 0) return { possivel: true, custoRLT: 0, estoqueDepois: est, passos: [], faltaQtd: 0, rstUsado: 0 };

    const passos = [];
    let custoRLT = 0;
    let rstUsado = 0;
    let rstSobra = rstDisponivel || 0;
    for (let i = idx; i >= 1; i--) {
      const abaixo = ordem[i - 1];
      const regra = taxas[abaixo.toLowerCase()];
      if (!regra) break;
      const precisaAbaixo = produzir * regra.need;
      custoRLT += produzir * regra.cost;
      // unshift: a lista final fica na ordem de execução (Common→Uncommon primeiro).
      passos.unshift({ de: abaixo, para: ordem[i], fusoes: produzir, custo: produzir * regra.cost });
      let temAbaixo = est[chave(abaixo)] || 0;

      // No tier mais baixo (Common), sem estoque suficiente, compra caixa antes de desistir.
      // Conta pelo MÍNIMO da caixa (250), então o RST estimado nunca fica de menos.
      if (abaixo === 'Common' && temAbaixo < precisaAbaixo && rstSobra > 0) {
        const faltaCommon = precisaAbaixo - temAbaixo;
        const caixas = Math.ceil(faltaCommon / this._CAIXA_TIPO.pecasMinimo);
        const custoCaixas = caixas * this._CAIXA_TIPO.rst;
        if (custoCaixas <= rstSobra) {
          rstUsado += custoCaixas;
          rstSobra -= custoCaixas;
          temAbaixo += caixas * this._CAIXA_TIPO.pecasMinimo;
        }
      }

      if (temAbaixo >= precisaAbaixo) {
        est[chave(abaixo)] = temAbaixo - precisaAbaixo;
        return { possivel: true, custoRLT, estoqueDepois: est, passos, faltaQtd: 0, rstUsado };
      }
      est[chave(abaixo)] = 0;
      produzir = precisaAbaixo - temAbaixo;
    }
    // Esgotou até o Common (mesmo com RST) e ainda falta matéria-prima.
    return { possivel: false, custoRLT, estoqueDepois: est, passos, faltaQtd: produzir, faltaRarity: ordem[0], rstUsado };
  },

  // Custo de TODAS as peças de um merge, consumindo de um estoque compartilhado. Consome
  // também as peças que já estão ✅: se o merge A gasta 66 mil Common Wire, esse estoque não
  // pode ser contado de novo pelo merge B do mesmo plano. `rstDisponivel` é o saldo de RST
  // que ainda sobra pro PLANO inteiro nesse ponto (as peças anteriores do mesmo merge já
  // descontam localmente antes da próxima).
  _custoDePecasDoMerge: function(pecasNecessarias, estoque, precos, rstDisponivel) {
    let est = { ...estoque };
    let rstRestante = rstDisponivel || 0;
    let custoRLT = 0;
    let custoCompra = 0;
    let rstGastoTotal = 0;
    const faltas = [];
    const detalhes = [];
    const compras = [];
    pecasNecessarias.forEach(p => {
      const r = this._cascataDePeca(p.nome, p.rarity, p.precisa, est, rstRestante);
      // O RST só é descontado se a fusão for MESMO o caminho escolhido (ver abaixo). Descontar
      // aqui, antes de decidir, vazava saldo: o plano marcava RST como gasto e depois comprava
      // a peça pronta, deixando menos RST pra quem viesse depois sem receber nada em troca.

      const precoUnit = this._precoDaPeca(precos, p.nome, p.rarity);
      const custoComprarTudo = precoUnit != null ? precoUnit * p.precisa : null;
      const usouRST = (r.rstUsado || 0) > 0;

      // Escolhe o caminho MAIS BARATO EM RLT (decisão do usuário). Quando existe alternativa
      // viável pelo outro caminho, ela vai junto em `alternativa` pra ser exibida lado a lado
      // no card, sem mudar o total do plano: quem decide caso a caso é o usuário na hora de
      // executar.
      const fundirViavel = r.possivel;
      const podeComprar = custoComprarTudo != null;
      const usaFundir = fundirViavel && (!podeComprar || r.custoRLT <= custoComprarTudo);

      if (usaFundir) {
        est = r.estoqueDepois;
        custoRLT += r.custoRLT;
        rstGastoTotal += r.rstUsado || 0;
        rstRestante -= (r.rstUsado || 0); // só agora o RST sai do saldo, porque foi usado
        if (r.passos.length || usouRST) {
          detalhes.push({
            nome: p.nome, rarity: p.rarity, precisa: p.precisa,
            passos: r.passos, custo: r.custoRLT, rstUsado: r.rstUsado || 0,
            // alternativa descartada: comprar pronta teria custado isso
            alternativa: podeComprar ? { via: 'comprar', rlt: custoComprarTudo, rst: 0 } : null,
          });
        }
        return;
      }
      if (podeComprar) {
        custoCompra += custoComprarTudo;
        compras.push({
          nome: p.nome, rarity: p.rarity, qtd: p.precisa, precoUnit, total: custoComprarTudo,
          motivo: fundirViavel ? 'mais barato' : 'fundir não fecha',
          // alternativa descartada: fundir teria custado isso (só faz sentido se era viável)
          alternativa: fundirViavel ? { via: 'fundir', rlt: r.custoRLT, rst: r.rstUsado || 0 } : null,
        });
        return; // não consome estoque nem RST: a peça vem do mercado
      }
      // Nem RST fechou, nem tem preço de mercado pra recorrer: falta mesmo.
      est = r.estoqueDepois;
      custoRLT += r.custoRLT;
      rstGastoTotal += r.rstUsado || 0;
      rstRestante -= (r.rstUsado || 0);
      faltas.push({ nome: p.nome, rarity: r.faltaRarity, qtd: r.faltaQtd });
    });
    // Consumo real de matéria-prima: a diferença entre o estoque que entrou e o que sobrou.
    // É o número que responde "quantas peças eu preciso ter pra fazer isso do começo ao fim",
    // que não dava pra ver antes: o card mostrava só a receita do 1º passo (ex: 70 Common
    // Wire) enquanto a cadeia inteira consumia 4.270, escondido dentro das linhas de fusão.
    const consumo = {};
    Object.keys(estoque).forEach(k => {
      const gasto = (estoque[k] || 0) - (est[k] || 0);
      if (gasto > 0) consumo[k] = gasto;
    });

    return {
      possivel: faltas.length === 0,
      custoRLT: custoRLT + custoCompra,
      custoFusao: custoRLT, custoCompra, rstGasto: rstGastoTotal,
      estoqueDepois: est, faltas, detalhes, compras, consumo,
    };
  },

  // Preço unitário de uma peça no marketplace, se o usuário informou. `precos` vem no formato
  // da aba vs Market: { common: { fan, wire, hashboard }, ... }, chaves minúsculas.
  _precoDaPeca: function(precos, nome, rarity) {
    // A RollerCoin tirou peça Common do marketplace, não dá mais pra comprar pronta.
    // Ignora qualquer preço salvo (pode ser resquício de antes da mudança) e força fundir/RST.
    if (String(rarity).toLowerCase() === 'common') return null;
    if (!precos) return null;
    const faixa = precos[String(rarity).toLowerCase()];
    if (!faixa) return null;
    const v = faixa[String(nome).toLowerCase()];
    return (typeof v === 'number' && v > 0) ? v : null;
  },

  // Lista de peças que um candidato do plano consome. No modo "próximo passo" são os
  // ingredientes do merge em si; no modo "cadeia" percorre todos os passos até o tier alvo,
  // multiplicando a receita de cada tier pela quantidade de fusões daquele passo, é isso que
  // fecha o buraco do "os demais passos não são conferidos" da Etapa 1.
  _pecasDoCandidato: function(c) {
    // Agrega por nome+raridade: uma cadeia pode pedir Common Fan em dois passos diferentes, e
    // tratar como duas exigências separadas duplicaria a linha na tela e faria duas cascatas
    // onde deveria ter uma só pelo total.
    const acc = new Map();
    const somar = (nome, rarity, precisa) => {
      const k = `${nome}|${rarity}`;
      acc.set(k, (acc.get(k) || 0) + precisa);
    };
    if (c.modo === 'cadeia' && c.entry.alcance && c.entry.alcance.passos) {
      c.entry.alcance.passos.forEach(p => {
        (p.pecas || []).forEach(pc => somar(pc.nome, pc.rarity, pc.count * p.fusoes));
      });
    } else {
      (c.entry.info.ingredientes || []).forEach(i => {
        if (i.tipo === 'parte') somar(i.nome, i.rarity, i.precisa);
      });
    }
    return Array.from(acc.entries()).map(([k, precisa]) => {
      const [nome, rarity] = k.split('|');
      return { nome, rarity, precisa };
    });
  },

  // RST serve pra uma coisa só neste plano: comprar caixa pra obter peça Common que falta.
  //
  // Usamos a **Parts Case** (100 RST) e contamos sempre o **mínimo** da tabela de sorteio
  // (250 peças), a pedido do usuário: como a quantidade é sorteada, planejar pelo piso garante
  // que o RST estimado é suficiente, nunca de menos.
  //
  // A Mega Parts Case (500 RST, 2 itens por caixa, mínimo 600 cada, tipo sorteado entre os 3)
  // fica de fora de propósito: pelo mesmo critério do mínimo, ela rende 1.200 peças mas só
  // ~1/3 é do tipo que você precisa (400 úteis), o que dá 1,25 RST por peça útil contra 0,40
  // da Parts Case. Como a Parts Case deixa você escolher o tipo, ela ganha sempre nesse
  // critério, e usar só uma caixa mantém a funcionalidade simples de entender.
  _CAIXA_TIPO: { rst: 100, pecasMinimo: 250 },

  // Quanto de RST as faltas custariam, via Parts Case do tipo que falta.
  _custoRSTdasFaltas: function(faltas) {
    const porTipo = {};
    faltas.forEach(f => {
      if (f.rarity !== 'Common') return; // caixa só entrega Common
      porTipo[f.nome] = (porTipo[f.nome] || 0) + f.qtd;
    });
    const tipos = Object.keys(porTipo);
    const totalCommon = tipos.reduce((s, t) => s + porTipo[t], 0);
    if (totalCommon <= 0) return { caixas: 0, rst: 0, totalCommon: 0, porTipo };

    const caixas = tipos.reduce((s, t) => s + Math.ceil(porTipo[t] / this._CAIXA_TIPO.pecasMinimo), 0);
    return { caixas, rst: caixas * this._CAIXA_TIPO.rst, totalCommon, porTipo };
  },

  // Preço de mercado só é usado quando o usuário realmente colou dados do marketplace (aba
  // Parts vs Market grava o timestamp). Sem isso, comparar "fundir x comprar pronto" seria
  // recomendar compra com preço chutado, então o plano simplesmente não compara.
  _precosDeMercado: function() {
    try {
      const salvos = localStorage.getItem('rollercoin_market_prices');
      const quando = localStorage.getItem('rollercoin_prices_update');
      if (!salvos || !quando) return null;
      return { precos: JSON.parse(salvos), atualizadoEm: quando };
    } catch (e) {
      return null;
    }
  },

  // Etapa 1 do planejador por orçamento: escolhe, pra cada merge pronto, entre fazer só o
  // próximo passo ou ir pela cadeia completa (até onde as cópias que você já tem permitem),
  // o que for melhor impacto/RLT, depois enche o orçamento em ordem de eficiência (guloso:
  // pula o que não cabe e tenta o próximo, não para no primeiro que estourar).
  // Garante que ter RST nunca piore o plano. O motivo: quando o RST viabiliza uma fusão, essa
  // fusão CONSOME estoque de peça Common compartilhado, e merges seguintes chegam com menos
  // estoque, tendo que comprar peça cara. Num caso real, 11.000 RST derrubavam o plano de 30
  // merges (+256 Eh/s) para 25 (+188 Eh/s). Como o guloso decide peça a peça sem enxergar esse
  // efeito adiante, a saída barata e robusta é rodar as duas hipóteses e ficar com a melhor.
  _gerarPlanoOrcamento: function(prontos, budgetRLT, userData, budgetRST) {
    const comRST = this._gerarPlanoInterno(prontos, budgetRLT, userData, budgetRST);
    if (!budgetRST || budgetRST <= 0) return comRST;
    const semRST = this._gerarPlanoInterno(prontos, budgetRLT, userData, 0);
    // Critério: maior ganho de poder. Empatou, fica com o que gasta menos RST.
    if (semRST.impactoTotal > comRST.impactoTotal) return semRST;
    if (semRST.impactoTotal === comRST.impactoTotal && semRST.rstTotal < comRST.rstTotal) return semRST;
    return comRST;
  },

  _gerarPlanoInterno: function(prontos, budgetRLT, userData, budgetRST) {
    const budgetMicro = budgetRLT * 1e6;
    const tetoRST = (budgetRST != null && budgetRST > 0) ? budgetRST : 0;
    // Só considera merges 🟢 Ótimo ou 🟡 Ok (_tier 1/2), não faz sentido o plano sugerir
    // gastar RLT num merge "🔴 Baixo valor" só porque ele cabe no orçamento; esses ficam de
    // fora mesmo que sobre dinheiro.
    const relevantes = prontos.filter(entry => !entry._tier || entry._tier <= 2);

    // Piso de uso real: um merge cujo impacto real fica abaixo do que sua pior peça já
    // instalada contribui hoje não compete de verdade por espaço, fica encalhado no banco.
    // Comparação é impacto contra impacto (não poder bruto), porque peças Legendary/Epic de
    // bônus % alto podem ter poder bruto baixo mas impacto real relevante.
    const pisoImpactoHz = this._impactoMinimoInstalado(userData);

    const candidatos = [];
    relevantes.forEach(entry => {
      const custoProximo = entry.info.nextTier.price || 0;
      const impactoProximo = entry.impactoReal != null ? entry.impactoReal : entry.gain;
      if (impactoProximo > 0 && (pisoImpactoHz == null || impactoProximo >= pisoImpactoHz)) {
        candidatos.push({ entry, modo: 'proximo', custo: custoProximo, impacto: impactoProximo });
      }
      if (entry.alcance && entry.alcance.impactoFinal > 0 && (pisoImpactoHz == null || entry.alcance.impactoFinal >= pisoImpactoHz)) {
        candidatos.push({ entry, modo: 'cadeia', custo: entry.alcance.totalCost, impacto: entry.alcance.impactoFinal, label: entry.alcance.label });
      }
    });

    // Por miner, mantém só a melhor das duas opções (próximo passo OU cadeia completa) ,
    // não faz sentido oferecer as duas pra mesma miner dentro do mesmo plano.
    const porMiner = new Map();
    candidatos.forEach(c => {
      const key = c.entry.m.name.toLowerCase() + '|' + c.entry.m.level;
      const eff = c.custo > 0 ? c.impacto / c.custo : Infinity;
      const atual = porMiner.get(key);
      if (!atual || eff > atual.eff) porMiner.set(key, { ...c, eff });
    });

    const lista = Array.from(porMiner.values()).sort((a, b) => b.eff - a.eff);

    // ===== Etapa 2: custo real = taxa da miner + taxa de fusão das PEÇAS =====
    // O estoque de peças é um pool ÚNICO consumido na ordem de eficiência: cada merge que
    // entra no plano gasta de verdade, e o próximo já encontra o estoque menor. Sem isso, dois
    // merges que precisam da mesma peça apareceriam ambos como viáveis quando na prática só um
    // seria. `_custoDePecasDoMerge` devolve o estoque pós-consumo, mas só confirmamos (commit)
    // quando o merge realmente entra no plano.
    let estoquePecas = { ...((typeof UI_Inventario !== 'undefined' && UI_Inventario.partsCached) || {}) };
    const temEstoqueDePecas = Object.keys(estoquePecas).length > 0;
    // Preço de mercado só entra se o usuário informou de fato (decisão: não recomendar compra
    // com preço chutado). Sem isso, o plano só considera produzir a peça fundindo.
    const mercado = this._precosDeMercado();
    const precos = mercado ? mercado.precos : null;

    // RST é um pool compartilhado igual ao estoque de peças: só é confirmado (subtraído de
    // verdade) quando o merge realmente entra no plano, senão um candidato que não coube no
    // orçamento de RLT deixaria RST "gasto" por engano numa simulação que não aconteceu.
    let rstDisponivel = tetoRST;

    let custoTotal = 0, impactoTotal = 0, custoPecasTotal = 0, rstTotal = 0;
    const escolhidos = [];
    const bloqueados = [];
    for (const c of lista) {
      const pecas = this._pecasDoCandidato(c);
      const analise = (temEstoqueDePecas || precos || rstDisponivel > 0) && pecas.length
        ? this._custoDePecasDoMerge(pecas, estoquePecas, precos, rstDisponivel)
        : { possivel: true, custoRLT: 0, custoFusao: 0, custoCompra: 0, rstGasto: 0, estoqueDepois: estoquePecas, faltas: [], detalhes: [], compras: [] };

      if (!analise.possivel) {
        // Mesmo usando todo o RST disponível a cascata não fechou: mostra quanto RST a MAIS
        // seria preciso, só como informação (não é o que decide entrar ou não no plano).
        const viaRST = this._custoRSTdasFaltas(analise.faltas);
        bloqueados.push({ ...c, analisePecas: analise, viaRST, motivo: 'pecas' });
        continue;
      }

      const custoPecasMicro = analise.custoRLT * 1e6;
      const custoRealMicro = c.custo + custoPecasMicro;
      if (custoTotal + custoRealMicro > budgetMicro) continue;

      custoTotal += custoRealMicro;
      custoPecasTotal += custoPecasMicro;
      impactoTotal += c.impacto;
      rstTotal += analise.rstGasto || 0;
      rstDisponivel -= analise.rstGasto || 0; // commit do RST gasto por esse merge
      estoquePecas = analise.estoqueDepois;   // commit do consumo de peças
      escolhidos.push({ ...c, custoPecasMicro, custoRealMicro, analisePecas: analise, rstNecessario: analise.rstGasto || 0 });
    }

    const compraTotal = escolhidos.reduce((s, c) => s + ((c.analisePecas?.custoCompra || 0) * 1e6), 0);
    return {
      escolhidos, custoTotal, impactoTotal, custoPecasTotal, rstTotal, bloqueados,
      temEstoqueDePecas, compraTotal,
      mercado,
      pisoAplicado: pisoImpactoHz != null, pisoImpactoHz,
    };
  },


  // Campos de orçamento (RLT + RST). Extraído pra ficar no topo da aba, no bloco "1. Quanto
  // você tem", em vez de espremido depois dos controles da lista de exploração.
  _budgetControlsHtml: function() {
    let html = '<div class="merge-budget-controls">';
    html += '<span style="font-size:12px;opacity:.75;">💰 RLT</span>';
    html += `<input type="number" id="merge-budget-input" min="0" step="0.01" value="${this.budgetRLT != null ? this.budgetRLT : ''}" placeholder="ex: 96" class="merge-budget-input" onkeydown="if(event.key==='Enter')UI_MinerMerge.setBudget(this.value)">`;
    html += '<span style="font-size:12px;opacity:.75;margin-left:10px;">🪙 RST</span>';
    html += `<input type="number" id="merge-budget-rst-input" min="0" step="1" value="${this.budgetRST != null ? this.budgetRST : ''}" placeholder="opcional" class="merge-budget-input" onkeydown="if(event.key==='Enter')UI_MinerMerge.setBudget(document.getElementById('merge-budget-input').value)">`;
    html += `<button class="merge-btn-gerar" onclick="UI_MinerMerge.setBudget(document.getElementById('merge-budget-input').value)">Gerar plano</button>`;
    if (this.budgetRLT != null) html += `<button class="merge-sort-btn" onclick="UI_MinerMerge.clearBudget()">✕ Limpar</button>`;
    html += '</div>';
    return html;
  },

  // Card de um candidato do plano: imagem, custo real (miner + peças), impacto, ingredientes
  // e de onde sai cada peça que falta (fundir ou comprar pronta).
  _planoItemHtml: function(c, userData) {
    let html = '';
    const modoLabel = c.modo === 'cadeia' ? `🔗 até ${c.label}` : '➡️ próximo passo';
    const ingredientes = c.entry.info.ingredientes || [];
    const imgUrl = c.entry.m.catalogData?.imageUrl || c.entry.info.nextTier?.imageUrl || '';
    const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="${c.entry.m.name}" class="merge-row-img">` : '<span class="merge-budget-item-img-placeholder"></span>';
    html += '<details class="merge-budget-item">';
    html += '<summary class="merge-budget-item-summary">';
    html += '<span class="merge-row-caret">▸</span>';
    html += imgHtml;
    html += `<span class="merge-budget-item-name">${c.entry.m.name} <span class="dim">${c.entry.m.level}</span></span>`;
    html += `<span class="dim">${modoLabel}</span>`;
    const custoRealRlt = (c.custoRealMicro != null ? c.custoRealMicro : c.custo) / 1e6;
    const custoPecasItemRlt = (c.custoPecasMicro || 0) / 1e6;
    // Mostra o custo REAL (miner + peças). Quando peça pesa, abre a conta ao lado pra
    // não parecer que a taxa da miner encareceu.
    html += `<span>💰 ${custoRealRlt.toFixed(2)} RLT${custoPecasItemRlt > 0 ? ` <span class="dim">(${(c.custo / 1e6).toFixed(2)} + ${custoPecasItemRlt.toFixed(2)} peças)</span>` : ''}</span>`;
    html += `<span style="color:#28a745;">${Utils.formatPowerSigned(c.impacto)}</span>`;
    html += '</summary>';
    // Chips de "quais níveis você já tem". No modo cadeia isso não aparecia em lugar
    // nenhum, só os ingredientes do 1º passo, então não dava pra ver de relance quanto
    // já está pronto até o alvo (ex: já tem Rare instalado, só falta o resto).
    html += `<div style="margin:2px 0 6px 0;">${this._levelsChipsHtml(c.entry, userData)}</div>`;

    // Matéria-prima total do caminho inteiro, somando TODOS os passos. Vem antes de
    // tudo porque é a pergunta mais direta ("quanto eu preciso ter pra fazer isso?") e
    // era justamente a que não dava pra responder olhando o card.
    const consumo = c.analisePecas?.consumo || {};
    const chavesConsumo = Object.keys(consumo);
    if (chavesConsumo.length) {
      const estoqueAtual = (typeof UI_Inventario !== 'undefined' && UI_Inventario.partsCached) || {};
      const eq = this._equivalenciaEmCommon();
      // Total em COMMON equivalente, não contagem simples de peças: uma peça Epic vale
      // 10.000 Common, então somar "1 Epic + 520 Common = 521 peças" daria uma ideia
      // completamente errada do esforço real.
      let totalEmCommon = 0;
      const itens = chavesConsumo.sort((a, b) => (consumo[b] * (eq[b.split('|')[1]] || 1)) - (consumo[a] * (eq[a.split('|')[1]] || 1))).map(k => {
        const [nome, rar] = k.split('|');
        const tem = estoqueAtual[k] || 0;
        const precisa = consumo[k];
        const emCommon = precisa * (eq[rar] || 1);
        totalEmCommon += emCommon;
        const ok = tem >= precisa;
        const equivTxt = rar !== 'Common' ? ` <span class="dim">= ${emCommon.toLocaleString('pt-BR')} Common</span>` : '';
        return `<span class="merge-materia-item ${ok ? 'ok' : 'nok'}">${ok ? '✅' : '⚠️'} ${precisa.toLocaleString('pt-BR')}× ${rar} ${nome}${equivTxt} <span class="dim">(tem ${tem.toLocaleString('pt-BR')})</span></span>`;
      }).join('');
      const alvoTxt = c.modo === 'cadeia' ? ` até ${c.label}` : '';
      html += `<div class="merge-card-section-label">📦 Matéria-prima${alvoTxt}: <strong style="font-size:13px; text-transform:none;">${totalEmCommon.toLocaleString('pt-BR')} peças Common</strong> no total</div>`;
      html += `<div class="merge-materia-lista">${itens}</div>`;
    }

    if (ingredientes.length) {
      if (c.modo === 'cadeia') {
        html += `<div class="merge-budget-item-note">🔗 Ingredientes só do 1º passo (o total acima já inclui todos os passos até ${c.label}):</div>`;
      }
      html += '<div class="merge-card-ingredients">';
      ingredientes.forEach(ing => {
        const label = ing.tipo === 'miner'
          ? `${ing.precisa}× ${ing.nome} (${ing.rarity})`
          : `${ing.precisa}× ${ing.rarity} ${ing.nome}`;
        const pct = Math.min(100, ing.precisa > 0 ? Math.round((ing.tem / ing.precisa) * 100) : 0);
        html += `<div class="merge-ingredient-chip ${ing.ok ? 'ok' : 'nok'}">`;
        html += `<span class="ing-label">${ing.ok ? '✅' : '❌'} ${label}</span>`;
        html += `<div class="ing-progress-wrap"><div class="ing-progress-fill" style="width:${pct}%"></div></div>`;
        html += `<span class="ing-fraction">${ing.tem}/${ing.precisa}</span>`;
        html += `</div>`;
      });
      html += '</div>';
    }
    // Cadeia completa: mostra quanto custa CADA fusão no caminho, não só o total ,
    // senão "8,82 RLT até Legendary" esconde se é 1 fusão cara ou 4 fusões baratas.
    if (c.modo === 'cadeia' && c.entry.alcance?.passos?.length) {
      html += '<div class="merge-card-section-label" style="margin-top:8px;">🔗 Custo por fusão até ' + c.label + '</div>';
      html += '<div class="merge-budget-passos">';
      c.entry.alcance.passos.forEach(p => {
        html += `<div class="merge-budget-passo">`;
        html += `<span>${p.deLabel} → <strong>${p.paraLabel}</strong></span>`;
        html += `<span class="dim">${p.fusoes}× fusão${p.fusoes !== 1 ? 'ões' : ''}</span>`;
        html += `<span>💰 ${(p.custo / 1e6).toFixed(2)} RLT</span>`;
        html += `</div>`;
      });
      html += '</div>';
    }
    // Etapa 2: de onde sai cada peça que esse merge consome, e a que custo.
    const detalhesPecas = c.analisePecas?.detalhes || [];
    // Mostra a alternativa descartada ao lado da escolhida, pra você poder decidir
    // diferente na hora de executar (o plano escolhe o mais barato em RLT, mas às vezes
    // vale trocar RLT por RST, ou vice-versa, conforme o que você tem sobrando).
    const altTxt = (alt) => {
      if (!alt) return '';
      const rstTxt = alt.rst > 0 ? ` + ${alt.rst} RST` : '';
      const label = alt.via === 'comprar' ? 'ou comprar pronta' : 'ou fundir';
      return `<span class="merge-budget-alt">${label}: ${alt.rlt.toFixed(2)} RLT${rstTxt}</span>`;
    };

    if (detalhesPecas.length) {
      html += '<div class="merge-card-section-label" style="margin-top:8px;">🔩 Produzindo por fusão</div>';
      // Um bloco POR PEÇA: cabeçalho com o que se quer produzir, custo e alternativa, e
      // os passos indentados abaixo. Numa lista corrida, os passos de peças diferentes
      // se misturavam e só dava pra saber a qual pertenciam lendo o "pra Nx" no meio.
      detalhesPecas.forEach(d => {
        const rstTxt = d.rstUsado > 0 ? ` <strong>+ ${d.rstUsado} RST</strong> (${Math.round(d.rstUsado / this._CAIXA_TIPO.rst)}× Parts Case)` : '';
        html += '<div class="merge-peca-grupo">';
        html += '<div class="merge-peca-cabecalho">';
        html += `<span><strong>${d.precisa}× ${d.rarity} ${d.nome}</strong></span>`;
        html += `<span>💰 ${d.custo.toFixed(2)} RLT${rstTxt}</span>`;
        html += altTxt(d.alternativa) || '<span></span>';
        html += '</div>';
        d.passos.forEach(p => {
          html += `<div class="merge-peca-passo">`;
          html += `<span>↳ ${p.fusoes}× fusão ${p.de} → ${p.para}</span>`;
          html += `<span>${p.custo.toFixed(2)} RLT</span>`;
          html += `</div>`;
        });
        html += '</div>';
      });
    }
    const comprasItem = c.analisePecas?.compras || [];
    if (comprasItem.length) {
      html += '<div class="merge-card-section-label" style="margin-top:8px;">💲 Comprando pronta no mercado</div>';
      comprasItem.forEach(cp => {
        html += '<div class="merge-peca-grupo">';
        html += '<div class="merge-peca-cabecalho">';
        html += `<span><strong>${cp.qtd.toLocaleString('pt-BR')}× ${cp.rarity} ${cp.nome}</strong></span>`;
        html += `<span>💰 ${cp.total.toFixed(2)} RLT</span>`;
        html += altTxt(cp.alternativa) || '<span></span>';
        html += '</div>';
        html += `<div class="merge-peca-passo"><span>↳ ${cp.motivo}, a ${cp.precoUnit} RLT cada</span><span></span></div>`;
        html += '</div>';
      });
    }
    html += '</details>';
    return html;
  },

  // Bloco "2. Seu plano". Recebe os candidatos e devolve o HTML pronto, pra o render principal
  // poder posicioná-lo logo abaixo do orçamento.
  _planoHtml: function(prontos, userData) {
    let html = '';
    if (this.budgetRLT != null) {
      const plano = this._gerarPlanoOrcamento(prontos, this.budgetRLT, userData, this.budgetRST);
      const custoTotalRlt = plano.custoTotal / 1e6;
      const custoPecasRlt = plano.custoPecasTotal / 1e6;
      html += '<div class="merge-budget-plan">';
      html += `<h4 class="merge-budget-title">✅ Seu plano com ${this.budgetRLT.toFixed(2)} RLT${this.budgetRST ? ' + ' + this.budgetRST + ' RST' : ''}</h4>`;
      if (!plano.temEstoqueDePecas) {
        html += '<p class="merge-budget-summary dim">🔩 Você não colou o <strong>estoque de peças</strong> na aba Inventário, então o custo abaixo é só a taxa de fusão das miners, não inclui produzir as peças que faltam. Cole Storage › Parts pra ter o custo real.</p>';
      }
      if (plano.escolhidos.length === 0) {
        html += '<p style="opacity:.6; font-size:13px;">Nenhum merge pronto cabe nesse orçamento.</p>';
      } else {
        html += `<p class="merge-budget-summary">💸 <strong>${custoTotalRlt.toFixed(2)} RLT</strong> gastos de ${this.budgetRLT.toFixed(2)} (sobram ${(this.budgetRLT - custoTotalRlt).toFixed(2)}) · 🏠 ganho total: <strong style="color:#28a745;">${Utils.formatPowerSigned(plano.impactoTotal)}</strong> · ${plano.escolhidos.length} merges</p>`;
        if (custoPecasRlt > 0) {
          const compraRlt = (plano.compraTotal || 0) / 1e6;
          const fusaoRlt = custoPecasRlt - compraRlt;
          let det = `🔩 Desse total, <strong>${custoPecasRlt.toFixed(2)} RLT</strong> são das <strong>peças</strong> (o resto é a taxa das miners)`;
          if (compraRlt > 0) det += `: ${fusaoRlt.toFixed(2)} fundindo + <strong>${compraRlt.toFixed(2)} comprando pronta</strong> no marketplace, escolhendo o mais barato peça a peça`;
          det += '. O estoque é consumido em conjunto: cada merge já desconta o que os anteriores gastaram.';
          html += `<p class="merge-budget-summary dim">${det}</p>`;
        }
        if (!plano.mercado) {
          html += '<p class="merge-budget-summary dim">💲 Sem <strong>preços do marketplace</strong> informados, o plano só considera <em>produzir</em> a peça fundindo, não compara com comprar pronta. Cole os preços na aba Inventário pra habilitar a comparação.</p>';
        } else {
          html += `<p class="merge-budget-summary dim">💲 Comparando com preços do marketplace de ${new Date(plano.mercado.atualizadoEm).toLocaleString('pt-BR')}.</p>`;
        }
        if (plano.rstTotal > 0) {
          const caixasTotais = Math.round(plano.rstTotal / this._CAIXA_TIPO.rst);
          html += `<p class="merge-budget-summary dim">🪙 <strong>${plano.rstTotal} RST</strong> (${caixasTotais}× Parts Case) pra completar peça Common que faltava. O RST só entra quando o estoque de peça acaba no meio da fusão: se suas peças já cobrem o merge, ele não é usado, então sobrar RST é normal.</p>`;
        }
        if (plano.bloqueados.length > 0) {
          html += `<p class="merge-budget-summary dim">🚫 <strong>${plano.bloqueados.length} merges</strong> ficaram de fora por falta de matéria-prima, não por falta de RLT. Veja a lista abaixo do plano.</p>`;
        }
        if (plano.pisoAplicado) {
          html += `<p class="merge-budget-summary dim">🚧 Merges com impacto real abaixo de ${Utils.formatPowerSigned(plano.pisoImpactoHz)} foram excluídos: é o que a sua miner instalada mais fraca contribui hoje, ignorando as de <strong>lastro</strong> (aquelas que você põe só pra ocupar célula sem somar poder). Abaixo disso o merge não compete de verdade por espaço na sala.</p>`;
        }

        // Ordenação só de exibição, não muda QUAIS merges entraram no plano (isso já foi
        // decidido pelo guloso por eficiência), só a ordem que aparecem na lista.
        const budgetSortOptions = [
          { key: 'eficiencia', label: '⚡ Custo-benefício' },
          { key: 'custo',      label: '💰 Maior custo' },
          { key: 'poder',      label: '🏠 Maior poder' },
        ];
        html += '<div class="merge-budget-sort">';
        html += '<span class="dim" style="font-size:11px;margin-right:6px;">Ordenar por:</span>';
        budgetSortOptions.forEach(({ key, label }) => {
          const active = this.budgetSortMode === key;
          html += `<button class="merge-sort-btn mini${active ? ' active' : ''}" onclick="UI_MinerMerge.setBudgetSort('${key}')">${label}</button>`;
        });
        html += '</div>';

        const escolhidosOrdenados = plano.escolhidos.slice().sort((a, b) => {
          if (this.budgetSortMode === 'custo') return b.custo - a.custo;
          if (this.budgetSortMode === 'poder') return b.impacto - a.impacto;
          return b.eff - a.eff;
        });

        html += '<div class="merge-budget-list">';
        escolhidosOrdenados.forEach(c => { html += this._planoItemHtml(c, userData); });
        html += '</div>';

        // Bloqueados por matéria-prima: não é falta de RLT, é falta de peça de base. Fica
        // separado do plano pra deixar claro que RLT sozinho não resolve esses.
        if (plano.bloqueados.length) {
          html += '<div class="merge-card-section-label" style="margin-top:14px;">🚫 Fora do plano por falta de matéria-prima</div>';
          html += '<div class="merge-budget-list">';
          plano.bloqueados.slice(0, 12).forEach(b => {
            const falta = (b.analisePecas?.faltas || [])
              .map(f => `${f.qtd.toLocaleString('pt-BR')}× ${f.rarity} ${f.nome}`)
              .join(', ');
            html += '<div class="merge-budget-item" style="padding:6px 8px;">';
            html += `<div style="font-size:12px;"><strong>${b.entry.m.name}</strong> <span class="dim">${b.entry.m.level}</span>, faltam ${falta}`;
            if (b.viaRST && b.viaRST.rst > 0) {
              html += ` <span class="dim">(~${b.viaRST.caixas}× Parts Case = ${b.viaRST.rst} RST)</span>`;
            }
            html += '</div></div>';
          });
          if (plano.bloqueados.length > 12) {
            html += `<p class="dim" style="font-size:11px;margin:4px 0 0 0;">e mais ${plano.bloqueados.length - 12}...</p>`;
          }
          html += '</div>';
        }
      }
      html += '</div>';
    }
    return html;
  },

  setBudget: function(value) {
    const n = parseFloat(String(value).replace(',', '.'));
    this.budgetRLT = (!isNaN(n) && n > 0) ? n : null;
    // Lê o campo de RST junto: os dois orçamentos são aplicados na mesma geração do plano.
    const elRST = document.getElementById('merge-budget-rst-input');
    if (elRST) {
      const r = parseFloat(String(elRST.value).replace(',', '.'));
      this.budgetRST = (!isNaN(r) && r > 0) ? r : null;
    }
    this.mostrar();
  },

  clearBudget: function() {
    this.budgetRLT = null;
    this.budgetRST = null;
    this.mostrar();
  },

  setBudgetRST: function(value) {
    const n = parseFloat(String(value).replace(',', '.'));
    this.budgetRST = (!isNaN(n) && n > 0) ? n : null;
    this.mostrar();
  },

  setBudgetSort: function(mode) {
    this.budgetSortMode = mode;
    this.mostrar();
  },

  setGroup: function(key) {
    this._explorarAberto = true; // veio de dentro do bloco de exploração, mantém aberto
    this.activeGroup = key;
    this.mostrar();
  },

  setMergeSort: function(mode) {
    this._explorarAberto = true; // veio de dentro do bloco de exploração, mantém aberto
    this.mergeSortMode = mode;
    if (typeof Analytics !== 'undefined') Analytics.mergeSortUsado(mode);
    this.mostrar();
  },

  setQualityFilter: function(filter) {
    this._explorarAberto = true; // veio de dentro do bloco de exploração, mantém aberto
    this.qualityFilter = filter;
    this.mostrar();
  },

  setPieceFilter: function(filter) {
    this._explorarAberto = true; // veio de dentro do bloco de exploração, mantém aberto
    this.pieceFilter = filter;
    this.mostrar();
  },
};

window.UI_MinerMerge = UI_MinerMerge;
