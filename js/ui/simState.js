// js/ui/simState.js - Fábrica de estado de simulação. Inventário e SmartRoom
// têm cada um a SUA PRÓPRIA instância (UI_Inventario.sim / UI_RoomPlanner.sim) — mexer
// numa não afeta a outra. Antes isso era um único objeto global compartilhado; virou
// fábrica pra cada aba ter o seu, sem duplicar a lógica.
//
// rackAssignments: { rackId: [miner...] } — miners fisicamente alocadas em cada rack.
// banco: [miner...] — miners disponíveis mas sem rack definido (removidas da sala ou
//        recém-adicionadas do inventário, esperando o usuário escolher onde encaixar).
//
// Miners instaladas de verdade carregam `_minerIndexOriginal`/`_rackIdOriginal` (o
// índice em userData.roomData.miners e o rack onde estavam), o que permite "desfazer"
// uma remoção devolvendo a miner pro lugar exato onde ela estava. Miners adicionadas
// via inventário carregam `_origemKey` (o uniqueId da linha do Inventário que originou
// a adição), o que permite desfazer a adição inteira mesmo que parte dela já tenha sido
// alocada num rack pelo Planejador.

function criarSimState() {
  return {
    inicializado: false,
    ativo: false,
    rackAssignments: {},
    banco: [],
    poderEstimado: null,
    totalPlaced: 0,
    totalPool: 0,

    _isSetMiner: function(name) {
      if (typeof MINERS_DATABASE === 'undefined') return false;
      return !!MINERS_DATABASE.find(d => d.name.toLowerCase() === name.toLowerCase() && d.isInSet);
    },

    _cellsOf: function(m) {
      return m.width || m.cells || 2;
    },

    garantirInicializado: function(userData, forcar) {
      if (this.inicializado && !forcar) return;
      const racks = userData.roomData.racks || [];
      const roomMiners = userData.roomData.miners || [];

      const rackAssignments = {};
      racks.forEach(r => { rackAssignments[r._id] = []; });

      // Miners de set não ficam mais travadas (_fixo) na edição manual — remover uma delas só
      // avisa o impacto real via confirm() antes de agir (ver UI_RoomPlanner._impactoDeRemoverPecaDeSet,
      // chamado em UI_Inventario.toggleRemoverMiner e UI_RoomPlanner.onRemoverDoRack), em vez de
      // bloquear a ação de cara.
      //
      // Se o rack_id da miner não bate com nenhum rack reconhecido (dado inconsistente,
      // rack bloqueado/fora da lista etc), ela NUNCA pode simplesmente sumir — vai pro
      // banco em vez de ser descartada silenciosamente.
      const orfas = [];
      roomMiners.forEach((m, index) => {
        const rackId = m.placement?.user_rack_id;
        const item = {
          name: m.name,
          level: m.level_label || m.level,
          power: m.power,
          bonus_percent: m.bonus_percent || 0,
          cells: m.width || 2,
          _rackIdOriginal: rackId,
          _minerIndexOriginal: index,
          // preserva a posição física original só pra exibição — sem isso, o Planejador de
          // Sala mostra as miners na ordem do array em vez da ordem real da prateleira, e
          // parece que elas "trocaram de lugar" sozinhas ao entrar na Simulação.
          _placementY: m.placement?.y,
          _placementX: m.placement?.x,
        };
        if (!rackAssignments[rackId]) {
          orfas.push(item);
          return;
        }
        item._rackId = rackId;
        rackAssignments[rackId].push(item);
      });

      this.rackAssignments = rackAssignments;

      // O banco já começa com todo o inventário disponível (ainda não instalado), pronto
      // pra arrastar pra um rack — não precisa rodar Auto-Otimizar nem "adicionar" cada
      // miner na tabela primeiro. Essas unidades NÃO carregam `_origemKey`: esse campo é
      // reservado pra quando o usuário clica "adicionar" na tabela do Inventário (que usa
      // SimState.contarPorOrigem pra decidir se mostra "adicionar" ou "desfazer adição") —
      // se a gente marcasse a disponibilidade padrão com o mesmo _origemKey, o botão de
      // adicionar da tabela quebraria (o clique cairia direto no fluxo de "desfazer",
      // já que contarPorOrigem já seria > 0 mesmo sem nenhuma ação explícita do usuário).
      const banco = [];
      if (typeof UI_Inventario !== 'undefined' && UI_Inventario.minersCached) {
        UI_Inventario.minersCached.forEach(m => {
          const qty = m.quantity || 1;
          for (let i = 0; i < qty; i++) {
            banco.push({
              name: m.name,
              level: m.level,
              power: m.power,
              bonus_percent: (m.bonus || 0) * 100,
              cells: m.cells || 2,
              _disponivelPadrao: true,
            });
          }
        });
      }

      this.banco = banco.concat(orfas);
      this.inicializado = true;
      this.recalcular(userData);
    },

    resetar: function(userData) {
      this.inicializado = false;
      this.ativo = false;
      this.garantirInicializado(userData, true);
    },

    recalcular: function(userData) {
      const allPlaced = Object.values(this.rackAssignments).flat();
      const racks = userData.roomData.racks || [];
      this.poderEstimado = UI_RoomPlanner._calcularPoderEstimado(allPlaced, racks, userData);
      this.totalPlaced = allPlaced.length;
      this.totalPool = allPlaced.length + this.banco.length;
    },

    // Miner instalada (pelo índice original em roomData.miners) sai do rack dela e vai
    // pro banco. Retorna false se já não estiver em rack nenhum. O aviso de impacto em
    // peças de set acontece ANTES de chamar isso (ver UI_Inventario.toggleRemoverMiner) —
    // aqui não bloqueia mais nada, `_fixo` não é mais setado por nenhum fluxo de sets.
    removerInstaladaPorIndice: function(userData, minerIndex) {
      this.garantirInicializado(userData);
      for (const rackId of Object.keys(this.rackAssignments)) {
        const arr = this.rackAssignments[rackId];
        const idx = arr.findIndex(m => m._minerIndexOriginal === minerIndex);
        if (idx === -1) continue;
        if (arr[idx]._fixo) return false;
        const [m] = arr.splice(idx, 1);
        delete m._rackId;
        this.banco.push(m);
        this.ativo = true;
        this.recalcular(userData);
        return true;
      }
      return false;
    },

    // Desfaz a remoção: devolve a miner pro rack original dela, se ainda houver espaço lá.
    // Retorna true (ok), false (não estava removida) ou 'sem_espaco'.
    desfazerRemocaoPorIndice: function(userData, minerIndex) {
      this.garantirInicializado(userData);
      const idx = this.banco.findIndex(m => m._minerIndexOriginal === minerIndex);
      if (idx === -1) return false;
      const item = this.banco[idx];
      const rackId = item._rackIdOriginal;
      const rack = (userData.roomData.racks || []).find(r => r._id === rackId);
      const capacidade = rack ? (rack.rack_info?.width || 2) * (rack.rack_info?.height || 3) : 0;
      const usado = (this.rackAssignments[rackId] || []).reduce((s, m) => s + this._cellsOf(m), 0);
      if (usado + this._cellsOf(item) > capacidade) return 'sem_espaco';

      this.banco.splice(idx, 1);
      item._rackId = rackId;
      if (!this.rackAssignments[rackId]) this.rackAssignments[rackId] = [];
      this.rackAssignments[rackId].push(item);
      this.recalcular(userData);
      return true;
    },

    estaRemovida: function(minerIndex) {
      return this.banco.some(m => m._minerIndexOriginal === minerIndex);
    },

    // Adiciona N unidades de uma miner do catálogo/inventário ao banco, marcadas com
    // `origemKey` (o uniqueId da linha do Inventário) pra permitir desfazer depois.
    adicionarAoBanco: function(userData, minerCatalogo, quantidade, origemKey) {
      this.garantirInicializado(userData);
      for (let i = 0; i < quantidade; i++) {
        this.banco.push({
          name: minerCatalogo.name,
          level: minerCatalogo.level,
          power: minerCatalogo.power,
          bonus_percent: (minerCatalogo.bonus || 0) * 100,
          cells: minerCatalogo.cells || 2,
          _origemKey: origemKey,
          _adicionadaManual: true,
        });
      }
      this.ativo = true;
      this.recalcular(userData);
    },

    // Remove todas as unidades adicionadas com essa origem, estejam elas no banco ou já
    // alocadas em algum rack — usado pra desfazer uma adição feita pela tabela do Inventário.
    removerPorOrigem: function(userData, origemKey) {
      this.garantirInicializado(userData);
      this.banco = this.banco.filter(m => m._origemKey !== origemKey);
      Object.keys(this.rackAssignments).forEach(rackId => {
        this.rackAssignments[rackId] = this.rackAssignments[rackId].filter(m => m._origemKey !== origemKey);
      });
      this.recalcular(userData);
    },

    contarPorOrigem: function(origemKey) {
      const noBanco = this.banco.filter(m => m._origemKey === origemKey).length;
      const nosRacks = Object.values(this.rackAssignments).flat().filter(m => m._origemKey === origemKey).length;
      return noBanco + nosRacks;
    },
  };
}

window.criarSimState = criarSimState;
