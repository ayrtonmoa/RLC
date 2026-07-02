// js/ui/roomPlanner.js - Planejador de Sala: layout dos racks + auto-otimizacao

const UI_RoomPlanner = {
  _plannerMode: 'atual',
  _selectedSlot: null,

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

  // Sem animação — evita o "pulo" visual toda vez que a aba Inventário re-renderiza
  // (ex: depois de qualquer ação na tabela) e o Planejador de Sala é redesenhado junto.
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
    html += '<h3 class="room-planner-title">🏠 Planejador de Sala</h3>';
    html += '<div class="room-planner-power-badge">⚡ Poder atual: <strong>' + Utils.formatPower(userData.powerData.current_power * 1e9) + '</strong></div>';
    html += '</div>';
    html += '<div class="room-planner-actions">';
    html += '<button onclick="UI_RoomPlanner.executarAutoOtimizacao()" class="room-planner-auto-btn">⚡ Auto-Otimizar <span class="planner-pool-count">' + poolSize + ' miners disponíveis</span></button>';
    if (SimState.ativo) html += '<button onclick="UI_RoomPlanner.resetarSimulacao()" class="room-planner-reset-btn" title="Descarta remoções/adições/trocas e volta pro estado real">🔄 Resetar simulação</button>';
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

  // O Planejador de Sala vive embutido dentro da aba Inventário. Qualquer mudança
  // aqui (trocar miner, mover pro banco, etc) precisa refazer a tabela do Inventário
  // também — senão os badges de removida/adicionada ficam desatualizados até o usuário
  // mexer em algo que force um re-render da tabela.
  _rerender: function() {
    if (typeof UI_Inventario !== 'undefined' && UI_Inventario.minersCached && document.getElementById('roomPlannerInline')) {
      UI_Inventario.renderResultado();
      return;
    }
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
          html += this._renderRackCard(rack, miners, false, numeroPorRackId[rack._id]);
        });
        html += '</div>';
      });
      return html;
    });
  },

  _renderSalaOtimizada: function(userData) {
    const racks = userData.roomData.racks || [];
    SimState.garantirInicializado(userData);
    if (SimState.poderEstimado == null) SimState.recalcular(userData);
    const result = SimState;
    const poderAtual = userData.powerData.current_power;
    const ganho = result.poderEstimado - poderAtual;
    const ganhoColor = ganho >= 0 ? '#4caf50' : '#f44336';
    const ganhoStr = (ganho >= 0 ? '+' : '') + Utils.formatPower(ganho * 1e9);
    const ganhoPercent = ((ganho / poderAtual) * 100).toFixed(2);

    let html = '<div class="room-planner-comparison">';
    html += '<div class="comparison-item"><span class="comparison-label">Atual</span><span class="comparison-value">' + Utils.formatPower(poderAtual * 1e9) + '</span></div>';
    html += '<div class="comparison-arrow">→</div>';
    html += '<div class="comparison-item"><span class="comparison-label">Estimado</span><span class="comparison-value">' + Utils.formatPower(result.poderEstimado * 1e9) + '</span></div>';
    html += '<div class="comparison-delta" style="color:' + ganhoColor + '">' + ganhoStr + ' (' + (ganho >= 0 ? '+' : '') + ganhoPercent + '%)</div>';
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
          inner += this._renderRackCard(rack, miners, true, numeroPorRackId[rack._id]);
        });
        inner += '</div>';
      });
      return inner;
    });

    html += this._renderBanco();
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

  _renderRackCard: function(rack, miners, editable, numero) {
    const bonusPercent = (rack.bonus || 0) / 100;
    const width = rack.rack_info?.width || 2;
    const height = rack.rack_info?.height || 3;
    const capacidade = width * height;
    const celulasUsadas = miners.reduce((s, m) => s + (m.width || m.cells || 2), 0);
    const livres = capacidade - celulasUsadas;

    const poderBaseRack = miners.reduce((s, m) => s + m.power, 0);
    const poderComBonusRack = poderBaseRack * (1 + bonusPercent / 100);
    const extraRack = 'Base: ' + Utils.formatPower(poderBaseRack * 1e9) + " <span style='opacity:.6;'>(sem bônus)</span>";

    let html = '<div class="room-planner-rack">';
    if (numero) html += '<div class="room-planner-rack-numero" title="' + rack.name + '">R' + numero + '</div>';
    html += '<div class="room-planner-rack-header"'
      + ' data-tip-status="' + rack.name + '"'
      + ' data-tip-power="' + Utils.formatPower(poderComBonusRack * 1e9) + '"'
      + ' data-tip-bonus="' + bonusPercent.toFixed(2) + '%"'
      + ' data-tip-extra="' + extraRack + '">';
    html += '<span class="rack-bonus' + (bonusPercent > 0 ? ' bonus-positive' : '') + '">' + (bonusPercent > 0 ? '+' : '') + bonusPercent.toFixed(2) + '%</span>';
    html += '<span class="rack-slots">' + (livres > 0 ? livres + ' livre' + (livres > 1 ? 's' : '') : 'cheio') + '</span>';
    html += '</div>';

    html += '<div class="room-planner-grid" style="--rack-w:' + width + ';">';

    const lista = editable ? miners : [...miners].sort((a, b) => {
      const ay = a.placement?.y ?? 0, by = b.placement?.y ?? 0;
      if (ay !== by) return ay - by;
      return (a.placement?.x ?? 0) - (b.placement?.x ?? 0);
    });

    lista.forEach((m, idx) => {
      const level = m.level_label || m.level || '';
      const w = Math.min(m.width || m.cells || 2, width);
      const bonus = ((m.bonus_percent ?? (m.bonus != null ? m.bonus * 100 : 0)) / 100);
      const rc = this._getRarityClass(level);
      const img = this._getMinerImage(m.name);
      const podeEditar = editable && !m._fixo;
      const isSelected = podeEditar && this._selectedSlot && this._selectedSlot.type === 'rack' && this._selectedSlot.rackId === rack._id && this._selectedSlot.index === idx;
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
    return base + colecaoBonus + rackBonus;
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

  // Sets (ex: Halloween, Disco...) dão bônus próprio de coleção de set e o código
  // não sabe recalcular/validar esse bônus — por isso o otimizador (e a edição manual)
  // nunca tocam nessas miners: elas ficam fixas no rack onde já estão hoje.
  _isSetMiner: function(name) {
    if (typeof MINERS_DATABASE === 'undefined') return false;
    return !!MINERS_DATABASE.find(d => d.name.toLowerCase() === name.toLowerCase() && d.isInSet);
  },

  // O Auto-Otimizar sempre recalcula do ZERO a partir do estado real da sala — se já
  // houver simulação ativa (remoções/adições feitas no Inventário, trocas feitas aqui),
  // ele avisa e descarta, porque otimizar "em cima" de edições manuais parciais é
  // ambíguo (não dá pra saber quais o usuário quer preservar).
  executarAutoOtimizacao: function() {
    const userData = State.getUserData();
    if (!userData) return;

    if (SimState.ativo && !confirm('Isso vai descartar as remoções/adições/trocas feitas até agora e recalcular a sala do zero. Continuar?')) {
      return;
    }
    SimState.resetar(userData);

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

    // Miners de set ficam travadas no rack atual delas, consumindo a capacidade
    // antes de qualquer redistribuição — o otimizador só mexe no que sobra.
    // Se o rack_id dela não bater com nenhum rack reconhecido, ela vai pro banco
    // (órfã) em vez de simplesmente desaparecer do resultado.
    const setKeysFixos = new Set();
    let setMinerCount = 0;
    let basePowerFixos = 0;
    const orfasFixas = [];
    roomMiners.forEach((m, index) => {
      if (!this._isSetMiner(m.name)) return;
      const rackId = m.placement?.user_rack_id;
      const cells = m.width || 2;
      if (!rackAssignments[rackId]) {
        orfasFixas.push({
          name: m.name,
          level: m.level_label || m.level,
          power: m.power,
          bonus_percent: m.bonus_percent || 0,
          cells: cells,
          _fixo: true,
          _minerIndexOriginal: index,
          _rackIdOriginal: rackId,
        });
        return;
      }
      rackAssignments[rackId].push({
        name: m.name,
        level: m.level_label || m.level,
        power: m.power,
        bonus_percent: m.bonus_percent || 0,
        cells: cells,
        _rackId: rackId,
        _fixo: true,
        _minerIndexOriginal: index,
        _rackIdOriginal: rackId,
      });
      rackCapacity[rackId] = Math.max(0, rackCapacity[rackId] - cells);
      setKeysFixos.add(m.name.toLowerCase() + '|' + (m.level_label || m.level || '').toLowerCase());
      setMinerCount++;
      basePowerFixos += m.power;
    });

    // _minerIndexOriginal/_rackIdOriginal (instaladas) e _origemKey (do inventário) são o
    // que a tabela do Inventário usa (via SimState.estaRemovida/contarPorOrigem) pra saber
    // quais linhas marcar como removidas/adicionadas — sem isso o Auto-Otimizar mexe nas
    // miners mas a tabela não reflete nada.
    const pool = [];
    roomMiners.forEach((m, index) => {
      if (this._isSetMiner(m.name)) return;
      pool.push({
        name: m.name,
        level: m.level_label || m.level,
        power: m.power,
        bonus_percent: m.bonus_percent || 0,
        cells: m.width || 2,
        _minerIndexOriginal: index,
        _rackIdOriginal: m.placement?.user_rack_id,
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
    let baseEstimadaFinal = basePowerFixos;
    const vistosEstimativa = new Set(setKeysFixos);
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

    // A ordem usada aqui (poder bruto) decide quem "seria" a primeira de cada nome+nível —
    // ou seja, a cópia mais forte de cada miner é quem garante o bônus, o que também é o
    // resultado mais lógico (não importa fisicamente qual cópia segura o bônus).
    const seen = new Set(setKeysFixos);
    [...pool].sort((a, b) => b.power - a.power).forEach(m => {
      const key = m.name.toLowerCase() + '|' + (m.level || '').toLowerCase();
      m._isUniqueBonus = !seen.has(key) && m.bonus_percent > 0;
      seen.add(key);
      const valorBaseComBonusAcumulado = m.power * multiplicadorBonus;
      const valorNovoBonus = m._isUniqueBonus ? (m.bonus_percent * (baseEstimadaFinal / 10000)) : 0;
      m._valorSelecao = valorBaseComBonusAcumulado + valorNovoBonus;
    });

    const prioridadeSelecao = [...pool].sort((a, b) => b._valorSelecao - a._valorSelecao);

    const incluidos = [];
    const bancoInicial = [...orfasFixas];
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

    // A seleção só olha a capacidade AGREGADA da sala, não qual rack específico tem espaço
    // (isso é fragmentação normal: a soma bate, mas nenhum rack individual sobrou com célula
    // livre suficiente pra essa miner específica). Sem esse "else", ela simplesmente
    // desaparecia do resultado — nem ficava alocada, nem voltava pro banco.
    incluidos.forEach(miner => {
      let alocada = false;
      for (const rack of racksOrdenados) {
        if (rackCapacity[rack._id] >= miner.cells) {
          rackAssignments[rack._id].push({ ...miner, _rackId: rack._id });
          rackCapacity[rack._id] -= miner.cells;
          alocada = true;
          break;
        }
      }
      if (!alocada) bancoInicial.push(miner);
    });

    const allPlaced = Object.values(rackAssignments).flat();
    const poderEstimado = this._calcularPoderEstimado(allPlaced, racks, userData);
    const totalPool = pool.length + setMinerCount + orfasFixas.length;

    SimState.rackAssignments = rackAssignments;
    SimState.banco = bancoInicial;
    SimState.poderEstimado = poderEstimado;
    SimState.totalPlaced = allPlaced.length;
    SimState.totalPool = totalPool;
    SimState.ativo = true;

    this._plannerMode = 'otimizado';
    this._selectedSlot = null;

    this._rerender();
  },

  resetarSimulacao: function() {
    const userData = State.getUserData();
    if (!userData) return;
    if (!confirm('Descartar remoções/adições/trocas e voltar pro estado real da sala?')) return;
    SimState.resetar(userData);
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

  _renderBanco: function() {
    const banco = SimState.banco || [];
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
    const banco = SimState.banco || [];
    const grupos = this._agruparBanco(banco);
    if (grupos.length === 0) return '<p class="planner-bench-empty">Nenhuma miner encontrada pra "' + this._bancoFiltro + '".</p>';

    let html = '';
    grupos.forEach(g => {
      const key = g.name + '|' + (g.level || g.level_label || '');
      const isSel = this._selectedSlot && this._selectedSlot.type === 'bench' && this._selectedSlot.key === key;
      const img = this._getMinerImage(g.name);
      const bonus = ((g.bonus_percent || 0) / 100);
      html += '<div class="bench-chip' + (isSel ? ' bench-chip-selected' : '') + '" onclick="UI_RoomPlanner.onBenchChipClick(this)" data-bench-key="' + key + '"'
        + ' data-tip-status="' + g.name + ' (' + (g.level || g.level_label || '') + ')"'
        + ' data-tip-power="' + Utils.formatPower(g.power * 1e9) + '"'
        + ' data-tip-bonus="' + bonus.toFixed(2) + '%">';
      html += img ? '<img class="bench-chip-img" src="' + img + '" alt="' + g.name + '">' : '';
      html += '<span class="bench-chip-name">' + g.name + '</span><span class="bench-chip-count">x' + g.count + '</span>';
      html += '</div>';
    });
    return html;
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
    if (!SimState.inicializado) return;
    const key = el.dataset.benchKey;
    if (this._selectedSlot && this._selectedSlot.type === 'bench' && this._selectedSlot.key === key) {
      this._selectedSlot = null;
    } else {
      this._selectedSlot = { type: 'bench', key };
    }
    this._rerender();
  },

  onRackCellClick: function(el) {
    if (!SimState.inicializado) return;
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
    if (!SimState.inicializado) return;
    const arr = SimState.rackAssignments[rackId];
    const m = arr[index];
    if (!m) return;
    arr.splice(index, 1);
    delete m._rackId;
    if (!SimState.banco) SimState.banco = [];
    SimState.banco.push(m);
    this._selectedSlot = null;
    this._recalcularAutoResult();
  },

  _colocarDoBanco: function(key, to) {
    const userData = State.getUserData();
    const racks = userData.roomData.racks || [];
    const banco = SimState.banco || [];
    const idx = banco.findIndex(m => (m.name + '|' + (m.level || m.level_label || '')) === key);
    if (idx === -1) return;
    const item = banco[idx];

    const capacidadeDoRack = (rackId) => {
      const r = racks.find(r => r._id === rackId);
      return r ? (r.rack_info?.width || 2) * (r.rack_info?.height || 3) : 0;
    };

    const ra = SimState.rackAssignments;

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

    SimState.banco = banco;
    this._recalcularAutoResult();
  },

  _moverMinerOtimizado: function(from, to) {
    const userData = State.getUserData();
    const racks = userData.roomData.racks || [];
    const capacidadeDoRack = (rackId) => {
      const r = racks.find(r => r._id === rackId);
      return r ? (r.rack_info?.width || 2) * (r.rack_info?.height || 3) : 0;
    };

    const ra = SimState.rackAssignments;
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
    SimState.recalcular(userData);
    SimState.ativo = true;
    this._rerender();
  },
};

window.UI_RoomPlanner = UI_RoomPlanner;
