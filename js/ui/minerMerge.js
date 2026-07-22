// js/ui/minerMerge.js - MinerMerge: plano de merges/fusoes com base no inventario atual

const UI_MinerMerge = {
  mergeSortMode: 'efficiency',
  collapsedGroups: { miners: true },

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

    const prontos = [];
    const faltaPartes = [];
    const faltaMiners = [];

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
      categorize({ m, info, gain: impactoReal != null ? impactoReal : isolatedGain, isolatedGain, impactoReal }, info);
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
        categorize({ m: fakeM, info, gain: impactoReal != null ? impactoReal : isolatedGain, isolatedGain, impactoReal }, info);
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
        // gain (padrão)
        return b.gain - a.gain;
      });
    };

    sortEntries(prontos);
    sortEntries(faltaPartes);
    sortEntries(faltaMiners);

    const buildCard = (entry, category) => {
      const { m, info, impactoReal } = entry;
      const { nextTier, ingredientes, tiers, userHasLevel, currentPowerHz, resultPowerHz, nextTierAlreadyOwned, currentDbEntry } = info;

      const cardClass = category === 'parts' ? ' parts-only' : category === 'miners' ? ' missing-miners' : '';
      let html = `<div class="merge-card${cardClass}">`;

      // título
      const imgUrl = m.catalogData?.imageUrl || nextTier.imageUrl || '';
      const imgHtml = imgUrl ? `<img src="${imgUrl}" alt="${m.name}" style="width:48px;height:48px;object-fit:contain;vertical-align:middle;margin-right:8px;border-radius:4px;">` : '';
      const nextLabel = nextTier.type === 'merge' ? (rarityMap[nextTier.level] || 'Lv' + nextTier.level) : (nextTier.rarityGroup?.title || 'Common');
      html += `<div class="merge-card-title">${imgHtml}${m.name} <span style="opacity:.6;font-size:12px;">${m.level}</span> → <strong>${nextTier.name}</strong> <span style="opacity:.6;font-size:12px;">${nextLabel}</span></div>`;

      // power
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
      html += '</div>';

      // impacto real na sala (estimado a partir do último estado do SmartRoom)
      if (impactoReal != null) {
        const cor = impactoReal >= 0 ? '#28a745' : '#dc3545';
        const sinal = impactoReal >= 0 ? '+' : '';
        html += `<div class="merge-card-real-impact">🏠 Impacto real na sala: <strong style="color:${cor};">${sinal}${Utils.formatPower(impactoReal)}</strong> <span class="real-impact-note" title="Estimado com base no último estado que você deixou no SmartRoom (sala real ou simulação otimizada)">ⓘ estimado</span></div>`;
      }

      // aviso de duplicado
      if (nextTierAlreadyOwned) {
        const { status: dupStatus, count: dupCount } = userHasLevel[nextTier.id] || { status: null, count: 1 };
        const onde = dupStatus === 'both' ? 'no inventário e na sala' : dupStatus === 'room' ? 'na sala' : 'no inventário';
        const minerIngredient = ingredientes.find(i => i.tipo === 'miner');
        const consumeDesc = minerIngredient ? minerIngredient.precisa + '× ' + m.level : '2× ' + m.level;
        html += `<div class="merge-alert">⚠️ Este merge consome <strong>${consumeDesc}</strong> e produz <strong>1 ${nextLabel}</strong>. Você já tem <strong>${dupCount} ${nextLabel}</strong> ${onde} — ficará com <strong>${dupCount + 1} ${nextLabel}s</strong>.</div>`;
      }

      // níveis
      const rarityEmoji = { 'Common': '⚪', 'Uncommon': '🟢', 'Rare': '🔵', 'Epic': '🟣', 'Legendary': '🟡', 'Unreal': '🔴' };
      html += '<div class="merge-card-section-label">Níveis que você tem</div>';
      html += '<div class="merge-card-levels">';
      tiers.forEach(t => {
        const lbl = t.type === 'merge' ? (rarityMap[t.level] || 'Lv' + t.level) : (t.rarityGroup?.title || 'Common');
        const { status, count } = userHasLevel[t.id] || { status: null, count: 0 };
        const isNext = t.id === nextTier.id;
        const chipClass = status === 'both' ? 'has-both' : status === 'inv' ? 'has-inv' : status === 'room' ? 'has-room' : 'missing';
        const statusIcon = status === 'both' ? '✅🏠' : status === 'inv' ? '✅' : status === 'room' ? '🏠' : '❌';
        const rarityDot = rarityEmoji[lbl] || '';
        const countBadge = count > 0 ? ` <span class="chip-count">×${count}</span>` : '';
        const statusTip = status === 'both' ? `No inventário e instalada na sala (${count}×)` : status === 'inv' ? `No inventário (${count}×)` : status === 'room' ? `Instalada na sala (${count}×)` : 'Não possui';
        const powerVal = Utils.formatPower(t.power * 1e9);
        const bonusVal = t.bonusPower ? `${(t.bonusPower / 100).toFixed(2)}%` : '';
        const costVal = t.price ? `${(t.price / 1e6).toFixed(2)} RLT` : (t.level > 0 ? 'gratuito' : '');
        const partsEncoded = (t.craftRecipe || []).map(r => `${r.name}|${r.rarity || ''}|${r.count}`).join('~');
        const tierImpacto = isNext ? impactoReal : this._calcularImpactoTroca(m, lbl, t.power * 1e9, t.bonusPower, userData);
        const impactAttr = tierImpacto != null
          ? ` data-tip-impact="${tierImpacto >= 0 ? '+' : ''}${Utils.formatPower(tierImpacto)} (estimado, sala/SmartRoom)"`
          : '';
        html += `<span class="merge-level-chip ${chipClass}${isNext ? ' next-tier' : ''}" data-tip-status="${statusTip}" data-tip-power="${powerVal}" data-tip-bonus="${bonusVal}" data-tip-cost="${costVal}" data-tip-parts="${partsEncoded}"${impactAttr}>${statusIcon} ${rarityDot} ${lbl}${countBadge}</span>`;
      });
      html += '</div>';

      // preço do merge
      if (nextTier.price) {
        const priceRlt = (nextTier.price / 1000000).toFixed(2);
        html += `<div style="margin: 6px 0; font-size: 12px;">💰 Custo base: <strong>${priceRlt} RLT</strong> <span style="opacity:.6;">(sem desconto de forja)</span></div>`;
      }

      // ingredientes
      html += '<div class="merge-card-section-label">Ingredientes</div>';
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

      html += '</div>';
      return html;
    };

    const sortMode = this.mergeSortMode;
    let html = '<div class="merge-planner">';
    html += '<div class="merge-planner-header">';
    html += '<h3 style="margin:0;">🔧 Plano de Merges</h3>';
    html += '<div class="merge-sort-controls">';
    html += '<span style="font-size:12px;opacity:.6;margin-right:6px;">Ordenar por:</span>';
    [
      { key: 'efficiency', label: '⚡ Custo-benefício' },
      { key: 'gain',       label: '📈 Maior impacto real' },
      { key: 'cost',       label: '💰 Menor custo'     },
    ].forEach(({ key, label }) => {
      const active = sortMode === key;
      html += `<button class="merge-sort-btn${active ? ' active' : ''}" onclick="UI_MinerMerge.setMergeSort('${key}')">${label}</button>`;
    });
    html += '</div></div>';
    html += '<div class="merge-planner-warning">⚠️ O <strong>impacto real na sala</strong> exibido em cada card (e usado na ordenação por impacto/custo-benefício) é estimado com base no último estado que você deixou na aba <strong>SmartRoom</strong> — a sala real ou a simulação otimizada, o que estiver ativo lá. Para valores mais próximos do real, abra o SmartRoom e rode o Auto-Otimizar antes de decidir os merges.</div>';
    html += '<div class="merge-planner-groups">';

    const buildAccordionGroup = (key, color, icon, title, list, emptyMsg, category) => {
      const collapsed = !!this.collapsedGroups[key];
      let h = `<div class="merge-planner-group${collapsed ? ' collapsed' : ''}">`;
      h += `<button type="button" class="merge-group-toggle" style="color:${color};" onclick="UI_MinerMerge.toggleGroup('${key}')">`;
      h += `<span class="merge-group-caret">▸</span> <h4 style="color:${color};">${icon} ${title} (${list.length})</h4>`;
      h += '</button>';
      h += '<div class="merge-group-body">';
      if (list.length === 0) {
        h += `<p style="opacity:.5; font-size:13px;">${emptyMsg}</p>`;
      } else {
        h += '<div class="merge-cards">';
        list.forEach(e => { h += buildCard(e, category); });
        h += '</div>';
      }
      h += '</div></div>';
      return h;
    };

    html += buildAccordionGroup('ready', '#28a745', '✅', 'Prontos para merge', prontos, 'Nenhum merge disponível agora.', 'ready');
    html += buildAccordionGroup('parts', '#c2650a', '🔩', 'Falta só peças', faltaPartes, 'Nenhum merge nessa situação.', 'parts');
    html += buildAccordionGroup('miners', '#6c757d', '⛏️', 'Falta miners', faltaMiners, 'Nenhum merge nessa situação.', 'miners');

    html += '</div></div>';
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

    const idxRemover = poolOriginal.findIndex(mm =>
      mm.name.toLowerCase() === m.name.toLowerCase() && String(mm.level || '').toLowerCase() === String(m.level).toLowerCase());

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

  // Impacto real específico do merge (m → nextTier), usado no card e na ordenação.
  _calcularImpactoReal: function(m, info, userData) {
    const rarityMap = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Epic', 4: 'Legendary', 5: 'Unreal' };
    const { nextTier, resultPowerHz } = info;
    const nextLabel = nextTier.type === 'merge' ? (rarityMap[nextTier.level] || 'Unknown') : (nextTier.rarityGroup?.title || 'Common');
    return this._calcularImpactoTroca(m, nextLabel, resultPowerHz, nextTier.bonusPower, userData);
  },

  toggleGroup: function(key) {
    this.collapsedGroups[key] = !this.collapsedGroups[key];
    this.mostrar();
  },

  setMergeSort: function(mode) {
    this.mergeSortMode = mode;
    if (typeof Analytics !== 'undefined') Analytics.mergeSortUsado(mode);
    this.mostrar();
  },
};

window.UI_MinerMerge = UI_MinerMerge;
