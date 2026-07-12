// js/ui/roomPlanner.js - SmartRoom: layout dos racks + auto-otimizacao

const UI_RoomPlanner = {
  // Instância PRÓPRIA de simulação — antes era o singleton global SimState, compartilhado
  // com o Inventário. Agora cada aba tem a sua: mexer numa não afeta a outra.
  sim: criarSimState(),
  _plannerMode: 'atual',
  _selectedSlot: null,
  _acoesExpandido: false,

  mostrar: function(user, containerId) {
    const div = document.getElementById(containerId || 'roomplanner');
    if (!div) return;

    const userData = user || State.getUserData();
    if (!userData || !userData.roomData || !userData.powerData) {
      div.innerHTML = '<p class="error">Dados de racks não disponíveis. Analise seu perfil primeiro.</p>';
      return;
    }

    const racks = userData.roomData.racks || [];
    if (racks.length === 0) {
      div.innerHTML = '<p class="warning">Nenhum rack encontrado.</p>';
      return;
    }

    div.innerHTML = this.render(userData);
    ChipTooltip.init();
    this._bindDragScroll();
    this._bindSalaSwipe();
    this._restaurarScrollSala();
  },

  // Sem animação — evita o "pulo" visual toda vez que o próprio SmartRoom
  // re-renderiza (ex: depois de mover uma miner ou rodar o Auto-Otimizar).
  _restaurarScrollSala: function() {
    const viewport = document.getElementById('roomPlannerSalasViewport');
    if (!viewport) return;
    viewport.style.scrollBehavior = 'auto';
    viewport.scrollLeft = (this._salaAtualIndex || 0) * viewport.clientWidth;
    viewport.style.scrollBehavior = '';
  },

  // Painel de cada sala rola na horizontal (arrasta com o mouse), igual ao banner do jogo.
  _bindDragScroll: function() {
    if (this._dragBound) return;
    this._dragBound = true;
    let el = null, startX = 0, scrollStart = 0, dragged = false;

    document.addEventListener('mousedown', e => {
      const target = e.target.closest('.room-planner-sala-scroll');
      if (!target) return;
      el = target;
      startX = e.clientX;
      scrollStart = target.scrollLeft;
      dragged = false;
    });

    document.addEventListener('mousemove', e => {
      if (!el) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) {
        dragged = true;
        el.classList.add('dragging');
      }
      el.scrollLeft = scrollStart - dx;
    });

    document.addEventListener('mouseup', () => {
      if (el) el.classList.remove('dragging');
      el = null;
    });

    // Depois de um arraste real, engole o próximo clique pra não selecionar/mover
    // miner sem querer enquanto o usuário só estava rolando a sala.
    document.addEventListener('click', e => {
      if (dragged) {
        e.stopPropagation();
        e.preventDefault();
        dragged = false;
      }
    }, true);
  },

  render: function(userData) {
    const racks = userData.roomData.racks || [];
    const invMiners = UI_Inventario.minersCached || [];
    const poolSize = userData.roomData.miners.length + invMiners.reduce((s, m) => s + (m.quantity || 1), 0);

    let html = '<div class="room-planner">';

    html += '<div class="room-planner-header">';
    html += '<div class="room-planner-title-row">';
    html += '<h3 class="room-planner-title">🏠 SmartRoom</h3>';
    html += '<div class="room-planner-power-badge">⚡ Poder atual: <strong>' + Utils.formatPower(userData.powerData.current_power * 1e9) + '</strong></div>';
    html += '</div>';
    html += '<div class="room-planner-actions">';
    html += '<button onclick="UI_RoomPlanner.executarAutoOtimizacao()" class="room-planner-auto-btn">⚡ Auto-Otimizar <span class="planner-pool-count">' + poolSize + ' miners disponíveis</span></button>';
    if (this.sim.ativo) html += '<button onclick="UI_RoomPlanner.resetarSimulacao()" class="room-planner-reset-btn" title="Descarta remoções/adições/trocas e volta pro estado real">🔄 Resetar simulação</button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="room-planner-tabs">';
    html += '<button onclick="UI_RoomPlanner.setPlannerMode(\'atual\')" class="room-planner-tab' + (this._plannerMode === 'atual' ? ' active' : '') + '">📍 Atual</button>';
    html += '<button onclick="UI_RoomPlanner.setPlannerMode(\'otimizado\')" class="room-planner-tab' + (this._plannerMode === 'otimizado' ? ' active' : '') + '">✨ Simulação</button>';
    html += '</div>';

    if (this._plannerMode === 'otimizado') {
      html += this._renderSalaOtimizada(userData);
    } else {
      html += this._renderSalaAtual(userData);
    }

    html += '</div>';
    return '<div id="roomPlannerContainer">' + html + '</div>';
  },

  _rerender: function() {
    const userData = State.getUserData();
    const container = document.getElementById('roomPlannerContainer');
    if (container) container.outerHTML = this.render(userData);
    this._restaurarScrollSala();
  },

  _agruparRacksPorSala: function(racks) {
    const salaMap = {};
    racks.forEach(rack => {
      const sala = (rack.placement?.room_level || 0) + 1;
      if (!salaMap[sala]) salaMap[sala] = [];
      salaMap[sala].push(rack);
    });
    Object.values(salaMap).forEach(arr => {
      arr.sort((a, b) => {
        const dy = (a.placement?.y || 0) - (b.placement?.y || 0);
        return dy !== 0 ? dy : (a.placement?.x || 0) - (b.placement?.x || 0);
      });
    });
    return salaMap;
  },

  // Cada sala tem seu próprio layout visual de linhas, confirmado com dados reais do jogo:
  // Sala 1 junta 2 níveis de "y" por linha (8 racks, depois 4). As demais salas seguem um
  // padrão fixo de 4 / 8 / 6 racks por linha, na ordem de y depois x.
  _agruparRacksPorLinha: function(racksDaSala, salaNumero) {
    const ordenados = [...racksDaSala].sort((a, b) => {
      const dy = (a.placement?.y || 0) - (b.placement?.y || 0);
      return dy !== 0 ? dy : (a.placement?.x || 0) - (b.placement?.x || 0);
    });

    if (parseInt(salaNumero) === 1) {
      const linhaMap = {};
      ordenados.forEach(rack => {
        const linha = Math.floor((rack.placement?.y || 0) / 2);
        if (!linhaMap[linha]) linhaMap[linha] = [];
        linhaMap[linha].push(rack);
      });
      return linhaMap;
    }

    const tamanhos = [4, 8, 6];
    const linhaMap = {};
    let i = 0, linha = 0;
    while (i < ordenados.length) {
      const tam = tamanhos[linha % tamanhos.length];
      linhaMap[linha] = ordenados.slice(i, i + tam);
      i += tam;
      linha++;
    }
    return linhaMap;
  },

  _renderSalaAtual: function(userData) {
    const racks = userData.roomData.racks || [];
    const allMiners = userData.roomData.miners || [];

    const impactPorIndex = {};
    const primeiraPorIndex = {};
    Calculations.calcularImpactos(userData).forEach(imp => {
      impactPorIndex[imp.minerIndex] = imp.impact;
      primeiraPorIndex[imp.minerIndex] = imp.isFirstOfType;
    });
    const allMinersIndexed = allMiners.map((m, i) => ({ ...m, _impact: impactPorIndex[i], _primeira: primeiraPorIndex[i] }));

    // Versão normalizada (mesmo shape usado no pool simulado) só pra calcular o impacto real
    // de cada rack (_poderBrutoRecalculado espera name/power/bonus_percent/_rackId).
    const poolNormalizado = allMiners.map(m => ({
      name: m.name,
      level: m.level_label || m.level,
      power: m.power,
      bonus_percent: m.bonus_percent || 0,
      _rackId: m.placement?.user_rack_id,
    }));

    const salaMap = this._agruparRacksPorSala(racks);
    return this._renderSalasCarousel(salaMap, (sala, salaNumero) => {
      let html = '';
      const numeroPorRackId = {};
      sala.forEach((r, i) => numeroPorRackId[r._id] = i + 1);
      const linhaMap = this._agruparRacksPorLinha(sala, salaNumero);
      Object.keys(linhaMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(y => {
        html += '<div class="room-planner-racks">';
        linhaMap[y].forEach(rack => {
          const miners = allMinersIndexed.filter(m => m.placement?.user_rack_id === rack._id);
          html += this._renderRackCard(rack, miners, false, numeroPorRackId[rack._id], poolNormalizado, racks);
        });
        html += '</div>';
      });
      return html;
    });
  },

  _renderSalaOtimizada: function(userData) {
    const racks = userData.roomData.racks || [];
    this.sim.garantirInicializado(userData);
    if (this.sim.poderEstimado == null) this.sim.recalcular(userData);
    const result = this.sim;
    const poderAtual = userData.powerData.current_power;
    const ganho = result.poderEstimado - poderAtual;
    const ganhoColor = ganho >= 0 ? '#4caf50' : '#f44336';
    const ganhoStr = (ganho >= 0 ? '+' : '') + Utils.formatPower(ganho * 1e9);
    const ganhoPercent = ((ganho / poderAtual) * 100).toFixed(2);

    const bonusAtualPercent = (userData.powerData.bonus_percent || 0) / 100;
    const bonusAtualValor = userData.powerData.bonus || 0;
    const bonusEstimado = this._calcularBonusEstimado(Object.values(result.rackAssignments).flat(), racks, userData);
    const bonusDeltaPercent = bonusEstimado.percentual - bonusAtualPercent;
    const bonusDeltaColor = bonusDeltaPercent >= 0 ? '#4caf50' : '#f44336';

    let html = '<div class="room-planner-comparison">';
    html += '<div class="comparison-item"><span class="comparison-label">Atual</span><span class="comparison-value">' + Utils.formatPower(poderAtual * 1e9) + '</span></div>';
    html += '<div class="comparison-arrow">→</div>';
    html += '<div class="comparison-item"><span class="comparison-label">Estimado</span><span class="comparison-value">' + Utils.formatPower(result.poderEstimado * 1e9) + '</span></div>';
    html += '<div class="comparison-delta" style="color:' + ganhoColor + '">' + ganhoStr + ' (' + (ganho >= 0 ? '+' : '') + ganhoPercent + '%)</div>';
    html += '</div>';
    html += '<div class="room-planner-comparison room-planner-comparison-bonus">';
    html += '<div class="comparison-item"><span class="comparison-label">Bônus atual</span><span class="comparison-value">+' + bonusAtualPercent.toFixed(2) + '% <small>(' + Utils.formatPower(bonusAtualValor * 1e9) + ')</small></span></div>';
    html += '<div class="comparison-arrow">→</div>';
    html += '<div class="comparison-item"><span class="comparison-label">Bônus estimado</span><span class="comparison-value">+' + bonusEstimado.percentual.toFixed(2) + '% <small>(' + Utils.formatPower(bonusEstimado.valor * 1e9) + ')</small></span></div>';
    html += '<div class="comparison-delta" style="color:' + bonusDeltaColor + '">' + (bonusDeltaPercent >= 0 ? '+' : '') + bonusDeltaPercent.toFixed(2) + '%</div>';
    html += '</div>';
    html += '<p class="planner-pool-info">' + result.totalPlaced + ' miners alocadas de ' + result.totalPool + ' disponíveis</p>';
    html += '<p class="planner-edit-hint">✏️ Clique numa miner e depois em outra célula pra trocar, ou pegue uma miner do banco abaixo e clique num rack pra encaixar.</p>';

    this._anexarImpactosPool(Object.values(result.rackAssignments).flat(), racks, userData);

    const salaMap = this._agruparRacksPorSala(racks);
    html += this._renderSalasCarousel(salaMap, (sala, salaNumero) => {
      let inner = '';
      const numeroPorRackId = {};
      sala.forEach((r, i) => numeroPorRackId[r._id] = i + 1);
      const linhaMap = this._agruparRacksPorLinha(sala, salaNumero);
      Object.keys(linhaMap).sort((a, b) => parseInt(a) - parseInt(b)).forEach(y => {
        inner += '<div class="room-planner-racks">';
        linhaMap[y].forEach(rack => {
          const miners = result.rackAssignments[rack._id] || [];
          inner += this._renderRackCard(rack, miners, true, numeroPorRackId[rack._id], Object.values(result.rackAssignments).flat(), racks);
        });
        inner += '</div>';
      });
      return inner;
    });

    html += this._renderBanco();
    html += this._renderListaDeAcoes(userData);
    return html;
  },

  // Carrossel horizontal entre salas (Sala 1, Sala 2...), igual ao jogo:
  // arrasta o título ou clica nas setas/pontos pra trocar de sala. Cada sala,
  // por sua vez, tem rolagem horizontal própria pras fileiras de racks
  // (ver _renderRackCard/room-planner-sala-scroll), então são dois níveis de
  // scroll horizontal independentes: um pra trocar de sala, outro pras fileiras.
  _renderSalasCarousel: function(salaMap, renderCorpoDaSala) {
    const keys = Object.keys(salaMap).sort((a, b) => parseInt(a) - parseInt(b));
    this._salaCount = keys.length;
    if (this._salaAtualIndex == null || this._salaAtualIndex >= keys.length) this._salaAtualIndex = 0;

    let html = '<div class="room-planner-nav">';
    html += '<button class="room-planner-nav-btn" onclick="UI_RoomPlanner._irParaSala(-1)">‹</button>';
    html += '<div class="room-planner-dots">';
    keys.forEach((sala, i) => {
      html += '<span class="room-planner-dot' + (i === this._salaAtualIndex ? ' active' : '') + '" onclick="UI_RoomPlanner._irParaSalaIndex(' + i + ')">Sala ' + sala + '</span>';
    });
    html += '</div>';
    html += '<button class="room-planner-nav-btn" onclick="UI_RoomPlanner._irParaSala(1)">›</button>';
    html += '</div>';

    html += '<div class="room-planner-salas" id="roomPlannerSalasViewport">';
    keys.forEach(sala => {
      html += '<div class="room-planner-sala">';
      html += '<div class="room-planner-sala-title">Sala ' + sala + '</div>';
      html += '<div class="room-planner-sala-scroll"><div class="room-planner-sala-track">';
      html += renderCorpoDaSala(salaMap[sala], sala);
      html += '</div></div>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  },

  _irParaSala: function(delta) {
    const max = (this._salaCount || 1) - 1;
    this._salaAtualIndex = Math.min(max, Math.max(0, (this._salaAtualIndex || 0) + delta));
    this._scrollParaSalaAtual();
  },

  _irParaSalaIndex: function(i) {
    this._salaAtualIndex = i;
    this._scrollParaSalaAtual();
  },

  _scrollParaSalaAtual: function() {
    const viewport = document.getElementById('roomPlannerSalasViewport');
    if (!viewport) return;
    viewport.scrollTo({ left: this._salaAtualIndex * viewport.clientWidth, behavior: 'smooth' });
    document.querySelectorAll('.room-planner-dot').forEach((d, idx) => d.classList.toggle('active', idx === this._salaAtualIndex));
  },

  // Arrastar o título da sala troca de sala (swipe); arrastar dentro dos racks
  // continua rolando as fileiras (ver _bindDragScroll) — dois gestos separados
  // pra não conflitar um com o outro.
  _bindSalaSwipe: function() {
    if (this._swipeBound) return;
    this._swipeBound = true;
    let startX = null;

    document.addEventListener('mousedown', e => {
      if (e.target.closest('.room-planner-sala-title')) startX = e.clientX;
    });
    document.addEventListener('mouseup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) < 40) return;
      this._irParaSala(dx < 0 ? 1 : -1);
    });
  },

  _cellsOf: function(m) {
    return m.width || m.cells || 2;
  },

  // poolCompleto/racksTodos (opcionais): quando passados, calcula o IMPACTO REAL do rack —
  // quanto o poder total simulado cai se todas as miners desse rack saíssem de vez — em vez
  // de só "base × (1+bônus%)" isolado. Reaproveita a mesma _poderBrutoRecalculado usada em
  // todo o resto do otimizador, que já soma bônus de coleção + bônus de rack + bônus de SET
  // (ver _calcularBonusDeSetsNoPool) — então se esse rack tiver a última peça de um set
  // instalada, o impacto real mostrado já desconta a faixa de bônus do set que se perderia.
  _renderRackCard: function(rack, miners, editable, numero, poolCompleto, racksTodos) {
    const bonusPercent = (rack.bonus || 0) / 100;
    const width = rack.rack_info?.width || 2;
    const height = rack.rack_info?.height || 3;
    const capacidade = width * height;
    const celulasUsadas = miners.reduce((s, m) => s + (m.width || m.cells || 2), 0);
    const livres = capacidade - celulasUsadas;

    const poderBaseRack = miners.reduce((s, m) => s + m.power, 0);
    const poderComBonusRack = poderBaseRack * (1 + bonusPercent / 100);
    const extraRack = 'Base: ' + Utils.formatPower(poderBaseRack * 1e9) + " <span style='opacity:.6;'>(sem bônus)</span>";

    let impactoAttr = '';
    if (poolCompleto && racksTodos && miners.length) {
      const poderComRack = this._poderBrutoRecalculado(poolCompleto, racksTodos);
      const poderSemRack = this._poderBrutoRecalculado(poolCompleto.filter(m => m._rackId !== rack._id), racksTodos);
      const impactoRack = poderComRack - poderSemRack;
      impactoAttr = ' data-tip-impact="' + (impactoRack >= 0 ? '+' : '') + Utils.formatPower(impactoRack * 1e9) + '"';
    }

    let html = '<div class="room-planner-rack">';
    if (numero) html += '<div class="room-planner-rack-numero" title="' + rack.name + '">R' + numero + '</div>';
    html += '<div class="room-planner-rack-header"'
      + ' data-tip-status="' + rack.name + '"'
      + ' data-tip-power="' + Utils.formatPower(poderComBonusRack * 1e9) + '"'
      + ' data-tip-bonus="' + bonusPercent.toFixed(2) + '%"'
      + impactoAttr
      + ' data-tip-extra="' + extraRack + '">';
    html += '<span class="rack-bonus' + (bonusPercent > 0 ? ' bonus-positive' : '') + '">' + (bonusPercent > 0 ? '+' : '') + bonusPercent.toFixed(2) + '%</span>';
    html += '<span class="rack-slots">' + (livres > 0 ? livres + ' livre' + (livres > 1 ? 's' : '') : 'cheio') + '</span>';
    html += '</div>';

    html += '<div class="room-planner-grid" style="--rack-w:' + width + ';">';

    // Sempre ordena pela posição física original (y depois x) — inclusive na Simulação, senão
    // as miners aparecem na ordem "de array" (que não bate com a posição real) e parecem ter
    // trocado de lugar sozinhas mesmo sem nenhuma edição de verdade. Miners sem posição
    // conhecida (recém adicionadas/movidas pelo otimizador) vão pro fim da lista (Infinity),
    // sem empurrar as que já tinham lugar certo.
    //
    // CRÍTICO: ordena os ÍNDICES originais, não os objetos — se ordenássemos uma cópia dos
    // objetos, a posição na lista ordenada (idx) deixaria de bater com a posição real no
    // array `miners`, e o clique de remover/mover (que usa esse idx como data-slot-index)
    // acabava agindo sobre OUTRA miner (bug real: clicar em "remover Spade Note" removia a
    // Diamond Note ou a Club Note, que estavam em outra posição do array).
    const ordemExibicao = miners.map((_, i) => i).sort((ia, ib) => {
      const a = miners[ia], b = miners[ib];
      const ay = a.placement?.y ?? a._placementY ?? Infinity;
      const by = b.placement?.y ?? b._placementY ?? Infinity;
      if (ay !== by) return ay - by;
      const ax = a.placement?.x ?? a._placementX ?? Infinity;
      const bx = b.placement?.x ?? b._placementX ?? Infinity;
      if (ax !== bx) return ax - bx;
      return ia - ib;
    });

    ordemExibicao.forEach(idx => {
      const m = miners[idx];
      const level = m.level_label || m.level || '';
      const w = Math.min(m.width || m.cells || 2, width);
      const bonus = ((m.bonus_percent ?? (m.bonus != null ? m.bonus * 100 : 0)) / 100);
      const rc = this._getRarityClass(level);
      const img = this._getMinerImage(m.name);
      const podeEditar = editable && !m._fixo;
      const isSelected = podeEditar && this._selectedSlot && this._selectedSlot.type === 'rack' && String(this._selectedSlot.rackId) === String(rack._id) && this._selectedSlot.index === idx;
      const editAttrs = podeEditar ? ' onclick="UI_RoomPlanner.onRackCellClick(this)" data-rack-id="' + rack._id + '" data-slot-index="' + idx + '"' : '';
      const impactoAttr = m._impact != null ? ' data-tip-impact="' + (m._impact >= 0 ? '+' : '') + Utils.formatPower(m._impact * 1e9) + '"' : '';
      const primeiraTxt = m._primeira === true ? ' — 🥇 1ª do tipo (dá bônus de coleção)' : m._primeira === false ? ' — 🔁 duplicata (sem bônus de coleção extra)' : '';
      const statusTip = (m._fixo ? m.name + ' (' + level + ') — parte de um set, fixa' : m.name + ' (' + level + ')') + primeiraTxt;
      html += '<div class="rack-cell miner-cell ' + rc + (isSelected ? ' miner-cell-selected' : '') + (podeEditar ? ' editable' : '') + (m._fixo ? ' miner-cell-fixo' : '') + '" style="grid-column:span ' + w + '"'
        + editAttrs
        + ' data-tip-status="' + statusTip + '"'
        + ' data-tip-power="' + Utils.formatPower(m.power * 1e9) + '"'
        + ' data-tip-bonus="' + bonus.toFixed(2) + '%"'
        + impactoAttr + '>';
      if (podeEditar) html += '<span class="rack-cell-remove" onclick="event.stopPropagation();UI_RoomPlanner.onRemoverDoRack(\'' + rack._id + '\',' + idx + ')" title="Devolver ao banco">✕</span>';
      if (m._fixo) html += '<span class="rack-cell-lock" title="Parte de um set, não é movida pelo otimizador">🔒</span>';
      if (m._primeira === true) html += '<span class="rack-cell-primeira" title="1ª do tipo — dá bônus de coleção">🥇</span>';
      else if (m._primeira === false) html += '<span class="rack-cell-duplicata" title="Duplicata — não dá bônus de coleção extra">🔁</span>';
      html += img
        ? '<img class="rack-miner-img" src="' + img + '" alt="' + m.name + '">'
        : '<span class="cell-name">' + m.name + '</span>';
      html += '</div>';
    });
    for (let i = 0; i < livres; i++) {
      const editAttrs = editable ? ' onclick="UI_RoomPlanner.onRackCellClick(this)" data-rack-id="' + rack._id + '" data-empty="1"' : '';
      html += '<div class="rack-cell empty-cell' + (editable ? ' editable' : '') + '"' + editAttrs + '></div>';
    }

    html += '</div></div>';
    return html;
  },

  _getMinerImage: function(name) {
    if (typeof MINERS_DATABASE === 'undefined') return '';
    const d = MINERS_DATABASE.find(d => d.name.toLowerCase() === name.toLowerCase() && d.imageUrl);
    return d ? d.imageUrl : '';
  },

  _getRarityClass: function(level) {
    const map = { Common: 'rarity-common', Uncommon: 'rarity-uncommon', Rare: 'rarity-rare', Epic: 'rarity-epic', Legendary: 'rarity-legendary', Unreal: 'rarity-unreal' };
    return map[level] || 'rarity-common';
  },

  // Recalcula poder base + bônus de coleção + bônus de rack pra um pool qualquer,
  // usando SEMPRE a mesma fórmula (aproximada) dos dois lados de uma comparação —
  // isso cancela qualquer viés sistemático da fórmula (ver _calcularPoderEstimado).
  _poderBrutoRecalculado: function(pool, racks) {
    const base = pool.reduce((s, m) => s + m.power, 0);
    const seen = new Set();
    let bonusSum = 0;
    pool.forEach(m => {
      const key = m.name.toLowerCase() + '|' + (m.level || m.level_label || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        bonusSum += (m.bonus_percent || 0);
      }
    });
    const colecaoBonus = base * (bonusSum / 10000);
    const rackFactorMap = {};
    racks.forEach(r => rackFactorMap[r._id] = (r.bonus || 0) / 10000);
    const rackBonus = pool.reduce((s, m) => s + m.power * (rackFactorMap[m._rackId] || 0), 0);
    const bonusDeSets = this._calcularBonusDeSetsNoPool(pool, base, racks);
    return base + colecaoBonus + rackBonus + bonusDeSets.percent + bonusDeSets.flat;
  },

  // Uma peça de SetsData "bate" com uma miner real por nome + poder (mesma tolerância usada
  // em UI_Inventario.getTotalMinerCount) — não dá pra confiar em nível/label porque o
  // SetsData usa level numérico (0,1,2...) e a API usa level_label ("Common", "Legendary"...),
  // formatos incompatíveis. Poder é bem mais específico por tier e evita esse problema.
  _matchSetPiece: function(setMiner, minerLike) {
    if (!minerLike || !minerLike.name) return false;
    if (setMiner.title.toLowerCase() !== minerLike.name.toLowerCase()) return false;
    const tolerancia = Math.max(0.001, setMiner.power * 0.01);
    return Math.abs((minerLike.power || 0) - setMiner.power) < tolerancia;
  },

  // Acha, dentre os racks instalados, quais são do TIPO temático de um set (por nome — ex:
  // "Royal Rack 8" pro Royal Set). Pode haver mais de um rack do mesmo tipo. Retorna null se
  // o set não tem rack próprio nos dados (não deveria acontecer, mas por garantia).
  _racksDoSet: function(set, racksInstalados) {
    if (!set.rack || !set.rack.title) return null;
    const ids = new Set();
    (racksInstalados || []).forEach(r => {
      if (r.name && r.name.toLowerCase() === set.rack.title.toLowerCase()) ids.add(r._id);
    });
    return ids;
  },

  // Status de UM set dado um conjunto de miners "instaladas" (ou candidatas a instalar):
  // quantas peças distintas do set batem, e se a faixa MÁXIMA do set está ativa.
  //
  // Confirmado com 3 testes reais (remover Spade Note sozinha, Spade+Heart, e só Heart —
  // sempre a partir das 4 peças completas): em NENHUM caso a faixa 1 (que só exige 2 peças)
  // ficou ativa mesmo sobrando 2 ou 3 peças — o bônus sempre foi de +45% pra 0% inteiro, nunca
  // pra +25%. Ou seja, o bônus de set NÃO é uma escada onde qualquer faixa alcançada conta —
  // só a faixa MÁXIMA do set é avaliada, e ela é tudo-ou-nada: só ativa com TODAS as peças que
  // ela exige, e cai pra ZERO com qualquer peça faltando (sem faixa intermediária de consolação).
  //
  // O bônus de set só conta miners instaladas ESPECIFICAMENTE no rack temático do próprio set
  // (ex: as miners do Royal Set só contam se estiverem dentro do rack "Royal Rack 8" — em
  // qualquer outro rack, mesmo instaladas na sala, não valem nada pro set). Por isso, quando
  // `racksDoSet` é passado, filtra `minersInstaladas` pelo `_rackId` antes de contar — passe
  // `null`/omita quando quiser ignorar essa exigência (ex: pra saber se o usuário "possui" a
  // peça em algum lugar, sala ou inventário, sem se importar onde).
  _statusDoSet: function(set, minersInstaladas, racksDoSet) {
    const elegiveis = racksDoSet ? minersInstaladas.filter(m => racksDoSet.has(m._rackId)) : minersInstaladas;
    const pecasInstaladas = set.miners.filter(sm => elegiveis.some(m => this._matchSetPiece(sm, m)));
    const qtd = pecasInstaladas.length;
    const faixaMaxima = set.levels.reduce((max, lvl) => (!max || lvl.condition_amount > max.condition_amount) ? lvl : max, null);
    const tierAtivo = (faixaMaxima && qtd >= faixaMaxima.condition_amount) ? faixaMaxima : null;
    return { set, qtd, tierAtivo, protegidoMinimo: tierAtivo ? tierAtivo.condition_amount : 0, pecasInstaladas };
  },

  // Bônus de TODOS os sets aplicável a um pool (instalado real ou simulado) — cada set ativo
  // contribui ou um % sobre o poder base (percent_power, mesma mecânica do bônus de coleção
  // normal) ou um valor fixo em Gh/s (bonus_power) — nunca os dois na mesma faixa. Precisa de
  // `racks` (os racks reais da sala) pra achar qual(is) é o rack temático de cada set.
  _calcularBonusDeSetsNoPool: function(pool, baseTotal, racks) {
    let percent = 0, flat = 0;
    if (typeof SetsData === 'undefined') return { percent, flat };
    SetsData.sets.forEach(set => {
      const racksDoSet = this._racksDoSet(set, racks || []);
      const status = this._statusDoSet(set, pool, racksDoSet);
      if (!status.tierAtivo) return;
      if (status.tierAtivo.percent_power) percent += baseTotal * (status.tierAtivo.percent_power / 10000);
      if (status.tierAtivo.bonus_power) flat += status.tierAtivo.bonus_power;
    });
    return { percent, flat };
  },

  // Quanto poder REAL cada faixa de um set vale hoje, e quanto se perde caindo pra cada
  // faixa mais baixa (ou saindo do set inteiro) — a base de referência é o poder base
  // instalado agora, então os valores em Gh/s são reais, não uma % abstrata.
  _progressoDeSets: function(userData) {
    if (typeof SetsData === 'undefined') return [];
    const racks = userData.roomData.racks || [];
    const roomMiners = userData.roomData.miners || [];
    const invMiners = (typeof UI_Inventario !== 'undefined' && UI_Inventario.minersCached) || [];

    const instaladas = roomMiners.map(m => ({ name: m.name, power: m.power, _rackId: m.placement?.user_rack_id }));
    const noInventario = [];
    invMiners.forEach(m => {
      for (let i = 0; i < (m.quantity || 1); i++) noInventario.push({ name: m.name, power: m.power });
    });

    const baseAtual = roomMiners.reduce((s, m) => s + m.power, 0);
    const valorDaFaixa = lvl => !lvl ? 0 : (lvl.percent_power ? baseAtual * (lvl.percent_power / 10000) : lvl.bonus_power);

    return SetsData.sets.map(set => {
      const racksDoSet = this._racksDoSet(set, racks);
      const temRackDoSet = !!(racksDoSet && racksDoSet.size);

      const statusInstalado = this._statusDoSet(set, instaladas, racksDoSet);
      // "posse total" ignora rack de propósito — é só pra saber se existe alguma unidade a
      // mais (na sala, fora do rack certo, ou no inventário) que poderia ser movida/instalada
      // pra contar de verdade.
      const statusPosseTotal = this._statusDoSet(set, instaladas.concat(noInventario), null);
      if (statusPosseTotal.qtd === 0) return null;

      const niveisOrdenados = [...set.levels].sort((a, b) => a.condition_amount - b.condition_amount);
      const valorAtual = valorDaFaixa(statusInstalado.tierAtivo);

      const faixas = niveisOrdenados.map(lvl => ({
        condition_amount: lvl.condition_amount,
        valor: valorDaFaixa(lvl),
        ativa: statusInstalado.tierAtivo === lvl,
        alcancada: statusInstalado.qtd >= lvl.condition_amount,
      }));

      const proximaFaixa = niveisOrdenados.find(lvl => lvl.condition_amount > statusInstalado.qtd);

      return {
        set,
        rackTitle: set.rack ? set.rack.title : null,
        temRackDoSet,
        qtdInstalada: statusInstalado.qtd,
        totalPecas: set.miners.length,
        temExtraForaDoRackOuInventario: statusPosseTotal.qtd > statusInstalado.qtd,
        valorAtual,
        faixas,
        proximaFaixa: proximaFaixa ? {
          faltam: proximaFaixa.condition_amount - statusInstalado.qtd,
          ganho: valorDaFaixa(proximaFaixa) - valorAtual,
        } : null,
      };
    }).filter(Boolean);
  },

  _renderProgressoSets: function(userData) {
    const progresso = this._progressoDeSets(userData);
    if (!progresso.length) return '';

    let html = '<div class="sets-progresso">';
    html += '<h3 class="sets-progresso-title">🎁 Progresso dos Sets</h3>';

    progresso.forEach(p => {
      html += '<div class="sets-progresso-card">';
      html += '<div class="sets-progresso-header">';
      html += '<strong>' + p.set.title + '</strong>';
      html += '<span class="sets-progresso-count">' + p.qtdInstalada + '/' + p.totalPecas + ' peças no rack "' + p.rackTitle + '"' + (p.temExtraForaDoRackOuInventario ? ' (+ peças fora dele/no inventário)' : '') + '</span>';
      html += '</div>';
      if (!p.temRackDoSet) {
        html += '<div class="sets-faixa-perda" style="margin-bottom:8px;">⚠️ Você ainda não tem o rack "' + p.rackTitle + '" instalado — sem ele, nenhuma peça conta pro bônus deste set, mesmo que estejam instaladas em outros racks.</div>';
      }

      html += '<div class="sets-progresso-faixas">';
      p.faixas.forEach(f => {
        const perda = p.valorAtual - f.valor;
        html += '<div class="sets-faixa-linha' + (f.ativa ? ' sets-faixa-ativa' : '') + '">';
        html += '<span class="sets-faixa-cond">' + f.condition_amount + '+ peças</span>';
        html += '<span class="sets-faixa-valor">' + Utils.formatPower(f.valor * 1e9) + '</span>';
        if (f.ativa) {
          html += '<span class="sets-faixa-tag">você está aqui</span>';
        } else if (f.alcancada) {
          html += '<span class="sets-faixa-tag">já alcançada</span>';
        } else if (perda > 0) {
          html += '<span class="sets-faixa-perda">cairia aqui, perdendo ' + Utils.formatPower(perda * 1e9) + '</span>';
        }
        html += '</div>';
      });
      // faixa "0 peças" — o que se perde saindo do set inteiro
      if (p.valorAtual > 0) {
        html += '<div class="sets-faixa-linha">';
        html += '<span class="sets-faixa-cond">0 peças (fora do set)</span>';
        html += '<span class="sets-faixa-valor">0</span>';
        html += '<span class="sets-faixa-perda">remover o set inteiro perde ' + Utils.formatPower(p.valorAtual * 1e9) + '</span>';
        html += '</div>';
      }
      html += '</div>';

      if (p.proximaFaixa) {
        html += '<div class="sets-progresso-proxima">Faltam <strong>' + p.proximaFaixa.faltam + '</strong> peça' + (p.proximaFaixa.faltam > 1 ? 's' : '') + ' pra próxima faixa — ganho estimado: <strong>+' + Utils.formatPower(p.proximaFaixa.ganho * 1e9) + '</strong></div>';
      }

      html += '</div>';
    });

    html += '</div>';
    return html;
  },

  // O poder real (userData.powerData.current_power) vem direto da API do jogo — é o
  // valor confiável. Recalcular esse total do zero (bônus de coleção + de rack) é só
  // uma aproximação nossa, que nunca bate 100% com a fórmula interna do jogo. Por isso,
  // em vez de usar o valor recalculado diretamente, ancoramos no valor real e somamos
  // só a DIFERENÇA entre o pool simulado e o pool real (calculados com a mesma fórmula
  // aproximada dos dois lados) — assim, sem nenhuma mudança simulada, o resultado bate
  // exatamente com o poder real, e só muda pelo que o usuário de fato alterou.
  _calcularPoderEstimado: function(pool, racks, userData) {
    const poolAtualReal = (userData.roomData.miners || []).map(m => ({
      name: m.name,
      level: m.level_label || m.level,
      power: m.power,
      bonus_percent: m.bonus_percent || 0,
      _rackId: m.placement?.user_rack_id,
    }));

    const recalculadoAtual = this._poderBrutoRecalculado(poolAtualReal, racks);
    const recalculadoNovo = this._poderBrutoRecalculado(pool, racks);
    const delta = recalculadoNovo - recalculadoAtual;

    return userData.powerData.current_power + delta;
  },

  // Mesma técnica de âncora+delta do _calcularPoderEstimado, só que isolando SÓ a parte do
  // bônus (coleção + set) — sem base nem bônus de rack, pra bater com o que a API chama de
  // "bonus"/"bonus_percent" (ver js/ui/resumo.js) e dar pra comparar lado a lado com o real.
  _calcularBonusEstimado: function(pool, racks, userData) {
    const poolAtualReal = (userData.roomData.miners || []).map(m => ({
      name: m.name,
      level: m.level_label || m.level,
      power: m.power,
      bonus_percent: m.bonus_percent || 0,
      _rackId: m.placement?.user_rack_id,
    }));

    const bonusBruto = (p) => {
      const base = p.reduce((s, m) => s + m.power, 0);
      const seen = new Set();
      let bonusSum = 0;
      p.forEach(m => {
        const key = m.name.toLowerCase() + '|' + (m.level || m.level_label || '').toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          bonusSum += (m.bonus_percent || 0);
        }
      });
      const colecaoBonus = base * (bonusSum / 10000);
      const bonusDeSets = this._calcularBonusDeSetsNoPool(p, base, racks);
      return colecaoBonus + bonusDeSets.percent + bonusDeSets.flat;
    };

    const delta = bonusBruto(pool) - bonusBruto(poolAtualReal);
    const valor = (userData.powerData.bonus || 0) + delta;
    const baseSimulado = pool.reduce((s, m) => s + m.power, 0);
    const percentual = baseSimulado > 0 ? (valor / baseSimulado) * 100 : 0;

    return { valor, percentual };
  },

  // Mantido só como helper genérico ("essa miner pertence a algum set?") — a proteção real
  // de sets não usa mais isso: ver _statusDoSet/_racksDoSet (Auto-Otimizar) e
  // _impactoDeRemoverPecaDeSet (edição manual), que sabem calcular o bônus de verdade,
  // exigindo inclusive o rack temático certo do set.
  _isSetMiner: function(name) {
    if (typeof MINERS_DATABASE === 'undefined') return false;
    return !!MINERS_DATABASE.find(d => d.name.toLowerCase() === name.toLowerCase() && d.isInSet);
  },

  // Quanto (se algo) uma miner instalada específica (por índice em roomData.miners) protege
  // de bônus de set — usado pra avisar o usuário ANTES de remover manualmente, em vez de
  // simplesmente bloquear a ação. Retorna null se remover essa miner não derruba faixa
  // nenhuma (ela não é de set, ou é excedente e sobra o suficiente sem ela).
  _impactoDeRemoverPecaDeSet: function(userData, minerIndex) {
    if (typeof SetsData === 'undefined') return null;
    const racks = userData.roomData.racks || [];
    const roomMiners = userData.roomData.miners || [];
    const miner = roomMiners[minerIndex];
    if (!miner) return null;

    const setDoMiner = SetsData.sets.find(set => set.miners.some(sm => this._matchSetPiece(sm, miner)));
    if (!setDoMiner) return null;

    const racksDoSet = this._racksDoSet(setDoMiner, racks);
    // se essa miner nem está no rack certo do set, ela já não contava pro bônus — remover
    // não muda a faixa de nada.
    if (racksDoSet && !racksDoSet.has(miner.placement?.user_rack_id)) return null;

    const baseAtual = roomMiners.reduce((s, m) => s + m.power, 0);
    const valorDaFaixa = lvl => !lvl ? 0 : (lvl.percent_power ? baseAtual * (lvl.percent_power / 10000) : lvl.bonus_power);

    const instaladasAntes = roomMiners.map((m, i) => ({ name: m.name, power: m.power, index: i, _rackId: m.placement?.user_rack_id }));
    const instaladasDepois = instaladasAntes.filter(m => m.index !== minerIndex);

    const statusAntes = this._statusDoSet(setDoMiner, instaladasAntes, racksDoSet);
    const statusDepois = this._statusDoSet(setDoMiner, instaladasDepois, racksDoSet);
    const valorAntes = valorDaFaixa(statusAntes.tierAtivo);
    const valorDepois = valorDaFaixa(statusDepois.tierAtivo);
    if (valorDepois >= valorAntes) return null;

    const labelFaixa = lvl => !lvl ? 'nenhuma faixa' : (lvl.percent_power ? '+' + (lvl.percent_power / 100).toFixed(2) + '%' : Utils.formatPower(lvl.bonus_power * 1e9));

    return {
      setTitle: setDoMiner.title,
      faixaAntes: labelFaixa(statusAntes.tierAtivo),
      faixaDepois: labelFaixa(statusDepois.tierAtivo),
      perda: valorAntes - valorDepois,
    };
  },

  // O Auto-Otimizar sempre recalcula do ZERO a partir do estado real da sala — se já
  // houver simulação ativa aqui no Planejador (trocas manuais feitas nesta aba), ele
  // avisa e descarta, porque otimizar "em cima" de edições manuais parciais é ambíguo
  // (não dá pra saber quais o usuário quer preservar).
  executarAutoOtimizacao: function() {
    const userData = State.getUserData();
    if (!userData) return;

    if (this.sim.ativo && !confirm('Isso vai descartar as remoções/adições/trocas feitas até agora e recalcular a sala do zero. Continuar?')) {
      return;
    }
    this.sim.resetar(userData);

    const racks = userData.roomData.racks || [];
    const roomMiners = userData.roomData.miners || [];
    const invMiners = UI_Inventario.minersCached || [];

    const racksOrdenados = [...racks].sort((a, b) => (b.bonus || 0) - (a.bonus || 0));
    const rackAssignments = {};
    const rackCapacity = {};
    racksOrdenados.forEach(r => {
      rackAssignments[r._id] = [];
      rackCapacity[r._id] = (r.rack_info?.width || 2) * (r.rack_info?.height || 3);
    });

    // Miners de set não são mais travadas (_fixo) — agora que o bônus de set entra na conta
    // (_calcularBonusDeSetsNoPool), a proteção vira um VALOR: cada peça que hoje é o mínimo
    // necessário pra manter a faixa de bônus atual de algum set ganha, na seleção, um reforço
    // de valor igual à faixa dividida pelo mínimo de peças — então o otimizador só troca essa
    // peça por outra coisa se a troca realmente compensar mais que perder a faixa inteira,
    // em vez de simplesmente proibir qualquer mexida (que era o comportamento antigo).
    const basePowerRealAtual = roomMiners.reduce((s, m) => s + m.power, 0);
    const valorProtecaoPorIndice = {};
    if (typeof SetsData !== 'undefined') {
      const instaladasComIndex = roomMiners.map((m, index) => ({ name: m.name, power: m.power, index, _rackId: m.placement?.user_rack_id }));
      SetsData.sets.forEach(set => {
        const racksDoSet = this._racksDoSet(set, racks);
        const status = this._statusDoSet(set, instaladasComIndex, racksDoSet);
        if (!status.protegidoMinimo || !status.tierAtivo) return;
        const valorDaFaixaAtual = status.tierAtivo.percent_power
          ? basePowerRealAtual * (status.tierAtivo.percent_power / 10000)
          : status.tierAtivo.bonus_power;
        const valorPorPeca = valorDaFaixaAtual / status.protegidoMinimo;
        const instaladas = instaladasComIndex
          .filter(m => racksDoSet.has(m._rackId))
          .filter(m => status.pecasInstaladas.some(sm => this._matchSetPiece(sm, m)))
          .sort((a, b) => a.power - b.power);
        instaladas.slice(0, status.protegidoMinimo).forEach(m => {
          valorProtecaoPorIndice[m.index] = (valorProtecaoPorIndice[m.index] || 0) + valorPorPeca;
        });
      });
    }

    // _minerIndexOriginal/_rackIdOriginal (instaladas) e _origemKey (do inventário) são a
    // convenção que o SimState (js/ui/simState.js) usa em qualquer instância — aqui só
    // preserva esses campos no pool pra manter esse rastreio dentro da simulação própria
    // do SmartRoom (this.sim), que é independente da simulação do Inventário.
    const pool = [];
    roomMiners.forEach((m, index) => {
      pool.push({
        name: m.name,
        level: m.level_label || m.level,
        power: m.power,
        bonus_percent: m.bonus_percent || 0,
        cells: m.width || 2,
        _minerIndexOriginal: index,
        _rackIdOriginal: m.placement?.user_rack_id,
        _valorProtecaoSet: valorProtecaoPorIndice[index] || 0,
        _placementY: m.placement?.y,
        _placementX: m.placement?.x,
      });
    });
    invMiners.forEach(m => {
      const qty = m.quantity || 1;
      const origemKey = UI_Inventario.getMinerUniqueId(m);
      for (let i = 0; i < qty; i++) {
        pool.push({
          name: m.name,
          level: m.level,
          power: m.power,
          bonus_percent: (m.bonus || 0) * 100,
          cells: m.cells || 2,
          _origemKey: origemKey,
          _adicionadaManual: true,
        });
      }
    });

    // Bônus de coleção é global: poderTotal = base*(1 + somaDosBonusUnicos/10000) + bônus de rack.
    // Isso tem DUAS consequências pro valor de cada candidata, e eu só considerava a primeira:
    //  1) Se ela for a primeira do seu nome+nível, ela ADICIONA um % novo à soma de bônus (valor
    //     proporcional à base inteira).
    //  2) TODA candidata — mesmo uma duplicata que não adiciona bônus nenhum — "pega carona" no
    //     bônus acumulado de TODAS as outras únicas já garantidas, porque o poder dela também é
    //     multiplicado por (1 + somaDosBonus/10000) no total final. Uma duplicata forte ganha
    //     bem mais do que o próprio poder dela sugere, exatamente por causa desse efeito — foi
    //     esse o motivo real de uma Plasma Ray duplicada (poder bruto baixo comparado a outras)
    //     valer muito mais na prática do que o cálculo anterior indicava.
    //
    // Por isso a referência agora estima os DOIS números de forma estável (poder base final E a
    // soma de bônus única que provavelmente vai entrar), escolhendo por poder bruto até a
    // capacidade acabar, e só depois calcula o valor de cada candidata com as duas partes.
    const capacidadeRestanteTotal = Object.values(rackCapacity).reduce((s, c) => s + c, 0);

    let capacidadeTeste = capacidadeRestanteTotal;
    let baseEstimadaFinal = 0;
    const vistosEstimativa = new Set();
    let bonusSumEstimado = 0;
    [...pool].sort((a, b) => b.power - a.power).forEach(m => {
      if (m.cells > capacidadeTeste) return;
      baseEstimadaFinal += m.power;
      capacidadeTeste -= m.cells;
      const key = m.name.toLowerCase() + '|' + (m.level || '').toLowerCase();
      if (!vistosEstimativa.has(key) && m.bonus_percent > 0) {
        bonusSumEstimado += m.bonus_percent;
        vistosEstimativa.add(key);
      }
    });
    const multiplicadorBonus = 1 + (bonusSumEstimado / 10000);

    // Empurrão de valor pra peças de set que faltam pra destravar a PRÓXIMA faixa de bônus
    // daquele set (ex: Royal Set tem +45% na faixa de 4 peças — se você tem 3 instaladas e
    // uma 4ª está disponível pra entrar, ela vale muito mais do que o poder dela sozinha
    // sugere). Só conta esse empurrão se TODAS as peças que faltam pra faixa realmente
    // estiverem disponíveis no pool agora — senão a faixa não seria alcançada de qualquer
    // jeito, e a candidata não deveria ganhar esse valor extra.
    const valorExtraSetPorChave = {};
    if (typeof SetsData !== 'undefined') {
      const instaladasAgora = roomMiners.map(m => ({ name: m.name, power: m.power, _rackId: m.placement?.user_rack_id }));
      SetsData.sets.forEach(set => {
        const racksDoSet = this._racksDoSet(set, racks);
        // sem o rack temático do set instalado, nenhuma peça vai contar de qualquer jeito —
        // não faz sentido dar empurrão de valor pra elas.
        if (!racksDoSet || !racksDoSet.size) return;

        const status = this._statusDoSet(set, instaladasAgora, racksDoSet);
        const jaTem = new Set(status.pecasInstaladas.map(sm => sm.title.toLowerCase() + '|' + sm.power));
        const faltantes = set.miners.filter(sm => !jaTem.has(sm.title.toLowerCase() + '|' + sm.power));
        if (!faltantes.length) return;

        const proximaFaixa = set.levels
          .filter(lvl => lvl.condition_amount > status.qtd)
          .sort((a, b) => a.condition_amount - b.condition_amount)[0];
        if (!proximaFaixa) return;

        const faltamPraProxima = proximaFaixa.condition_amount - status.qtd;
        const disponiveisNoPool = faltantes.filter(sm => pool.some(m => this._matchSetPiece(sm, m)));
        if (disponiveisNoPool.length < faltamPraProxima) return;

        // só vale a pena se o rack temático do set ainda tiver célula livre suficiente pras
        // peças que faltam (elas só contam se ficarem especificamente lá dentro).
        const celulasLivresNoRackDoSet = [...racksDoSet].reduce((s, rid) => s + (rackCapacity[rid] || 0), 0);
        const celulasNecessarias = disponiveisNoPool.slice(0, faltamPraProxima).reduce((s, sm) => {
          const m = pool.find(mm => this._matchSetPiece(sm, mm));
          return s + (m ? m.cells : 2);
        }, 0);
        if (celulasNecessarias > celulasLivresNoRackDoSet) return;

        const ganhoDaFaixa = proximaFaixa.percent_power
          ? baseEstimadaFinal * (proximaFaixa.percent_power / 10000)
          : proximaFaixa.bonus_power;
        const valorPorPeca = ganhoDaFaixa / faltamPraProxima;
        disponiveisNoPool.forEach(sm => {
          const key = sm.title.toLowerCase() + '|' + sm.power;
          valorExtraSetPorChave[key] = Math.max(valorExtraSetPorChave[key] || 0, valorPorPeca);
        });
      });
    }

    // A ordem usada aqui (poder bruto) decide quem "seria" a primeira de cada nome+nível —
    // ou seja, a cópia mais forte de cada miner é quem garante o bônus, o que também é o
    // resultado mais lógico (não importa fisicamente qual cópia segura o bônus).
    const seen = new Set();
    [...pool].sort((a, b) => b.power - a.power).forEach(m => {
      const key = m.name.toLowerCase() + '|' + (m.level || '').toLowerCase();
      m._isUniqueBonus = !seen.has(key) && m.bonus_percent > 0;
      seen.add(key);
      const valorBaseComBonusAcumulado = m.power * multiplicadorBonus;
      const valorNovoBonus = m._isUniqueBonus ? (m.bonus_percent * (baseEstimadaFinal / 10000)) : 0;
      const valorExtraSet = valorExtraSetPorChave[m.name.toLowerCase() + '|' + m.power] || 0;
      m._valorSelecao = valorBaseComBonusAcumulado + valorNovoBonus + valorExtraSet + (m._valorProtecaoSet || 0);
    });

    const prioridadeSelecao = [...pool].sort((a, b) => b._valorSelecao - a._valorSelecao);

    const incluidos = [];
    const bancoInicial = [];
    let capacidadeRestante = capacidadeRestanteTotal;
    prioridadeSelecao.forEach(m => {
      if (capacidadeRestante >= m.cells) {
        incluidos.push(m);
        capacidadeRestante -= m.cells;
      } else {
        bancoInicial.push(m);
      }
    });

    incluidos.sort((a, b) => b.power - a.power);

    // Peças de set têm destino de rack FIXO: só contam pro bônus do set se ficarem dentro do
    // rack temático dele (ex: Royal Set exige o rack "Royal Rack 8" especificamente) — por
    // isso não passam pelo preenchimento genérico por bônus (que poderia mandá-las pra
    // qualquer rack "melhor"), vão primeiro, direto pro(s) rack(s) certo(s) do próprio set.
    const racksDoSetPorSet = new Map();
    const setDaMiner = m => {
      if (typeof SetsData === 'undefined') return null;
      return SetsData.sets.find(set => set.miners.some(sm => this._matchSetPiece(sm, m))) || null;
    };

    const incluidosComRackFixo = [];
    const incluidosGerais = [];
    incluidos.forEach(m => {
      const set = setDaMiner(m);
      if (!set) { incluidosGerais.push(m); return; }
      if (!racksDoSetPorSet.has(set)) racksDoSetPorSet.set(set, this._racksDoSet(set, racks));
      const racksDoSet = racksDoSetPorSet.get(set);
      if (racksDoSet && racksDoSet.size) {
        incluidosComRackFixo.push({ miner: m, racksDoSet });
      } else {
        incluidosGerais.push(m);
      }
    });

    incluidosComRackFixo.forEach(({ miner, racksDoSet }) => {
      let alocada = false;
      const candidatos = [...racksDoSet];
      // prioriza voltar pro rack original dela, se ele for um dos racks válidos do set
      if (miner._rackIdOriginal && racksDoSet.has(miner._rackIdOriginal)) {
        candidatos.sort((a, b) => (a === miner._rackIdOriginal ? -1 : b === miner._rackIdOriginal ? 1 : 0));
      }
      for (const rackId of candidatos) {
        if (rackCapacity[rackId] >= miner.cells) {
          rackAssignments[rackId].push({ ...miner, _rackId: rackId });
          rackCapacity[rackId] -= miner.cells;
          alocada = true;
          break;
        }
      }
      if (!alocada) bancoInicial.push(miner);
    });

    // Racks com o MESMO % de bônus (empate) são agrupados em "camadas" — o poder total não
    // muda dependendo de qual rack empatado guarda qual miner (a soma é igual), então dentro
    // de uma camada a ordem de preenchimento é livre pra escolher pelo critério que ajuda a
    // montar no jogo: cada camada é ordenada pela posição FÍSICA (sala, depois y, depois x —
    // igual a _agruparRacksPorSala/_agruparRacksPorLinha), e o preenchimento é SEQUENCIAL —
    // enche o primeiro rack físico da camada até a capacidade antes de tocar no próximo. Como
    // as miners chegam aqui em ordem de poder decrescente, isso resulta em: primeiro rack da
    // camada com as mais fortes, segundo rack com as próximas mais fracas, e assim por diante.
    const comparaPosicaoFisica = (a, b) => {
      const ra = a.placement?.room_level || 0, rb = b.placement?.room_level || 0;
      if (ra !== rb) return ra - rb;
      const ay = a.placement?.y || 0, by = b.placement?.y || 0;
      if (ay !== by) return ay - by;
      return (a.placement?.x || 0) - (b.placement?.x || 0);
    };
    const camadasPorBonus = [];
    racksOrdenados.forEach(rack => {
      const ultima = camadasPorBonus[camadasPorBonus.length - 1];
      if (ultima && (ultima[0].bonus || 0) === (rack.bonus || 0)) {
        ultima.push(rack);
      } else {
        camadasPorBonus.push([rack]);
      }
    });
    camadasPorBonus.forEach(camada => camada.sort(comparaPosicaoFisica));

    const alocarNoMelhorRackDisponivel = (miner) => {
      for (let c = 0; c < camadasPorBonus.length; c++) {
        const camada = camadasPorBonus[c];
        for (const rack of camada) {
          if (rackCapacity[rack._id] >= miner.cells) {
            rackAssignments[rack._id].push({ ...miner, _rackId: rack._id });
            rackCapacity[rack._id] -= miner.cells;
            return true;
          }
        }
      }
      return false;
    };

    // A seleção só olha a capacidade AGREGADA da sala, não qual rack específico tem espaço
    // (isso é fragmentação normal: a soma bate, mas nenhum rack individual sobrou com célula
    // livre suficiente pra essa miner específica). Sem o fallback pro banco, ela simplesmente
    // desaparecia do resultado — nem ficava alocada, nem voltava pro banco.
    incluidosGerais.forEach(miner => {
      if (!alocarNoMelhorRackDisponivel(miner)) bancoInicial.push(miner);
    });

    // Preenche buracos que sobraram por fragmentação: como a seleção lá em cima só olhava a
    // capacidade AGREGADA da sala, uma miner (tipicamente de 1 célula) podia cair no banco
    // mesmo havendo uma célula livre de verdade sobrando num rack específico — sem essa
    // varredura final, o rack ficava com um buraco vazio na tela enquanto o banco tinha uma
    // miner do tamanho certo esperando pra entrar exatamente ali. Não mexe em peças de set
    // (elas só valem a pena no rack temático delas — ver bloco de incluidosComRackFixo acima).
    racksOrdenados.forEach(rack => {
      let indice;
      while (rackCapacity[rack._id] > 0 && (indice = bancoInicial.findIndex(m => !setDaMiner(m) && m.cells <= rackCapacity[rack._id])) !== -1) {
        const [miner] = bancoInicial.splice(indice, 1);
        rackAssignments[rack._id].push({ ...miner, _rackId: rack._id });
        rackCapacity[rack._id] -= miner.cells;
      }
    });

    // Dentro de cada rack, ordena por poder decrescente (mais forte no primeiro slot, mais
    // fraca no último) e apaga a posição física antiga (_placementY/_placementX) — sem isso
    // o _renderRackCard ignoraria essa ordem e desenharia pela posição real de origem (ver
    // comentário em ordemExibicao), que não tem relação nenhuma com o resultado novo do
    // Auto-Otimizar.
    Object.keys(rackAssignments).forEach(rackId => {
      rackAssignments[rackId].sort((a, b) => b.power - a.power);
      rackAssignments[rackId].forEach(m => {
        delete m._placementY;
        delete m._placementX;
      });
    });

    const allPlaced = Object.values(rackAssignments).flat();
    const poderEstimado = this._calcularPoderEstimado(allPlaced, racks, userData);
    const totalPool = pool.length;

    this.sim.rackAssignments = rackAssignments;
    this.sim.banco = bancoInicial;
    this.sim.poderEstimado = poderEstimado;
    this.sim.totalPlaced = allPlaced.length;
    this.sim.totalPool = totalPool;
    this.sim.ativo = true;

    this._plannerMode = 'otimizado';
    this._selectedSlot = null;

    this._rerender();
  },

  resetarSimulacao: function() {
    const userData = State.getUserData();
    if (!userData) return;
    if (!confirm('Descartar remoções/adições/trocas e voltar pro estado real da sala?')) return;
    this.sim.resetar(userData);
    this._selectedSlot = null;
    this._rerender();
  },

  setPlannerMode: function(mode) {
    this._plannerMode = mode;
    this._selectedSlot = null;
    this._rerender();
  },

  // Impacto individual = quanto o poder total simulado cai se aquela miner específica
  // saísse do plano (considerando se ela é a única responsável pelo bônus de coleção do seu tipo).
  // Mesma lógica de Calculations.calcularImpactos, mas aplicada ao pool simulado do otimizador.
  _anexarImpactosPool: function(pool, racks, userData) {
    const base = pool.reduce((s, m) => s + m.power, 0);
    const rackFactorMap = {};
    racks.forEach(r => rackFactorMap[r._id] = (r.bonus || 0) / 10000);

    const primeiraOcorrencia = {};
    pool.forEach((m, i) => {
      const key = m.name.toLowerCase() + '|' + (m.level || m.level_label || '').toLowerCase();
      if (!(key in primeiraOcorrencia)) primeiraOcorrencia[key] = i;
    });

    let bonusPercentualTotal = 0;
    Object.keys(primeiraOcorrencia).forEach(key => {
      bonusPercentualTotal += (pool[primeiraOcorrencia[key]].bonus_percent || 0) / 10000;
    });

    const rackBonusAtual = pool.reduce((s, m) => s + m.power * (rackFactorMap[m._rackId] || 0), 0);
    const poderAtualPool = base + base * bonusPercentualTotal + rackBonusAtual + (userData.powerData.games || 0) + (userData.powerData.temp || 0);

    pool.forEach((m, i) => {
      const key = m.name.toLowerCase() + '|' + (m.level || m.level_label || '').toLowerCase();
      const ehPrimeira = primeiraOcorrencia[key] === i;
      const minerBonusPercent = ehPrimeira ? ((m.bonus_percent || 0) / 10000) : 0;

      const novaBase = base - m.power;
      const novoBonusPercentual = bonusPercentualTotal - minerBonusPercent;
      const novoBonusPower = novaBase * novoBonusPercentual;
      const perdaRack = m.power * (rackFactorMap[m._rackId] || 0);
      const novoRackBonus = rackBonusAtual - perdaRack;
      const novoPoderTotal = novaBase + novoBonusPower + novoRackBonus + (userData.powerData.games || 0) + (userData.powerData.temp || 0);

      m._impact = poderAtualPool - novoPoderTotal;
      m._primeira = ehPrimeira;
    });
  },

  _bancoFiltro: '',
  _bancoOrdenacao: 'power',

  _agruparBanco: function(banco) {
    const map = {};
    banco.forEach((m, i) => {
      const key = m.name + '|' + (m.level || m.level_label || '');
      if (!map[key]) map[key] = { ...m, count: 0 };
      map[key].count++;
    });
    let grupos = Object.values(map);

    if (this._bancoFiltro) {
      const termo = this._bancoFiltro.toLowerCase();
      grupos = grupos.filter(g => g.name.toLowerCase().includes(termo));
    }

    const modo = this._bancoOrdenacao;
    grupos.sort((a, b) => {
      if (modo === 'name') return a.name.localeCompare(b.name);
      if (modo === 'bonus') return ((b.bonus_percent || 0) - (a.bonus_percent || 0));
      return b.power - a.power; // 'power' (padrão)
    });
    return grupos;
  },

  // Compara o estado REAL (userData.roomData.miners, com _rackIdOriginal preservado pelo
  // SimState) contra o resultado simulado (this.sim.rackAssignments/banco) e devolve só as
  // diferenças de verdade — sem isso, pra montar a sala igual no jogo o usuário tinha que
  // comparar visualmente os dois grids miner por miner, o que é lento e fácil de errar.
  _gerarListaDeAcoes: function(userData) {
    const racks = userData.roomData.racks || [];

    // Vários racks podem ter o MESMO nome (ex: dois "Train Rack 8" — o nome parece ser
    // tipo+nível do rack, não um identificador único). Sem incluir sala+posição no rótulo,
    // uma troca entre dois racks "iguais" no nome fica ilegível ("tira do Train Rack 8,
    // bota no Train Rack 8") — com sala+posição, o usuário acha o rack certo na tela.
    const salaMap = this._agruparRacksPorSala(racks);
    const labelPorRackId = {};
    Object.keys(salaMap).forEach(salaKey => {
      salaMap[salaKey].forEach((r, i) => {
        labelPorRackId[r._id] = r.name + ' (Sala ' + salaKey + ', rack ' + (i + 1) + ')';
      });
    });
    const nomeDoRack = (rackId) => labelPorRackId[rackId] || 'rack desconhecido';

    const rackAssignments = this.sim.rackAssignments || {};
    const destinoPorIndice = {};
    Object.keys(rackAssignments).forEach(rackId => {
      rackAssignments[rackId].forEach(item => {
        if (item._minerIndexOriginal != null) destinoPorIndice[item._minerIndexOriginal] = rackId;
      });
    });

    const acoes = [];
    const roomMiners = userData.roomData.miners || [];
    roomMiners.forEach((m, index) => {
      const rackOrigemId = m.placement?.user_rack_id;
      const rackDestinoId = destinoPorIndice[index];
      const nivel = m.level_label || m.level;
      if (rackDestinoId == null) {
        acoes.push({ tipo: 'remover', nome: m.name, nivel, de: nomeDoRack(rackOrigemId) });
      } else if (String(rackDestinoId) !== String(rackOrigemId)) {
        acoes.push({ tipo: 'mover', nome: m.name, nivel, de: nomeDoRack(rackOrigemId), para: nomeDoRack(rackDestinoId) });
      }
    });

    // Qualquer item alocado que NÃO seja uma miner já instalada de verdade (_minerIndexOriginal)
    // precisa ser instalado — seja ela adicionada manualmente na tabela do Inventário
    // (_origemKey) ou puxada direto do inventário pelo próprio Auto-Otimizar (sem nenhum dos
    // dois campos). Checar só _origemKey aqui fazia essas últimas somem da lista: o
    // Auto-Otimizar alocava a miner na simulação, mas a instrução de "instalar" nunca
    // aparecia, e quem seguisse a lista à risca ficava com o rack vazio de verdade.
    Object.keys(rackAssignments).forEach(rackId => {
      rackAssignments[rackId].forEach(item => {
        if (item._minerIndexOriginal == null) {
          acoes.push({ tipo: 'adicionar', nome: item.name, nivel: item.level || item.level_label, para: nomeDoRack(rackId) });
        }
      });
    });

    return acoes;
  },

  toggleListaDeAcoes: function() {
    this._acoesExpandido = !this._acoesExpandido;
    this._rerender();
  },

  // Accordion fechado por padrão — a lista pode ter mais de 200 itens (uma reorganização
  // grande da sala inteira), então deixar tudo aberto sempre polui a tela. O estado de
  // aberto/fechado fica em `_acoesExpandido` (não um <details> nativo) porque o painel
  // inteiro é re-renderizado via innerHTML a cada ação (mover miner, etc.) — um <details>
  // perderia o "open" nesse replace; guardando o estado à parte, ele sobrevive ao re-render.
  _renderListaDeAcoes: function(userData) {
    const acoes = this._gerarListaDeAcoes(userData);
    const aberto = this._acoesExpandido;
    let html = '<div class="room-planner-checklist">';
    html += '<div class="checklist-title" onclick="UI_RoomPlanner.toggleListaDeAcoes()">';
    html += '📋 Lista de ações pra montar isso no jogo <span class="checklist-count">' + acoes.length + '</span>';
    html += '<span class="checklist-toggle-icon">' + (aberto ? '▲' : '▼') + '</span>';
    html += '</div>';
    if (aberto) {
      if (acoes.length === 0) {
        html += '<p class="checklist-empty">Nada mudou de lugar — o estado simulado é igual ao real.</p>';
      } else {
        html += '<div class="checklist-items">';
        acoes.forEach((a, i) => {
          let texto;
          if (a.tipo === 'mover') texto = 'Tira <strong>' + a.nome + '</strong> (' + a.nivel + ') do <strong>' + a.de + '</strong> → bota no <strong>' + a.para + '</strong>';
          else if (a.tipo === 'remover') texto = 'Tira <strong>' + a.nome + '</strong> (' + a.nivel + ') do <strong>' + a.de + '</strong> e guarda no armazém';
          else texto = 'Instala <strong>' + a.nome + '</strong> (' + a.nivel + ') no <strong>' + a.para + '</strong>';
          html += '<label class="checklist-item checklist-' + a.tipo + '">';
          html += '<input type="checkbox" onchange="this.parentElement.classList.toggle(\'checklist-feito\', this.checked)">';
          html += '<span>' + texto + '</span>';
          html += '</label>';
        });
        html += '</div>';
      }
    }
    html += '</div>';
    return html;
  },

  _renderBanco: function() {
    const banco = this.sim.banco || [];
    let html = '<div class="room-planner-bench">';
    html += '<div class="bench-title">🗄️ Banco (miners disponíveis, ainda não alocadas) <span class="bench-count">' + banco.length + '</span></div>';

    if (banco.length === 0) {
      html += '<p class="planner-bench-empty">Nenhuma miner sobrando — tudo que coube já está alocado.</p>';
      html += '</div>';
      return html;
    }

    html += '<div class="bench-controls">';
    html += '<input type="text" class="bench-search" placeholder="🔎 Buscar miner..." value="' + this._bancoFiltro.replace(/"/g, '&quot;') + '" oninput="UI_RoomPlanner.setBancoFiltro(this.value)">';
    html += '<div class="bench-sort">';
    [
      { key: 'power', label: '⚡ Poder' },
      { key: 'bonus', label: '🎯 Bônus' },
      { key: 'name', label: '🔤 Nome' },
    ].forEach(({ key, label }) => {
      html += '<button class="bench-sort-btn' + (this._bancoOrdenacao === key ? ' active' : '') + '" onclick="UI_RoomPlanner.setBancoOrdenacao(\'' + key + '\')">' + label + '</button>';
    });
    html += '</div></div>';

    html += '<div class="bench-chips" id="roomPlannerBenchChips">';
    html += this._renderBenchChips();
    html += '</div>';

    html += '</div>';
    return html;
  },

  _renderBenchChips: function() {
    const banco = this.sim.banco || [];
    const grupos = this._agruparBanco(banco);
    if (grupos.length === 0) return '<p class="planner-bench-empty">Nenhuma miner encontrada pra "' + this._bancoFiltro + '".</p>';

    const userData = State.getUserData();
    const racks = userData?.roomData?.racks || [];
    const poolInstalado = Object.values(this.sim.rackAssignments || {}).flat();
    if (userData) this._anexarImpactoBanco(grupos, poolInstalado, racks, userData);

    let html = '';
    grupos.forEach(g => {
      const key = g.name + '|' + (g.level || g.level_label || '');
      const isSel = this._selectedSlot && this._selectedSlot.type === 'bench' && this._selectedSlot.key === key;
      const img = this._getMinerImage(g.name);
      const bonus = ((g.bonus_percent || 0) / 100);
      const impactoAttr = g._impact != null ? ' data-tip-impact="' + (g._impact >= 0 ? '+' : '') + Utils.formatPower(g._impact * 1e9) + '"' : '';
      html += '<div class="bench-chip' + (isSel ? ' bench-chip-selected' : '') + '" onclick="UI_RoomPlanner.onBenchChipClick(this)" data-bench-key="' + key + '"'
        + ' data-tip-status="' + g.name + ' (' + (g.level || g.level_label || '') + ')"'
        + ' data-tip-power="' + Utils.formatPower(g.power * 1e9) + '"'
        + ' data-tip-bonus="' + bonus.toFixed(2) + '%"'
        + impactoAttr + '>';
      html += img ? '<img class="bench-chip-img" src="' + img + '" alt="' + g.name + '">' : '';
      html += '<span class="bench-chip-name">' + g.name + '</span><span class="bench-chip-count">x' + g.count + '</span>';
      if (g._impact != null) {
        const cor = g._impact >= 0 ? '#4caf50' : '#f44336';
        html += '<span class="bench-chip-impact" style="color:' + cor + '">' + (g._impact >= 0 ? '+' : '') + Utils.formatPower(g._impact * 1e9) + '</span>';
      }
      html += '</div>';
    });
    return html;
  },

  // Impacto de cada grupo do banco = quanto o poder total subiria se UMA cópia daquela
  // miner entrasse no pool instalado agora, sem rack específico (por isso não soma bônus de
  // rack — só dá pra saber isso quando ela realmente for encaixada em algum). É o espelho de
  // _anexarImpactosPool (que calcula o quanto se PERDE tirando uma miner já instalada): aqui
  // calcula o quanto se GANHA colocando uma miner que ainda está fora.
  _anexarImpactoBanco: function(grupos, poolInstalado, racks, userData) {
    const base = poolInstalado.reduce((s, m) => s + m.power, 0);
    const rackFactorMap = {};
    racks.forEach(r => rackFactorMap[r._id] = (r.bonus || 0) / 10000);

    const chavesInstaladas = new Set();
    let bonusPercentualTotal = 0;
    poolInstalado.forEach(m => {
      const key = m.name.toLowerCase() + '|' + (m.level || m.level_label || '').toLowerCase();
      if (!chavesInstaladas.has(key)) {
        chavesInstaladas.add(key);
        bonusPercentualTotal += (m.bonus_percent || 0) / 10000;
      }
    });

    const rackBonusAtual = poolInstalado.reduce((s, m) => s + m.power * (rackFactorMap[m._rackId] || 0), 0);
    const extras = (userData.powerData.games || 0) + (userData.powerData.temp || 0);
    const poderAtual = base + base * bonusPercentualTotal + rackBonusAtual + extras;

    grupos.forEach(g => {
      const key = g.name.toLowerCase() + '|' + (g.level || g.level_label || '').toLowerCase();
      const ehPrimeira = !chavesInstaladas.has(key);
      const novaBase = base + g.power;
      const novoBonusPercentual = bonusPercentualTotal + (ehPrimeira ? (g.bonus_percent || 0) / 10000 : 0);
      const novoPoder = novaBase + novaBase * novoBonusPercentual + rackBonusAtual + extras;
      g._impact = novoPoder - poderAtual;
      g._primeira = ehPrimeira;
    });
  },

  setBancoFiltro: function(valor) {
    this._bancoFiltro = valor;
    const el = document.getElementById('roomPlannerBenchChips');
    if (el) el.innerHTML = this._renderBenchChips();
  },

  setBancoOrdenacao: function(modo) {
    this._bancoOrdenacao = modo;
    this._rerender();
  },

  onBenchChipClick: function(el) {
    if (!this.sim.inicializado) return;
    const key = el.dataset.benchKey;
    if (this._selectedSlot && this._selectedSlot.type === 'bench' && this._selectedSlot.key === key) {
      this._selectedSlot = null;
    } else {
      this._selectedSlot = { type: 'bench', key };
    }
    this._rerender();
  },

  onRackCellClick: function(el) {
    if (!this.sim.inicializado) return;
    const rackId = el.dataset.rackId;
    const isEmpty = el.dataset.empty === '1';
    const index = isEmpty ? -1 : parseInt(el.dataset.slotIndex, 10);

    if (!this._selectedSlot) {
      if (isEmpty) return;
      this._selectedSlot = { type: 'rack', rackId, index };
      this._rerender();
      return;
    }

    if (this._selectedSlot.type === 'bench') {
      const key = this._selectedSlot.key;
      this._selectedSlot = null;
      this._colocarDoBanco(key, { rackId, index });
      return;
    }

    const from = this._selectedSlot;
    this._selectedSlot = null;

    if (from.rackId === rackId && from.index === index) {
      this._rerender();
      return;
    }

    this._moverMinerOtimizado(from, { rackId, index });
  },

  onRemoverDoRack: function(rackId, index) {
    if (!this.sim.inicializado) return;
    const arr = this.sim.rackAssignments[rackId];
    const m = arr[index];
    if (!m) return;

    if (m._minerIndexOriginal != null) {
      const userData = State.getUserData();
      const impacto = this._impactoDeRemoverPecaDeSet(userData, m._minerIndexOriginal);
      if (impacto) {
        const msg = 'Remover essa miner derruba a faixa do set "' + impacto.setTitle + '" de ' + impacto.faixaAntes + ' pra ' + impacto.faixaDepois + ', perdendo ' + Utils.formatPower(impacto.perda * 1e9) + '. Continuar?';
        if (!confirm(msg)) return;
      }
    }

    arr.splice(index, 1);
    delete m._rackId;
    if (!this.sim.banco) this.sim.banco = [];
    this.sim.banco.push(m);
    this._selectedSlot = null;
    this._recalcularAutoResult();
  },

  _colocarDoBanco: function(key, to) {
    const userData = State.getUserData();
    const racks = userData.roomData.racks || [];
    const banco = this.sim.banco || [];
    const idx = banco.findIndex(m => (m.name + '|' + (m.level || m.level_label || '')) === key);
    if (idx === -1) return;
    const item = banco[idx];

    const capacidadeDoRack = (rackId) => {
      const r = racks.find(r => String(r._id) === String(rackId));
      return r ? (r.rack_info?.width || 2) * (r.rack_info?.height || 3) : 0;
    };

    const ra = this.sim.rackAssignments;

    if (to.index === -1) {
      const usado = ra[to.rackId].reduce((s, m) => s + this._cellsOf(m), 0);
      if (usado + this._cellsOf(item) > capacidadeDoRack(to.rackId)) {
        alert('Essa miner não cabe nesse rack.');
        return;
      }
      banco.splice(idx, 1);
      ra[to.rackId].push({ ...item, _rackId: to.rackId });
    } else {
      const toArr = ra[to.rackId];
      const antigo = toArr[to.index];
      if (!antigo) return;
      const usado = toArr.reduce((s, m) => s + this._cellsOf(m), 0) - this._cellsOf(antigo) + this._cellsOf(item);
      if (usado > capacidadeDoRack(to.rackId)) {
        alert('Essa miner não cabe nesse rack.');
        return;
      }
      banco.splice(idx, 1);
      toArr[to.index] = { ...item, _rackId: to.rackId };
      delete antigo._rackId;
      banco.push(antigo);
    }

    this.sim.banco = banco;
    this._recalcularAutoResult();
  },

  _moverMinerOtimizado: function(from, to) {
    const userData = State.getUserData();
    const racks = userData.roomData.racks || [];
    const capacidadeDoRack = (rackId) => {
      const r = racks.find(r => String(r._id) === String(rackId));
      return r ? (r.rack_info?.width || 2) * (r.rack_info?.height || 3) : 0;
    };

    const ra = this.sim.rackAssignments;
    const fromArr = ra[from.rackId];
    const minerFrom = fromArr[from.index];
    if (!minerFrom) return;

    if (to.index === -1) {
      if (to.rackId !== from.rackId) {
        const usadoDestino = ra[to.rackId].reduce((s, m) => s + this._cellsOf(m), 0);
        if (usadoDestino + this._cellsOf(minerFrom) > capacidadeDoRack(to.rackId)) {
          alert('Essa miner não cabe nesse rack.');
          return;
        }
        fromArr.splice(from.index, 1);
        ra[to.rackId].push({ ...minerFrom, _rackId: to.rackId });
      }
    } else {
      const toArr = ra[to.rackId];
      const minerTo = toArr[to.index];
      if (!minerTo) return;
      if (from.rackId === to.rackId) {
        fromArr[from.index] = minerTo;
        toArr[to.index] = minerFrom;
      } else {
        const usadoFrom = fromArr.reduce((s, m) => s + this._cellsOf(m), 0) - this._cellsOf(minerFrom) + this._cellsOf(minerTo);
        const usadoTo = toArr.reduce((s, m) => s + this._cellsOf(m), 0) - this._cellsOf(minerTo) + this._cellsOf(minerFrom);
        if (usadoFrom > capacidadeDoRack(from.rackId) || usadoTo > capacidadeDoRack(to.rackId)) {
          alert('Essa troca não cabe nos racks.');
          return;
        }
        fromArr[from.index] = { ...minerTo, _rackId: from.rackId };
        toArr[to.index] = { ...minerFrom, _rackId: to.rackId };
      }
    }

    this._recalcularAutoResult();
  },

  _recalcularAutoResult: function() {
    const userData = State.getUserData();
    this.sim.recalcular(userData);
    this.sim.ativo = true;
    this._rerender();
  },
};

window.UI_RoomPlanner = UI_RoomPlanner;
