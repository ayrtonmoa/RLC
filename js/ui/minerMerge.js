// js/ui/minerMerge.js - MinerMerge: plano de merges/fusoes com base no inventario atual

const UI_MinerMerge = {
  mergeSortMode: 'efficiency',
  qualityFilter: 'all',
  activeGroup: 'ready',

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
    const prontosVis        = filterByQuality(prontos);
    const faltaPartesVis    = filterByQuality(faltaPartes);
    const faltaMinersVis    = filterByQuality(faltaMiners);
    const recuperaCadeiaVis = recuperaCadeia;

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
      let levelsHtml = '<div class="merge-row-levels">';
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
        levelsHtml += `<span class="merge-level-chip mini ${chipClass}${isNext ? ' next-tier' : ''}" data-tip-status="${statusTip}" data-tip-power="${powerVal}" data-tip-bonus="${bonusVal}" data-tip-cost="${costVal}" data-tip-parts="${partsEncoded}"${impactAttr}>${statusIcon}${rarityDot}${countBadge}</span>`;
      });
      levelsHtml += '</div>';

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
    html += '</div></div></div>';
    html += '<div class="merge-planner-warning">⚠️ O <strong>impacto real na sala</strong> exibido em cada linha (e usado na ordenação por impacto/custo-benefício) é estimado com base no último estado que você deixou na aba <strong>SmartRoom</strong> — a sala real ou a simulação otimizada, o que estiver ativo lá. Para valores mais próximos do real, abra o SmartRoom e rode o Auto-Otimizar antes de decidir os merges.</div>';

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
  _calcularImpactoTroca: function(m, targetLabel, targetPowerHz, targetBonusPower, userData) {
    const ctx = this._roomCalcContext(userData);
    if (!ctx) return null;
    const { poolOriginal, calcPoder, rackFactorMap } = ctx;

    // Entre várias cópias instaladas do nível atual (mesma miner/nível em racks
    // diferentes), escolhe pra "sacrificar" na simulação a que está no rack de MENOR
    // bônus — é o que você faria na prática. Escolher a primeira que aparecesse no array
    // (ordem arbitrária) podia acidentalmente sacrificar a cópia no seu MELHOR rack,
    // fazendo um merge claramente positivo (poder bruto sobe bastante) aparecer negativo
    // só porque a simulação perdeu um bônus de rack que na vida real você não perderia.
    let idxRemover = -1;
    let menorFatorRack = Infinity;
    poolOriginal.forEach((mm, i) => {
      if (mm.name.toLowerCase() !== m.name.toLowerCase() || String(mm.level || '').toLowerCase() !== String(m.level).toLowerCase()) return;
      const fator = rackFactorMap[mm._rackId] || 0;
      if (fator < menorFatorRack) { menorFatorRack = fator; idxRemover = i; }
    });

    const poolDepois = poolOriginal.slice();
    // rackDaNova só recebe um rack se a miner atual JÁ estiver instalada em algum
    // (idxRemover !== -1) — a nova unidade herda o rack de onde a antiga saiu, então o
    // bônus de rack dela entra no cálculo. Se a miner só existe no inventário (nunca foi
    // instalada), rackDaNova fica undefined: rackFactorMap[undefined] é undefined, o `||
    // 0` em calcPoder zera esse termo, e o resultado usa só poder base + bônus de
    // coleção — sem inventar bônus de rack pra uma miner sem rack definido.
    let rackDaNova;
    if (idxRemover !== -1) {
      rackDaNova = poolOriginal[idxRemover]._rackId;
      poolDepois.splice(idxRemover, 1);
    }
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

    const calcPoder = (pool) => {
      const base = pool.reduce((s, mm) => s + mm.power, 0);
      const chaves = new Set();
      let bonusPct = 0;
      pool.forEach(mm => {
        const key = mm.name.toLowerCase() + '|' + String(mm.level || '').toLowerCase();
        if (!chaves.has(key)) { chaves.add(key); bonusPct += (mm.bonus_percent || 0) / 10000; }
      });
      const rackBonus = pool.reduce((s, mm) => s + mm.power * (rackFactorMap[mm._rackId] || 0), 0);
      return base + base * bonusPct + rackBonus + extras;
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

  // Impacto real específico do merge (m → nextTier), usado no card e na ordenação.
  _calcularImpactoReal: function(m, info, userData) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const { nextTier, resultPowerHz } = info;
    const nextLabel = nextTier.type === 'merge' ? (rarityMap[nextTier.level] || 'Unknown') : (nextTier.rarityGroup?.title || 'Common');
    return this._calcularImpactoTroca(m, nextLabel, resultPowerHz, nextTier.bonusPower, userData);
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

    return { totalCost, finalImpacto, stepsCount: futureTiers.length, finalLabel };
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

    for (const t of futureTiers) {
      if (!t.craftRecipe || !t.craftRecipe.length) break;
      const minerIng = t.craftRecipe.find(ing => ing.rarity === null || ing.rarity === undefined);
      if (!minerIng || minerIng.name.toLowerCase() !== m.name.toLowerCase()) break;
      const need = minerIng.count || 1;
      const produced = Math.floor(available / need);
      if (produced < 1) break;
      totalCost += produced * (t.price || 0);
      const ownedAtTarget = userHasLevel[t.id]?.count || 0;
      available = produced + ownedAtTarget;
      qtyFinal = available;
      steps++;
      reachedTier = t;
    }
    if (!reachedTier) return null;

    const label = reachedTier.type === 'merge' ? (rarityMap[reachedTier.level] || 'Unknown') : (reachedTier.rarityGroup?.title || 'Common');
    const impactoFinal = this._calcularImpactoTroca(m, label, reachedTier.power * scaleFactor, reachedTier.bonusPower, userData);
    return { label, startQty, qtyFinal, totalCost, steps, impactoFinal };
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

  setGroup: function(key) {
    this.activeGroup = key;
    this.mostrar();
  },

  setMergeSort: function(mode) {
    this.mergeSortMode = mode;
    if (typeof Analytics !== 'undefined') Analytics.mergeSortUsado(mode);
    this.mostrar();
  },

  setQualityFilter: function(filter) {
    this.qualityFilter = filter;
    this.mostrar();
  },
};

window.UI_MinerMerge = UI_MinerMerge;
