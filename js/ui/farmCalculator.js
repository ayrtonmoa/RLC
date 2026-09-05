// js/ui/farmCalculator.js - Calculadora de Farming Completa com Sistema de Ligas
// v2.4 - CSS Cleanup

const UI_FarmCalculator = {
  // Estado interno
  state: {
    miningPower: '',
    networkData: '',
    results: null,
    prices: {},
    loading: false,
    useBRL: false,
    useEUR: false,
    showQuantity: false,
    usdToBrl: 5.0,
    usdToEur: 0.92,
    history: [],
    lastUpdate: null,
    showHistory: false,
    priceStatus: 'loading',
    chartInstance: null,
    currentUsername: null,
    // Comparador de liga: NÃO afeta o cálculo principal (esse sempre usa a liga real
    // do perfil). É uma simulação à parte — precisa da rede da liga alvo colada,
    // já que o power total de rede muda de liga pra liga.
    compareLeagueId: null,
    compareNetworkData: '',
    // Poder hipotético pra simular "e se eu crescesse antes de subir de liga?". Vazio =
    // usa o poder real (miningPower). Na mesma unidade escolhida em powerUnit.
    comparePower: '',
    // Estado de aberto/fechado dos <details>. render() reconstrói o HTML inteiro a cada
    // chamada, então o atributo `open` nativo do <details> se perde sozinho (ex: trocar a
    // liga do comparador re-renderiza e fechava o painel que o usuário acabou de abrir).
    // Guardando aqui, cada render() recoloca o `open` certo.
    redePanelOpen: false,
    explorarOpen: false,
    redeAlvoPanelOpen: false,
    // Unidade em que o usuário digita/lê o poder. O cálculo é sempre em Eh/s.
    powerUnit: 'EH'
  },

  // Fatores relativos a Eh/s — a unidade interna desta aba (o SmartRoom usa GH/s
  // porque lá a base é miner.power; aqui a base é o power da rede, que vem em Eh/Zh).
  _UNIDADES_POWER: { GH: 1e-9, TH: 1e-6, PH: 1e-3, EH: 1, ZH: 1e3, YH: 1e6 },

  // Block rewards por liga (fonte estática oficial).
  // Não há API pública de ligas e a captura via rede exige login,
  // portanto estes valores são mantidos manualmente.
  // Última sincronização manual: 2026-08-26 (Gold I a Diamond III: BTC/LTC/DOGE subiram ~1%, POL/ETH/SOL caíram ~3,5%; Bronze, Silver, Titan, Emerald e Legend seguem iguais)
  leagueData: {
    '6a846d84d4be9e1aa9a15591': {
      name: 'Bronze I',
      powerGoal: '0 GH/s',
      rewards: { RLT: 3.0127, RST: 160.6768, BTC: 0.00000772, LTC: 0.004825 }
    },
    '6a846d84d4be9e1aa9a15592': {
      name: 'Bronze II',
      powerGoal: '25 PH/s',
      rewards: { RLT: 0.5144, RST: 77.1601, BTC: 0.0000039, LTC: 0.002922, BNB: 0.000292 }
    },
    '6a846d84d4be9e1aa9a15593': {
      name: 'Bronze III',
      powerGoal: '50 PH/s',
      rewards: { RLT: 1.0196, RST: 81.5663, BTC: 0.00000441, LTC: 0.002878, BNB: 0.000504, POL: 3.8369 }
    },
    '6a846d84d4be9e1aa9a15594': {
      name: 'Silver I',
      powerGoal: '100 PH/s',
      rewards: { RLT: 0.819, RST: 51.1862, BTC: 0.00000386, LTC: 0.00193, BNB: 0.000135, POL: 1.3507, XRP: 0.2412, USDT: 0.1024 }
    },
    '6a846d84d4be9e1aa9a15595': {
      name: 'Silver II',
      powerGoal: '150 PH/s',
      rewards: { RLT: 0.5644, RST: 51.3046, BTC: 0.00000317, LTC: 0.001922, BNB: 0.000096, POL: 0.9611, XRP: 0.0961, DOGE: 5.2862, USDT: 0.2052 }
    },
    '6a846d84d4be9e1aa9a15596': {
      name: 'Silver III',
      powerGoal: '250 PH/s',
      rewards: { RLT: 2.0585, RST: 154.3893, BTC: 0.00000675, LTC: 0.007235, BNB: 0.000482, POL: 2.8941, XRP: 0.3859, DOGE: 5.7881, ETH: 0.000241, USDT: 0.2573 }
    },
    '6a846d84d4be9e1aa9a15597': {
      name: 'Gold I',
      powerGoal: '650 PH/s',
      rewards: { RLT: 1.5916, RST: 106.1038, BTC: 0.00001222, LTC: 0.00489, BNB: 0.000726, POL: 3.268, XRP: 0.2903, DOGE: 7.818, ETH: 0.00028, TRX: 1.9352, USDT: 0.3714 }
    },
    '6a846d84d4be9e1aa9a15598': {
      name: 'Gold II',
      powerGoal: '1.5 EH/s',
      rewards: { RLT: 2.0937, RST: 157.0244, BTC: 0.00000638, LTC: 0.00255, BNB: 0.000486, POL: 2.53, XRP: 0.1651, DOGE: 7.846, ETH: 0.000262, TRX: 2.0393, SOL: 0.0075, HMT: 68.0439, USDT: 0.314 }
    },
    '6a846d84d4be9e1aa9a15599': {
      name: 'Gold III',
      powerGoal: '3.5 EH/s',
      rewards: { RLT: 4.2084, RST: 263.0258, BTC: 0.00002932, LTC: 0.00977, BNB: 0.001645, POL: 6.537, XRP: 0.6774, DOGE: 29.323, ETH: 0.00056, TRX: 7.7419, SOL: 0.01961, HMT: 1630.7601, USDT: 1.736 }
    },
    '6a846d84d4be9e1aa9a1559a': {
      name: 'Platinum I',
      powerGoal: '16 EH/s',
      rewards: { RLT: 5.7428, RST: 417.6555, BTC: 0.00004205, LTC: 0.01956, BNB: 0.002275, POL: 14.483, XRP: 1.2103, DOGE: 32.273, ETH: 0.001243, TRX: 22.7545, SOL: 0.03083, ALGO: 36.5449, HMT: 4072.1415, USDT: 3.1324 }
    },
    '6a846d84d4be9e1aa9a1559b': {
      name: 'Platinum II',
      powerGoal: '50 EH/s',
      rewards: { RLT: 2.6586, RST: 212.6904, BTC: 0.00002741, LTC: 0.01224, BNB: 0.001454, POL: 9.6936, XRP: 0.9694, DOGE: 24.476, ETH: 0.000935, TRX: 16.4791, SOL: 0.03555, ALGO: 14.8883, HMT: 3043.599, USDT: 1.9142 }
    },
    '6a846d84d4be9e1aa9a1559c': {
      name: 'Platinum III',
      powerGoal: '100 EH/s',
      rewards: { RLT: 1.9093, RST: 143.6189, BTC: 0.00002155, LTC: 0.01032, BNB: 0.001312, POL: 8.596, XRP: 0.7762, DOGE: 22.485, ETH: 0.00092, TRX: 17.259, SOL: 0.04542, ALGO: 11.6387, HMT: 3285.4745, USDT: 2.0756 }
    },
    '6a846d84d4be9e1aa9a1559d': {
      name: 'Diamond I',
      powerGoal: '200 EH/s',
      rewards: { RST: 94.2671, BTC: 0.00001725, LTC: 0.01793, BNB: 0.001184, POL: 12.239, XRP: 1.0569, DOGE: 19.642, ETH: 0.000653, TRX: 4.3123, SOL: 0.00979, ALGO: 21.6814, USDT: 1.5083 }
    },
    '6a846d84d4be9e1aa9a1559e': {
      name: 'Diamond II',
      powerGoal: '375 EH/s',
      rewards: { RST: 41.929, BTC: 0.00002662, LTC: 0.02146, BNB: 0.00221, POL: 11.485, XRP: 0.8926, DOGE: 30.051, ETH: 0.000574, TRX: 3.4003, SOL: 0.01231, ALGO: 33.0773, USDT: 2.7953 }
    },
    '6a846d84d4be9e1aa9a1559f': {
      name: 'Diamond III',
      powerGoal: '650 EH/s',
      rewards: { RST: 22.8695, BTC: 0.00001432, LTC: 0.01152, BNB: 0.001153, POL: 6.083, XRP: 0.4725, DOGE: 15.892, ETH: 0.00031, TRX: 1.9373, SOL: 0.00657, ALGO: 17.359, USDT: 1.3514 }
    },
    '6a846d84d4be9e1aa9a155a0': {
      name: 'Titan I',
      powerGoal: '1.15 ZH/s',
      rewards: { RST: 23.5358, BTC: 0.00001455, LTC: 0.011857, BNB: 0.001199, POL: 6.5601, XRP: 0.4923, DOGE: 16.3734, ETH: 0.000332, TRX: 2.0119, SOL: 0.007063, ALGO: 18.2403, USDT: 1.3886 }
    },
    '6a846d84d4be9e1aa9a155a1': {
      name: 'Titan II',
      powerGoal: '2.16 ZH/s',
      rewards: { RST: 22.2312, BTC: 0.00001123, LTC: 0.009882, BNB: 0.001011, POL: 5.5026, XRP: 0.4155, DOGE: 14.0371, ETH: 0.000281, TRX: 1.6845, SOL: 0.005952, ALGO: 15.0643, USDT: 1.161 }
    },
    '6a846d84d4be9e1aa9a155a2': {
      name: 'Titan III',
      powerGoal: '4 ZH/s',
      rewards: { RST: 38.2785, BTC: 0.0000253, LTC: 0.020656, BNB: 0.002066, POL: 11.4383, XRP: 0.8392, DOGE: 28.5313, ETH: 0.000555, TRX: 3.4857, SOL: 0.012265, ALGO: 31.4734, USDT: 2.5519 }
    },
    '6a846d84d4be9e1aa9a155a3': {
      name: 'Emerald I',
      powerGoal: '13 ZH/s',
      rewards: { RST: 254.8733, BTC: 0.00000324, LTC: 0.004837, BNB: 0.000194, POL: 1.9348, XRP: 0.2322, DOGE: 3.3859, ETH: 0.000097, TRX: 0.8707, SOL: 0.003289, ALGO: 4.8936, USDT: 0.9175 }
    },
    '6a846d84d4be9e1aa9a155a4': {
      name: 'Emerald II',
      powerGoal: '25 ZH/s',
      rewards: { RST: 204.3251, BTC: 0.00000266, LTC: 0.004836, BNB: 0.000232, POL: 1.6828, XRP: 0.1934, DOGE: 2.9015, ETH: 0.000097, TRX: 0.7737, SOL: 0.002902, ALGO: 4.0865, USDT: 0.7662 }
    },
    '6a846d84d4be9e1aa9a155a5': {
      name: 'Emerald III',
      powerGoal: '70 ZH/s',
      rewards: { RST: 102.521, BTC: 0.00000146, LTC: 0.001653, BNB: 0.000117, POL: 0.9235, XRP: 0.0826, DOGE: 1.4581, ETH: 0.000058, TRX: 0.418, SOL: 0.001458, ALGO: 2.563, USDT: 0.4101 }
    },
    '6a846d84d4be9e1aa9a155a6': {
      name: 'Legend',
      powerGoal: '1 YH/s',
      rewards: { RST: 53.0994, BTC: 8.4e-7, LTC: 0.00084, BNB: 0.00005, POL: 0.42, XRP: 0.042, DOGE: 0.714, ETH: 0.000025, TRX: 0.21, SOL: 0.000672, ALGO: 1.3275, USDT: 0.2035 }
    }
  },

  // Configurações
  CONFIG: {
    // Blocos/dia por moeda. O agrupamento antigo (padrão / LTC+TRX / USDT) partia de que a
    // maioria das moedas teria ritmo parecido; não tem mais: cada uma anda no seu próprio
    // passo, e o DOGE é o caso extremo (~27-31min por bloco, não ~10min).
    // Fonte: minaryganar.com/rollercoin/calculator, widget "Duração do bloco" (mede o tempo
    // real entre blocos observados ao vivo, não é leitura única). Consultado em 01/09/2026.
    // RLT e HMT não aparecem nesse widget; mantidos com 1 amostra própria do jogo (menos
    // confiança, ajustar se destoar).
    BLOCKS_PER_DAY_BY_COIN: {
      RLT: 130.909,  // só 1 amostra do jogo (11:00)
      RST: 144.966,  // 09:56
      HMT: 116.129,  // só 1 amostra do jogo (12:24)
      BTC: 143.046,  // 10:04
      LTC: 144,      // 10:00
      BNB: 134.579,  // 10:42
      POL: 136.493,  // 10:33
      XRP: 137.361,  // 10:29
      DOGE: 46.628,  // 30:53, bem abaixo do valor antigo (144.9664)
      ETH: 137.361,  // 10:29
      TRX: 142.574,  // 10:06
      SOL: 137.361,  // 10:29
      ALGO: 141.408, // 10:11
      USDT: 139.130, // 10:21
    },
    BLOCKS_PER_DAY: 144.9664, // fallback: usado só se a moeda não estiver na tabela acima
    GAME_COINS: ['RLT', 'RST', 'HMT'],
    NON_WITHDRAWABLE: ['ALGO', 'USDT'],
    WITHDRAW_MIN: {
      BTC: 0.00085,
      ETH: 0.014,
      BNB: 0.06,
      LTC: 5,
      XRP: 40,
      DOGE: 220,
      TRX: 300,
      POL: 300,
      SOL: 0.6
    },
    FIXED_PRICES: {
      RLT: 1.00,
      RST: 0.01,
      HMT: 1.00,
      USDT: 1.00
    },
    
    // Fallback se a liga não for encontrada
    DEFAULT_BLOCK_REWARDS: {
      RLT: 3.06858,
      RST: 189,
      HMT: 2430,
      BTC: 0.00002179,
      LTC: 0.01081,
      BNB: 0.00231,
      POL: 6.923,
      XRP: 0.679,
      DOGE: 14.889,
      ETH: 0.000842,
      TRX: 18.732,
      SOL: 0.04138,
      ALGO: 8.600969
    }
  },

  // Obter block rewards da liga do usuário
  getBlockRewards(userData) {
    if (!userData || !userData.league_id) {
      console.warn('⚠️ Liga não encontrada, usando valores padrão');
      return this.CONFIG.DEFAULT_BLOCK_REWARDS;
    }

    const leagueRewards = this.leagueData[userData.league_id];
    if (!leagueRewards) {
      console.warn('⚠️ Liga não mapeada:', userData.league_id);
      return this.CONFIG.DEFAULT_BLOCK_REWARDS;
    }

    console.log('✅ Usando rewards da liga:', leagueRewards.name);
    return leagueRewards.rewards;
  },

  // Inicialização
  async init() {
    this.loadFromStorage();
    // mostrar() chama init() toda vez que a aba Farm reabre (troca de aba, nova análise
    // de perfil etc.) — sem essa guarda, cada visita empilhava mais um setInterval, e depois
    // de algumas trocas de aba a página tinha vários intervalos rodando ao mesmo tempo,
    // martelando a CoinGecko bem mais rápido que os 5 minutos pretendidos.
    if (this._priceIntervalId) return;
    this.fetchPrices();
    this._priceIntervalId = setInterval(() => this.fetchPrices(), 5 * 60 * 1000);
  },

  // Carregar dados do localStorage - POR USUÁRIO
  loadFromStorage(username) {
    try {
      const savedNetwork = localStorage.getItem('farm_network_data');

      if (savedNetwork) this.state.networkData = savedNetwork;

      const savedUnit = localStorage.getItem('farm_power_unit');
      if (savedUnit && this._UNIDADES_POWER[savedUnit]) this.state.powerUnit = savedUnit;
      
      // Carregar histórico do usuário específico
      if (username) {
        const historyKey = `farm_mining_history_${username}`;
        const savedHistory = localStorage.getItem(historyKey);
        if (savedHistory) {
          this.state.history = JSON.parse(savedHistory);
          this.state.currentUsername = username;
        } else {
          this.state.history = [];
          this.state.currentUsername = username;
        }
      } else {
        this.state.history = [];
        this.state.currentUsername = null;
      }
      
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  },

  // Salvar dados no localStorage - COM USERNAME
  saveToStorage(powerEh, network, result, username) {
    try {
      localStorage.setItem('farm_network_data', network);

      const newEntry = {
        timestamp: new Date().toISOString(),
        power: parseFloat(powerEh),
        networkTotal: Object.values(this.parseNetworkData(network)).reduce((sum, v) => sum + v, 0),
        results: result,
        username: username
      };
      
      // Carregar histórico do usuário específico
      const historyKey = `farm_mining_history_${username}`;
      let userHistory = [];
      try {
        const saved = localStorage.getItem(historyKey);
        if (saved) userHistory = JSON.parse(saved);
      } catch {}
      
      const newHistory = [newEntry, ...userHistory].slice(0, 30);
      localStorage.setItem(historyKey, JSON.stringify(newHistory));
      
      this.state.history = newHistory;
      this.state.currentUsername = username;
    } catch (e) {
      console.error('Erro ao salvar dados:', e);
    }
  },

  // Buscar preços das cryptos
  async fetchPrices() {
    const fallback = {
      BTC: 95000, ETH: 3500, BNB: 600, SOL: 180,
      XRP: 2.5, DOGE: 0.35, TRX: 0.25, LTC: 100,
      POL: 0.85, ALGO: 0.35
    };

    this.state.priceStatus = 'loading';
    this.render();

    try {
      const ids = 'bitcoin,ethereum,binancecoin,solana,ripple,dogecoin,tron,litecoin,polygon-ecosystem-token,algorand';
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,brl,eur`;
      
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        
        this.state.prices = {
          BTC: data.bitcoin?.usd || fallback.BTC,
          ETH: data.ethereum?.usd || fallback.ETH,
          BNB: data.binancecoin?.usd || fallback.BNB,
          SOL: data.solana?.usd || fallback.SOL,
          XRP: data.ripple?.usd || fallback.XRP,
          DOGE: data.dogecoin?.usd || fallback.DOGE,
          TRX: data.tron?.usd || fallback.TRX,
          LTC: data.litecoin?.usd || fallback.LTC,
          POL: data['polygon-ecosystem-token']?.usd || fallback.POL,
          ALGO: data.algorand?.usd || fallback.ALGO
        };
        
        if (data.bitcoin?.brl && data.bitcoin?.eur) {
          this.state.usdToBrl = data.bitcoin.brl / data.bitcoin.usd;
          this.state.usdToEur = data.bitcoin.eur / data.bitcoin.usd;
          console.log('✅ CoinGecko: Preços e câmbio atualizados!', {
            BTC: this.state.prices.BTC,
            usdToBrl: this.state.usdToBrl.toFixed(4),
            usdToEur: this.state.usdToEur.toFixed(4)
          });
        } else {
          this.state.usdToBrl = 5.0;
          this.state.usdToEur = 0.92;
          console.warn('⚠️ CoinGecko: Câmbio não disponível, usando fallback');
        }
        
        this.state.lastUpdate = new Date();
        this.state.priceStatus = 'success';
      } else {
        throw new Error('CoinGecko API retornou erro');
      }
      
    } catch (error) {
      console.error('Erro ao buscar preços:', error);
      this.state.prices = fallback;
      this.state.usdToBrl = 5.0;
      this.state.usdToEur = 0.92;
      this.state.priceStatus = 'fallback';
    }

    this.render();
  },

  // Parser de dados da rede
  parseNetworkData(text) {
    const network = {};
    let match;

    // Formato novo: SYMBOL\n\nX%\n\nPower\n\nVALOR Zh/s (cole da página da rede)
    const regexNovoZh = /([A-Z]{2,6})\s+\d+%\s+Power\s+([\d.]+)\s+Zh\/s/gi;
    while ((match = regexNovoZh.exec(text)) !== null) {
      network[match[1].toUpperCase()] = parseFloat(match[2]) * 1000;
    }

    const regexNovoEh = /([A-Z]{2,6})\s+\d+%\s+Power\s+([\d.]+)\s+Eh\/s/gi;
    while ((match = regexNovoEh.exec(text)) !== null) {
      network[match[1].toUpperCase()] = parseFloat(match[2]);
    }

    // Formato antigo: rlt RLT 2.823 Zh/s (mantido para compatibilidade)
    const regexZh = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Zh\/s/gi;
    while ((match = regexZh.exec(text)) !== null) {
      const symbol = match[2].toUpperCase();
      if (!network[symbol]) network[symbol] = parseFloat(match[3]) * 1000;
    }

    const regexEh = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Eh\/s/gi;
    while ((match = regexEh.exec(text)) !== null) {
      const symbol = match[2].toUpperCase();
      if (!network[symbol]) network[symbol] = parseFloat(match[3]);
    }

    return network;
  },

  // Cálculo principal
  // salvar=false ao apenas re-simular (troca de liga/moeda): o histórico registra
  // pesquisas de verdade, não cada ajuste de simulação.
  calculate(salvar = true) {
    const { miningPower, networkData } = this.state;

    if (!miningPower || !networkData) {
      alert('Preencha todos os campos!');
      return;
    }

    this.state.loading = true;
    this.render();
    
    const myPowerEh = this._poderEmEh();
    const network = this.parseNetworkData(networkData);
    
    const userData = State.getUserData();
    const blockRewards = this.getBlockRewards(userData);
    
    const calculations = [];
    
    Object.keys(blockRewards).forEach(coin => {
      if (!network[coin]) return;
      
      const networkPowerEh = network[coin];
      const contribution = (myPowerEh / networkPowerEh) * 100;
      const blockReward = blockRewards[coin];
      const myRewardPerBlock = (contribution / 100) * blockReward;
      
      const blocksPerDay = this.CONFIG.BLOCKS_PER_DAY_BY_COIN[coin] || this.CONFIG.BLOCKS_PER_DAY;
      const blocksPerWeek = blocksPerDay * 7;
      const blocksPerMonth = blocksPerDay * 30;
      
      const isGameCoin = this.CONFIG.GAME_COINS.includes(coin);
      const price = this.CONFIG.FIXED_PRICES[coin] || this.state.prices[coin] || 0;
      
      calculations.push({
        coin,
        isGameCoin,
        contribution: contribution.toFixed(4),
        block: isGameCoin ? myRewardPerBlock : myRewardPerBlock * price,
        daily: isGameCoin ? myRewardPerBlock * blocksPerDay : myRewardPerBlock * blocksPerDay * price,
        weekly: isGameCoin ? myRewardPerBlock * blocksPerWeek : myRewardPerBlock * blocksPerWeek * price,
        monthly: isGameCoin ? myRewardPerBlock * blocksPerMonth : myRewardPerBlock * blocksPerMonth * price,
        blockQty: myRewardPerBlock,
        dailyQty: myRewardPerBlock * blocksPerDay,
        weeklyQty: myRewardPerBlock * blocksPerWeek,
        monthlyQty: myRewardPerBlock * blocksPerMonth
      });
    });
    
    calculations.sort((a, b) => b.monthly - a.monthly);

    this.state.results = calculations;

    const username = userData?.name || 'unknown';
    // Grava em Eh/s, não o número digitado: o histórico é comparado entre pesquisas e
    // plotado no gráfico, então precisa de uma unidade só, independente do seletor.
    if (salvar) this.saveToStorage(myPowerEh, networkData, calculations, username);

    if (typeof Analytics !== 'undefined') {
      const best = calculations.find(c => !c.nonWithdrawable);
      Analytics.farmCalculado(best?.coin ?? null, calculations.length);
    }

    this.state.loading = false;

    this.render();
    this.renderChart();
  },

  // Formatar valores
  formatValue(valueUSD, valueQty, isCrypto, coin, period = 'monthly') {
    if (this.state.showQuantity) {
      if (isCrypto) {
        const decimals = period === 'block' ? 8 : 4;
        return `${valueQty.toFixed(decimals)} ${coin}`;
      } else {
        const decimals = period === 'block' ? 6 : 2;
        return `${valueQty.toFixed(decimals)} ${coin}`;
      }
    }
    
    if (isCrypto) {
      const decimals = period === 'block' ? 4 : 2;
      if (this.state.useEUR) {
        return `€${(valueUSD * this.state.usdToEur).toFixed(decimals)}`;
      } else if (this.state.useBRL) {
        return `R$ ${(valueUSD * this.state.usdToBrl).toFixed(decimals)}`;
      } else {
        return `$${valueUSD.toFixed(decimals)}`;
      }
    }
    
    const decimals = period === 'block' ? 6 : 2;
    return `${valueQty.toFixed(decimals)} ${coin}`;
  },

  // Poder digitado convertido pra Eh/s, que é a unidade usada no cálculo.
  _poderEmEh() {
    const v = parseFloat(this.state.miningPower);
    if (!isFinite(v)) return NaN;
    return v * (this._UNIDADES_POWER[this.state.powerUnit] || 1);
  },

  // Poder usado no comparador de liga: se o usuário preencheu um poder hipotético
  // ("e se eu crescesse antes de subir?"), usa esse; senão cai no poder real.
  _poderComparadorEmEh() {
    const v = parseFloat(this.state.comparePower);
    if (isFinite(v) && v > 0) return v * (this._UNIDADES_POWER[this.state.powerUnit] || 1);
    return this._poderEmEh();
  },

  // Formata um valor em Eh/s na unidade escolhida pelo usuário.
  _formatarPoder(valorEh, casas = 3) {
    const fator = this._UNIDADES_POWER[this.state.powerUnit] || 1;
    return `${(valorEh / fator).toFixed(casas)} ${this._rotuloUnidade()}`;
  },

  _rotuloUnidade() {
    // "EH" -> "Eh/s", pra bater com a grafia que o jogo usa.
    const u = this.state.powerUnit || 'EH';
    return u.charAt(0) + u.charAt(1).toLowerCase() + '/s';
  },

  // Troca a unidade convertendo o valor digitado, pra que o poder real não mude:
  // 585 Eh/s vira 0.585 Zh/s. É justamente a conversão mental que o seletor evita.
  mudarUnidade(novaUnidade) {
    if (!this._UNIDADES_POWER[novaUnidade]) return;
    const atualEh = this._poderEmEh();
    this.state.powerUnit = novaUnidade;
    try { localStorage.setItem('farm_power_unit', novaUnidade); } catch {}

    if (isFinite(atualEh)) {
      const convertido = atualEh / this._UNIDADES_POWER[novaUnidade];
      // Mantém precisão sem virar notação científica em unidades muito acima do valor.
      this.state.miningPower = convertido >= 1
        ? convertido.toFixed(3).replace(/\.?0+$/, '')
        : convertido.toPrecision(4).replace(/\.?0+$/, '');
    }

    if (this.state.results) this.calculate(false); else this.render();
  },

  // Troca a liga alvo do comparador ("Comparar com outra liga"). Não mexe no cálculo
  // principal — é só recalcular o painel de comparação, que já é derivado do state.
  mudarLigaComparar(leagueId) {
    this.state.compareLeagueId = leagueId || null;
    this.render();
  },

  limparPoderComparador() {
    this.state.comparePower = '';
    this.render();
  },

  // Toggles dos <details> — via state em vez do atributo `open` nativo, porque render()
  // reconstrói o HTML a cada chamada (ver comentário no state lá em cima).
  toggleRedePanel() {
    this.state.redePanelOpen = !this.state.redePanelOpen;
    this.render();
  },
  toggleExplorar() {
    this.state.explorarOpen = !this.state.explorarOpen;
    this.render();
  },
  toggleRedeAlvoPanel() {
    this.state.redeAlvoPanelOpen = !this.state.redeAlvoPanelOpen;
    this.render();
  },

  // Modal com o print de exemplo da página "League Power" do jogo, pra quem não acha
  // onde copiar os dados da rede. Fecha no X, clicando fora, ou apertando Esc.
  abrirExemploRede() {
    if (document.getElementById('farmExemploRedeModal')) return;
    const modalHTML = `
      <div id="farmExemploRedeModal" class="modal-overlay" onclick="if (event.target === this) UI_FarmCalculator.fecharExemploRede();">
        <div class="farm-exemplo-modal-content">
          <button onclick="UI_FarmCalculator.fecharExemploRede()" class="farm-exemplo-modal-fechar" aria-label="Fechar">✕</button>
          <img src="img/farm-league-power-exemplo.png" alt="Exemplo da página League Power do RollerCoin, com Game currencies e Crypto currencies">
          <p>Copie o texto de cada card (Game currencies e Crypto currencies) e cole tudo na caixa de texto.</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this._exemploRedeEscListener = (e) => { if (e.key === 'Escape') this.fecharExemploRede(); };
    document.addEventListener('keydown', this._exemploRedeEscListener);
  },

  fecharExemploRede() {
    const modal = document.getElementById('farmExemploRedeModal');
    if (modal) modal.remove();
    if (this._exemploRedeEscListener) {
      document.removeEventListener('keydown', this._exemploRedeEscListener);
      this._exemploRedeEscListener = null;
    }
  },

  // Converte um powerGoal de liga ("2.16 ZH/s", "650 PH/s") pra Eh/s.
  _powerGoalEmEh(texto) {
    const m = /([\d.]+)\s*([A-Za-z]{2})\/s/i.exec(texto || '');
    if (!m) return null;
    const fator = this._UNIDADES_POWER[m[2].toUpperCase()];
    return fator ? parseFloat(m[1]) * fator : null;
  },

  // Compara o ganho de UMA moeda (qualquer linha de state.results) com o que ela renderia
  // na liga simulada, usando seu poder de hoje mas a rede daquela liga (o power total
  // de rede muda de liga pra liga, então não dá pra reaproveitar a rede da liga atual).
  // Chamado uma vez por moeda pelo comparador, pra cobrir a tabela inteira, não só a vencedora.
  // Não recalcula nem sobrescreve state.results — é só uma projeção paralela.
  computeComparador(linha) {
    if (!linha || !this.state.compareLeagueId || !this.state.compareNetworkData) return null;

    const ligaAlvo = this.leagueData[this.state.compareLeagueId];
    if (!ligaAlvo) return null;

    const coin = linha.coin;
    const rewardAlvo = ligaAlvo.rewards[coin];
    if (rewardAlvo == null) {
      return { erro: `${coin} não tem reward mapeado na ${ligaAlvo.name}.` };
    }

    const redeAlvo = this.parseNetworkData(this.state.compareNetworkData);
    const networkPowerAlvo = redeAlvo[coin];
    if (!networkPowerAlvo) {
      return { erro: `A rede colada não tem ${coin}. Confira se copiou a seção "League Power Partition" certa.` };
    }

    const myPowerEh = this._poderComparadorEmEh();
    const contribuicao2 = (myPowerEh / networkPowerAlvo) * 100;
    const rewardPerBlock2 = (contribuicao2 / 100) * rewardAlvo;
    const blocksPerDay = this.CONFIG.BLOCKS_PER_DAY_BY_COIN[coin] || this.CONFIG.BLOCKS_PER_DAY;
    const isGameCoin = this.CONFIG.GAME_COINS.includes(coin);
    const price = this.CONFIG.FIXED_PRICES[coin] || this.state.prices[coin] || 0;
    const monthlyQty2 = rewardPerBlock2 * blocksPerDay * 30;
    const monthly2 = isGameCoin ? monthlyQty2 : monthlyQty2 * price;

    const monthly1 = linha.monthly;
    const pct = monthly1 > 0 ? ((monthly2 - monthly1) / monthly1) * 100 : 0;
    const breakevenPower = monthly2 > 0 ? myPowerEh * (monthly1 / monthly2) : Infinity;
    const pctPoder = myPowerEh > 0 ? ((breakevenPower - myPowerEh) / myPowerEh) * 100 : 0;
    const goalEh = this._powerGoalEmEh(ligaAlvo.powerGoal);
    const acimaDoGoal = goalEh != null && isFinite(breakevenPower) && breakevenPower > goalEh;

    return {
      ligaAlvo,
      pct,
      breakevenPower,
      pctPoder,
      acimaDoGoal,
      row: { coin, isGameCoin, monthly: monthly2, monthlyQty: monthlyQty2, contribution: contribuicao2.toFixed(4) }
    };
  },

  // HTML do corpo do comparador. Compara TODAS as moedas da tabela principal (não só a
  // vencedora de hoje) porque reward e rede mudam por moeda — a melhor opção na liga de
  // cima pode ser outra. Separado do render() principal só porque ficaria grande demais inline ali.
  _renderComparadorLiga(resultados, ligaPerfil, minhaLigaInfo) {
    let html = '<div class="farm-cols">';

    html += '<div class="farm-league-col">';
    html += '<span class="farm-eyebrow">📍 sua liga</span>';
    html += `<div class="farm-league-title">${minhaLigaInfo ? minhaLigaInfo.name : 'não detectada'}</div>`;
    if (minhaLigaInfo) html += `<div class="farm-league-meta">Goal <b>${minhaLigaInfo.powerGoal}</b></div>`;
    html += '</div>';

    html += '<div class="farm-vs">VS</div>';

    html += '<div class="farm-league-col">';
    html += '<span class="farm-eyebrow">🧪 simular</span>';
    html += '<select onchange="UI_FarmCalculator.mudarLigaComparar(this.value)">';
    // Cor fixa nos <option>: o popup nativo do navegador renderiza em fundo claro
    // independente do tema da página, então sem isso o texto claro do dark mode
    // (herdado do <select>) fica ilegível em cima do fundo branco do popup.
    html += `<option value="" style="color:#000;">selecione a liga...</option>`;
    Object.entries(this.leagueData).forEach(([id, liga]) => {
      if (id === ligaPerfil) return;
      const sel = id === this.state.compareLeagueId ? ' selected' : '';
      html += `<option value="${id}"${sel} style="color:#000;">${liga.name}</option>`;
    });
    html += '</select>';

    const ligaAlvoSelecionada = this.state.compareLeagueId ? this.leagueData[this.state.compareLeagueId] : null;
    if (ligaAlvoSelecionada) html += `<div class="farm-league-meta">Goal <b>${ligaAlvoSelecionada.powerGoal}</b></div>`;

    html += `<div class="farm-chip-rede small" onclick="UI_FarmCalculator.toggleRedeAlvoPanel()">`;
    html += this.state.compareNetworkData
      ? `<span>🌐 rede da liga alvo — <strong>colada ✓</strong></span>`
      : '<span>🌐 colar rede da liga alvo</span>';
    html += '<span class="edit">editar ✎</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>'; // farm-cols

    html += `<details id="farmRedeAlvoPanel" class="farm-rede-panel"${this.state.redeAlvoPanelOpen ? ' open' : ''}>`;
    html += '<summary></summary>';
    html += `<textarea id="farmCompareNetworkData" rows="5" placeholder="Cole aqui a rede da liga que você quer simular (mesmo formato da rede principal)">${this.state.compareNetworkData || ''}</textarea>`;
    html += '</details>';

    // Poder hipotético: "e se eu crescesse antes de subir de liga?" — vazio usa o poder
    // real. Fica fora do <details> da rede pra ficar sempre visível, já que muda o
    // resultado da comparação tanto quanto a rede.
    html += '<div class="farm-toolbar-row" style="margin-top:10px;">';
    html += '<div class="farm-field">';
    html += '<label class="farm-input-label">Simular com poder de</label>';
    html += `<input type="text" id="farmComparePower" value="${this.state.comparePower}" placeholder="${this.state.miningPower || '?'} (atual)">`;
    html += `<span class="dim">${this._rotuloUnidade()}</span>`;
    html += '</div>';
    if (this.state.comparePower) {
      html += '<button onclick="UI_FarmCalculator.limparPoderComparador()" class="farm-btn-text">↺ usar poder real</button>';
    }
    html += '<button onclick="UI_FarmCalculator.render()" class="farm-btn-gerar" style="margin-left:auto;">🔍 Atualizar comparação</button>';
    html += '</div>';

    if (!ligaAlvoSelecionada) {
      html += '<p class="dim" style="margin-top:10px; font-size:12px;">Escolha uma liga acima pra comparar.</p>';
      return html;
    }
    if (!this.state.compareNetworkData) {
      html += '<p class="dim" style="margin-top:10px; font-size:12px;">Cole a rede da liga alvo pra comparar.</p>';
      return html;
    }

    const linhas = resultados.map(r => ({ r, comp: this.computeComparador(r) }));

    // Destaque: qual moeda seria a melhor pra farmar NA LIGA ALVO, com o poder de hoje —
    // pode não ser a mesma que já é a melhor na liga atual.
    const candidatosMelhor = linhas.filter(({ r, comp }) =>
      !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin) && comp && !comp.erro
    );
    if (candidatosMelhor.length) {
      const melhorAlvo = candidatosMelhor.reduce((a, b) => b.comp.row.monthly > a.comp.row.monthly ? b : a);
      const vencedoraHoje = resultados.filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))[0];
      const simulandoPoder = !!parseFloat(this.state.comparePower) && this._poderComparadorEmEh() !== this._poderEmEh();
      const meuPoder = this._formatarPoder(this._poderComparadorEmEh());
      const ganhoAlvo = this.formatValue(melhorAlvo.comp.row.monthly, melhorAlvo.comp.row.monthlyQty, true, melhorAlvo.r.coin, 'monthly');
      html += `<div class="farm-delta-banner ${melhorAlvo.comp.pct >= 0 ? 'good' : 'bad'}" style="margin-top:12px;">`;
      html += `<span>${melhorAlvo.comp.pct >= 0 ? '✅' : '📐'}</span>`;
      // Deixa explícito que é uma projeção (poder fixo, rede da outra liga) e mostra
      // contra o que comparar — "seria a melhor opção ($X/mês)" sozinho deixava a dúvida
      // se esse valor já era o ganho de hoje ou uma simulação. Quando o usuário testa um
      // poder hipotético (não o real), o texto muda pra deixar isso óbvio também.
      html += simulandoPoder
        ? `<span><strong>Simulando um poder de ${meuPoder}</strong> (seu poder real hoje é ${this._formatarPoder(this._poderEmEh())}), farmar <strong>${melhorAlvo.r.coin}</strong> na <strong>${melhorAlvo.comp.ligaAlvo.name}</strong> renderia <strong>${ganhoAlvo}/mês</strong>`
        : `<span><strong>Mantendo seu poder de hoje (${meuPoder})</strong>, farmar <strong>${melhorAlvo.r.coin}</strong> na <strong>${melhorAlvo.comp.ligaAlvo.name}</strong> renderia <strong>${ganhoAlvo}/mês</strong>`;
      if (vencedoraHoje) {
        const ganhoHoje = this.formatValue(vencedoraHoje.monthly, vencedoraHoje.monthlyQty, true, vencedoraHoje.coin, 'monthly');
        html += ` — contra <strong>${ganhoHoje}/mês</strong> que você ganha hoje farmando ${vencedoraHoje.coin} na sua liga atual`;
      }
      html += '.</span></div>';
    }

    html += '<div style="overflow-x:auto; margin-top:12px;">';
    html += '<table><thead><tr>';
    html += '<th>Moeda</th>';
    html += '<th style="text-align:right;">Ganho hoje</th>';
    html += `<th style="text-align:right;">Na ${ligaAlvoSelecionada.name}</th>`;
    html += '<th style="text-align:right;">Diferença</th>';
    html += '<th style="text-align:right;">Poder p/ igualar</th>';
    html += '</tr></thead><tbody>';
    // Mesmos badges e destaque de linha da tabela "Resultados Detalhados" — TOP na primeira
    // crypto sacável (a lista já vem ordenada por monthly desc) e "Não sacável" pras que estão em NON_WITHDRAWABLE.
    const withdrawableCryptos = resultados.filter(coin => !coin.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(coin.coin));
    linhas.forEach(({ r, comp }) => {
      const isTopCrypto = !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin) && withdrawableCryptos.indexOf(r) === 0;
      const isNonWithdrawable = this.CONFIG.NON_WITHDRAWABLE.includes(r.coin);
      html += `<tr${isTopCrypto ? ' class="farm-row-highlight"' : ''}>`;
      html += `<td><strong>${r.coin}</strong> <span class="${r.isGameCoin ? 'farm-badge-game' : 'farm-badge-crypto'}">${r.isGameCoin ? 'Game' : 'Crypto'}</span>${isTopCrypto ? ' <span class="farm-badge-top">🏆 TOP</span>' : ''}${isNonWithdrawable ? ' <span class="farm-badge-no-withdraw">🚫 Não sacável</span>' : ''}</td>`;
      html += `<td style="text-align:right;">${this.formatValue(r.monthly, r.monthlyQty, !r.isGameCoin, r.coin, 'monthly')}</td>`;
      if (!comp || comp.erro) {
        const motivo = comp?.erro || 'sem dados';
        html += `<td colspan="3" style="text-align:center; opacity:.6; font-size:12px;" title="${motivo}">${motivo} ⓘ</td>`;
      } else {
        const cor = comp.pct >= 0 ? '#28a745' : '#dc3545';
        html += `<td style="text-align:right;">${this.formatValue(comp.row.monthly, comp.row.monthlyQty, !comp.row.isGameCoin, comp.row.coin, 'monthly')}</td>`;
        html += `<td style="text-align:right; color:${cor}; font-weight:600;">${comp.pct >= 0 ? '+' : ''}${comp.pct.toFixed(1)}%</td>`;
        html += `<td style="text-align:right;">${isFinite(comp.breakevenPower) ? this._formatarPoder(comp.breakevenPower) : '—'}</td>`;
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';

    return html;
  },

  // Liga real do perfil analisado, ignorando qualquer simulação.
  _ligaDoPerfil() {
    const userData = State.getUserData();
    return userData && userData.league_id ? userData.league_id : null;
  },

  // Valor em USD na moeda escolhida pelo usuário (o mesmo ternário aparecia repetido
  // em cada card; centralizar evita que um deles fique pra trás numa mudança).
  _moeda(valorUSD) {
    if (this.state.useEUR) return `€${(valorUSD * this.state.usdToEur).toFixed(2)}`;
    if (this.state.useBRL) return `R$ ${(valorUSD * this.state.usdToBrl).toFixed(2)}`;
    return `$${valorUSD.toFixed(2)}`;
  },

  // Ganho de uma crypto no período, respeitando o toggle Valor/Quantidade.
  _ganho(r, campoValor, campoQtd) {
    return this.state.showQuantity
      ? `${r[campoQtd].toFixed(4)} ${r.coin}`
      : this._moeda(r[campoValor]);
  },

  // Obter linha de total
  getTotalRow() {
    if (!this.state.results) return null;
    const cryptoOnly = this.state.results.filter(r => !r.isGameCoin);
    return {
      block: cryptoOnly.reduce((sum, r) => sum + r.block, 0),
      daily: cryptoOnly.reduce((sum, r) => sum + r.daily, 0),
      weekly: cryptoOnly.reduce((sum, r) => sum + r.weekly, 0),
      monthly: cryptoOnly.reduce((sum, r) => sum + r.monthly, 0)
    };
  },

  // Obter comparação com histórico
  getComparison() {
    if (this.state.history.length < 2) return null;
    
    const current = this.state.history[0];
    const previous = this.state.history[1];
    
    const powerChange = ((current.power - previous.power) / previous.power) * 100;
    const networkChange = ((current.networkTotal - previous.networkTotal) / previous.networkTotal) * 100;
    
    const currentCryptos = current.results
      ?.filter(r => !this.CONFIG.GAME_COINS.includes(r.coin) && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
      .sort((a, b) => b.monthly - a.monthly) || [];
    
    const previousCryptos = previous.results
      ?.filter(r => !this.CONFIG.GAME_COINS.includes(r.coin) && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
      .sort((a, b) => b.monthly - a.monthly) || [];
    
    const currentBest = currentCryptos[0];
    const previousBest = previousCryptos[0];
    
    const currentBestProfit = currentBest?.monthly || 0;
    const previousBestProfit = previousBest?.monthly || 0;
    
    const profitChange = previousBestProfit > 0 
      ? ((currentBestProfit - previousBestProfit) / previousBestProfit) * 100 
      : 0;
    
    return {
      powerChange,
      networkChange,
      profitChange,
      powerDiff: current.power - previous.power,
      networkDiff: current.networkTotal - previous.networkTotal,
      profitDiff: currentBestProfit - previousBestProfit,
      currentBestCoin: currentBest?.coin,
      previousBestCoin: previousBest?.coin
    };
  },

  // Formatar data
  formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Tempo atrás
  getTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  },

  // Deletar uma entrada específica do histórico
  deleteHistoryEntry(index) {
    const username = this.state.currentUsername;
    if (!username) return;
    
    const entry = this.state.history[index];
    const confirmMsg = `Deletar consulta de ${this.formatDate(entry.timestamp)}?`;
    
    if (confirm(confirmMsg)) {
      this.state.history.splice(index, 1);
      
      const historyKey = `farm_mining_history_${username}`;
      localStorage.setItem(historyKey, JSON.stringify(this.state.history));
      
      this.render();
    }
  },

  // Renderizar gráfico
  renderChart() {
    if (this.state.history.length < 2) return;

    const canvas = document.getElementById('farmChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (this.state.chartInstance) {
      this.state.chartInstance.destroy();
    }

    // Detectar dark mode. Atenção: as cores são "assadas" na instância do Chart,
    // então trocar de tema exige chamar renderChart() de novo (ver toggle no index.html).
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    // Azul/roxo puros somem no fundo claro; no escuro precisam clarear pra manter contraste.
    const corPower = isDarkMode ? '#4dabf7' : '#0b5ed7';
    const corRede = isDarkMode ? '#b197fc' : '#5a32a3';

    const labels = this.state.history.slice(0, 10).reverse().map(h => this.formatDate(h.timestamp));
    // O histórico guarda Eh/s; o eixo mostra na unidade escolhida pelo usuário.
    const fatorUnidade = this._UNIDADES_POWER[this.state.powerUnit] || 1;
    const rotuloPower = `Meu Power (${this._rotuloUnidade()})`;
    const powerData = this.state.history.slice(0, 10).reverse().map(h => h.power / fatorUnidade);
    const networkData = this.state.history.slice(0, 10).reverse().map(h => h.networkTotal / 1000);

    this.state.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: rotuloPower,
            data: powerData,
            borderColor: corPower,
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: corPower,
            yAxisID: 'y'
          },
          {
            label: 'Rede Total (Zh/s)',
            data: networkData,
            borderColor: corRede,
            backgroundColor: 'rgba(111, 66, 193, 0.1)',
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: corRede,
            borderDash: [6, 4],
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: { color: textColor }
          },
          title: {
            display: true,
            text: '📈 Evolução do Poder',
            color: textColor,
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: rotuloPower, color: corPower },
            ticks: { color: corPower },
            grid: { color: gridColor }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Rede Total (Zh/s)', color: corRede },
            ticks: { color: corRede },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: textColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  },

  // Limpar histórico
  clearHistory() {
    const username = this.state.currentUsername;
    if (!username) {
      alert('Nenhum usuário selecionado');
      return;
    }
    
    if (confirm(`Tem certeza que deseja limpar o histórico de ${username}?`)) {
      const historyKey = `farm_mining_history_${username}`;
      this.state.history = [];
      localStorage.removeItem(historyKey);
      this.render();
    }
  },

  // Função principal de renderização
  render() {
    const container = document.getElementById('farmcalculator');
    if (!container) return;

    let html = '<h2>⚡ Farm Calculator</h2>';

    // Toolbar compacta: poder + rede (colapsada por padrão) + calcular.
    // Antes era um formulário grande sempre aberto — a rede vira um resumo de uma linha,
    // só expande quando o usuário quer colar/editar de novo.
    const userData = State.getUserData();
    const ligaPerfil = this._ligaDoPerfil();
    const minhaLigaInfo = ligaPerfil ? this.leagueData[ligaPerfil] : null;
    const qtdMoedasRede = this.state.networkData ? Object.keys(this.parseNetworkData(this.state.networkData)).length : 0;

    html += '<div class="farm-etapa">';
    html += '<div class="farm-etapa-titulo">Sua situação</div>';
    html += '<div class="farm-toolbar-row">';

    html += '<div class="farm-field">';
    html += '<label class="farm-input-label">Meu poder</label>';
    html += `<input type="text" id="farmMiningPower" value="${this.state.miningPower}" placeholder="100.106">`;
    // Trocar a unidade converte o número, então o poder real não muda ao alternar —
    // é exatamente a conta de cabeça que o seletor existe pra evitar.
    html += '<select onchange="UI_FarmCalculator.mudarUnidade(this.value)" id="farmPowerUnit">';
    Object.keys(this._UNIDADES_POWER).forEach(u => {
      const sel = u === this.state.powerUnit ? ' selected' : '';
      html += `<option value="${u}"${sel} style="color:#000;">${u.charAt(0)}${u.charAt(1).toLowerCase()}/s</option>`;
    });
    html += '</select>';
    html += '</div>';

    html += `<div class="farm-chip-rede" onclick="UI_FarmCalculator.toggleRedePanel()">`;
    html += qtdMoedasRede
      ? `<span>🌐 rede colada — <strong>${qtdMoedasRede} moedas</strong></span>`
      : '<span>🌐 colar rede da liga</span>';
    html += '<span class="edit">editar ✎</span>';
    html += '</div>';

    html += '<button onclick="UI_FarmCalculator.calculate()" class="farm-btn-gerar">💰 Calcular</button>';
    html += '</div>'; // farm-toolbar-row

    html += `<details id="farmRedePanel" class="farm-rede-panel"${this.state.redePanelOpen ? ' open' : ''}>`;
    html += '<summary></summary>';
    html += '<div class="farm-network-notice">';
    html += '⚠️ <strong>Atenção:</strong> a fonte dos dados da rede mudou. ';
    html += 'Acesse <a href="https://rollercoin.com/game/league" target="_blank">rollercoin.com/game/league</a>, ';
    html += 'clique na aba <strong>League Power</strong> (por padrão abre em My Power), ';
    html += 'e copie o texto de <strong>todas as moedas</strong> (Game currencies + Crypto currencies) que aparecem lá — cada uma com Power, Active users, Per block e Last Block Time. ';
    html += 'Cole tudo aqui abaixo. ';
    html += '<button onclick="UI_FarmCalculator.abrirExemploRede()" class="farm-btn-text">🖼️ Ver exemplo</button>';
    html += '</div>';
    html += `<textarea id="farmNetworkData" rows="6" placeholder="Cole os dados da rede. Formato novo:\nRST\n2%\nPower\n8.082 Zh/s\n\nBTC\n8%\nPower\n34.870 Zh/s">${this.state.networkData}</textarea>`;
    // Info de blocos: cada moeda tem seu próprio ritmo agora (o DOGE sozinho é ~2,8x mais
    // lento que o resto), então virou uma lista por moeda em vez de 3 grupos.
    html += '<div class="farm-blocks-info">';
    html += '<span style="font-weight: 600;">📊 Blocos/dia por moeda: </span>';
    html += `<span style="font-size: 12px;">${Object.entries(this.CONFIG.BLOCKS_PER_DAY_BY_COIN).map(([c, v]) => `${c} ${v}`).join(' · ')}</span>`;
    html += '</div>';
    html += '</details>';

    if (this.state.results && minhaLigaInfo) {
      html += `<div class="farm-liga-atual">📍 Liga atual: <strong>${minhaLigaInfo.name}</strong> <span class="dim">· goal ${minhaLigaInfo.powerGoal}</span></div>`;
    }
    html += '</div>'; // farm-etapa

    // Comparação com histórico
    const comparison = this.getComparison();
    if (comparison) {
      html += '<div class="farm-comparison-box">';
      html += '<h4 style="margin: 0 0 10px 0;">📊 Comparado com última pesquisa:</h4>';
      html += '<div class="farm-comparison-grid">';
      
      // Rede Total
      const currentNetworkZh = (this.state.history[0].networkTotal / 1000).toFixed(3);
      html += '<div>';
      html += '<div style="font-size: 12px; color: #666;">Rede Total</div>';
      html += `<div class="farm-comparison-value" style="color: #6f42c1;">${currentNetworkZh} Zh/s</div>`;
      html += `<div class="farm-comparison-change" style="color: ${comparison.networkChange > 0 ? 'green' : comparison.networkChange < 0 ? 'red' : '#666'};">${comparison.networkDiff > 0 ? '+' : ''}${comparison.networkDiff.toFixed(3)} Zh/s (${comparison.networkChange > 0 ? '↑' : comparison.networkChange < 0 ? '↓' : '→'} ${Math.abs(comparison.networkChange).toFixed(2)}%)</div>`;
      html += '</div>';
      
      // Meu Power
      const currentPower = this.state.history[0].power;
      html += '<div>';
      html += '<div style="font-size: 12px; color: #666;">Meu Power</div>';
      html += `<div class="farm-comparison-value" style="color: #007bff;">${this._formatarPoder(currentPower)}</div>`;
      html += `<div class="farm-comparison-change" style="color: ${comparison.powerChange > 0 ? 'green' : comparison.powerChange < 0 ? 'red' : '#666'};">${comparison.powerDiff > 0 ? '+' : ''}${this._formatarPoder(comparison.powerDiff)} (${comparison.powerChange > 0 ? '↑' : comparison.powerChange < 0 ? '↓' : '→'} ${Math.abs(comparison.powerChange).toFixed(2)}%)</div>`;
      html += '</div>';
      
      // Melhor Crypto
      const currentCryptos = this.state.history[0].results
        ?.filter(r => !this.CONFIG.GAME_COINS.includes(r.coin) && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .sort((a, b) => b.monthly - a.monthly) || [];
      const currentBest = currentCryptos[0];
      const currentBestProfit = currentBest?.monthly || 0;
      
      html += '<div>';
      html += `<div style="font-size: 12px; color: #666;">Melhor Crypto (${comparison.currentBestCoin})</div>`;
      html += `<div class="farm-comparison-value" style="color: #28a745;">${this.state.useEUR ? `€${(currentBestProfit * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(currentBestProfit * this.state.usdToBrl).toFixed(2)}` : `$${currentBestProfit.toFixed(2)}`}/mês</div>`;
      html += `<div class="farm-comparison-change" style="color: ${comparison.profitChange > 0 ? 'green' : comparison.profitChange < 0 ? 'red' : '#666'};">${comparison.profitDiff > 0 ? '+' : ''}${this.state.useEUR ? `€${(comparison.profitDiff * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(comparison.profitDiff * this.state.usdToBrl).toFixed(2)}` : `$${comparison.profitDiff.toFixed(2)}`} (${comparison.profitChange > 0 ? '↑' : comparison.profitChange < 0 ? '↓' : '→'} ${Math.abs(comparison.profitChange).toFixed(2)}%)</div>`;
      if (comparison.currentBestCoin !== comparison.previousBestCoin) {
        html += `<div style="font-size: 11px; color: #ff9800; margin-top: 4px;">⚠️ Antes era ${comparison.previousBestCoin}</div>`;
      }
      html += '</div>';
      
      html += '</div>';
      html += '</div>';
    }

    // Faixa "melhor pra farmar" — resumo de uma linha (era um card grande + grid de vices).
    // O comparador de liga usa essa mesma moeda vencedora como referência.
    let vencedora = null;
    if (this.state.results) {
      const sacaveis = this.state.results
        .filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .sort((a, b) => b.monthly - a.monthly);
      vencedora = sacaveis[0];
      const vices = sacaveis.slice(1, 3);

      if (vencedora) {
        html += '<div class="farm-top-strip">';
        html += '<span class="medal">🏆</span>';
        html += `<span class="coin">${vencedora.coin}</span>`;
        html += '<span class="farm-badge-crypto">Sacável</span>';
        html += `<span class="figure">${this._ganho(vencedora, 'monthly', 'monthlyQty')}/mês</span>`;
        if (vices.length) {
          html += `<span class="others">próximas: ${vices.map(c => `<b>${c.coin}</b> ${this._ganho(c, 'monthly', 'monthlyQty')}`).join(' · ')}</span>`;
        }
        html += '</div>';
      }

      // Comparador de liga — colapsado por padrão. Exige colar a rede da liga alvo
      // (o power total de rede muda de liga pra liga), então não vale deixar sempre aberto.
      html += `<details class="farm-explorar"${this.state.explorarOpen ? ' open' : ''}>`;
      html += '<summary class="farm-explorar-summary" onclick="event.preventDefault(); UI_FarmCalculator.toggleExplorar();"><span class="farm-explorar-caret">▶</span> 🔬 Comparar com outra liga</summary>';
      html += '<div class="farm-explorar-corpo">';
      html += this._renderComparadorLiga(this.state.results, ligaPerfil, minhaLigaInfo);
      html += '</div>';
      html += '</details>';
    }

    // Tabela de Resultados
    if (this.state.results) {
      html += '<div class="farm-results-section">';
      html += '<div class="farm-results-header">';
      html += '<h3 style="margin: 0;">📊 Resultados Detalhados</h3>';
      
      html += '<div class="farm-toolbar">';
      html += '<div class="farm-toggle-group">';
      html += `<button onclick="UI_FarmCalculator.state.useBRL = false; UI_FarmCalculator.state.useEUR = false; UI_FarmCalculator.render();" class="farm-toggle-btn ${!this.state.useBRL && !this.state.useEUR ? 'active' : ''}">USD $</button>`;
      html += `<button onclick="UI_FarmCalculator.state.useBRL = true; UI_FarmCalculator.state.useEUR = false; UI_FarmCalculator.render();" class="farm-toggle-btn ${this.state.useBRL ? 'active' : ''}">BRL R$</button>`;
      html += `<button onclick="UI_FarmCalculator.state.useBRL = false; UI_FarmCalculator.state.useEUR = true; UI_FarmCalculator.render();" class="farm-toggle-btn ${this.state.useEUR ? 'active' : ''}">EUR €</button>`;
      html += '</div>';
      
      html += '<div class="farm-toggle-group">';
      html += `<button onclick="UI_FarmCalculator.state.showQuantity = false; UI_FarmCalculator.render();" class="farm-toggle-btn ${!this.state.showQuantity ? 'active-purple' : ''}">💰 Valor</button>`;
      html += `<button onclick="UI_FarmCalculator.state.showQuantity = true; UI_FarmCalculator.render();" class="farm-toggle-btn ${this.state.showQuantity ? 'active-purple' : ''}">🪙 Quantidade</button>`;
      html += '</div>';
      
      html += '</div>';
      html += '</div>';
      
      html += '<div style="overflow-x: auto;">';
      html += '<table><thead><tr>';
      html += '<th>Moeda</th>';
      html += '<th style="text-align: right;">Contrib %</th>';
      html += '<th style="text-align: right;">Por Bloco</th>';
      html += '<th style="text-align: right;">Diário</th>';
      html += '<th style="text-align: right;">Semanal</th>';
      html += '<th style="text-align: right;">Mensal (30D)</th>';
      html += '</tr></thead><tbody>';
      
      this.state.results.forEach((r, idx) => {
        const withdrawableCryptos = this.state.results.filter(coin => !coin.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(coin.coin));
        const isTopCrypto = !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin) && withdrawableCryptos.indexOf(r) === 0;
        const isNonWithdrawable = this.CONFIG.NON_WITHDRAWABLE.includes(r.coin);

        html += `<tr${isTopCrypto ? ' class="farm-row-highlight"' : ''}>`;
        html += `<td><strong>${r.coin}</strong> <span class="${r.isGameCoin ? 'farm-badge-game' : 'farm-badge-crypto'}">${r.isGameCoin ? 'Game' : 'Crypto'}</span>${isTopCrypto ? ' <span class="farm-badge-top">🏆 TOP</span>' : ''}${isNonWithdrawable ? ' <span class="farm-badge-no-withdraw">🚫 Não sacável</span>' : ''}</td>`;
        html += `<td style="text-align: right; font-size: 13px;">${r.contribution}%</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.block, r.blockQty, !r.isGameCoin, r.coin, 'block')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.daily, r.dailyQty, !r.isGameCoin, r.coin, 'daily')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.weekly, r.weeklyQty, !r.isGameCoin, r.coin, 'weekly')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.monthly, r.monthlyQty, !r.isGameCoin, r.coin, 'monthly')}</td>`;
        html += '</tr>';
      });

      html += '</tbody></table>';
      html += '</div>';

      // Seção de tempo para saque
      const withdrawRows = this.state.results.filter(r =>
        !r.isGameCoin && this.CONFIG.WITHDRAW_MIN[r.coin] && r.dailyQty > 0
      );
      if (withdrawRows.length > 0) {
        html += '<div style="margin-top: 20px;">';
        html += '<h4 style="margin-bottom: 10px;">⏳ Tempo para Atingir Mínimo de Saque</h4>';
        html += '<div style="overflow-x: auto;">';
        html += '<table><thead><tr>';
        html += '<th>Moeda</th>';
        html += '<th style="text-align: right;">Mínimo</th>';
        html += '<th style="text-align: right;">Farm/dia</th>';
        html += '<th style="text-align: right;">Dias necessários</th>';
        html += '</tr></thead><tbody>';

        withdrawRows.forEach(r => {
          const min = this.CONFIG.WITHDRAW_MIN[r.coin];
          const days = min / r.dailyQty;
          let daysLabel, color;
          if (days <= 7) {
            daysLabel = days < 1 ? 'Menos de 1 dia' : `${Math.ceil(days)} dias`;
            color = '#28a745';
          } else if (days <= 30) {
            daysLabel = `${Math.ceil(days)} dias`;
            color = '#fd7e14';
          } else {
            const months = days / 30;
            daysLabel = months >= 12
              ? `~${(months / 12).toFixed(1)} anos`
              : `~${months.toFixed(1)} meses`;
            color = '#dc3545';
          }
          html += '<tr>';
          html += `<td><strong>${r.coin}</strong></td>`;
          html += `<td style="text-align: right;">${min} ${r.coin}</td>`;
          html += `<td style="text-align: right;">${r.dailyQty.toFixed(6)} ${r.coin}</td>`;
          html += `<td style="text-align: right; font-weight: bold; color: ${color};">${daysLabel}</td>`;
          html += '</tr>';
        });

        html += '</tbody></table>';
        html += '</div>';
        html += '</div>';
      }

      html += '</div>';
    }

    // Gráfico. Fica junto do Histórico porque é justamente a série histórica desenhada —
    // no meio dos cards de recomendação ele cortava o fluxo "o que farmar → quanto rende".
    if (this.state.history.length >= 2) {
      html += '<div class="farm-chart-container">';
      html += '<canvas id="farmChart"></canvas>';
      html += '</div>';
    }

    // Histórico
    if (this.state.history.length > 0) {
      html += '<div class="farm-history-section">';
      html += '<div class="farm-history-header">';
      html += `<h3 style="margin: 0;">📜 Histórico de ${this.state.currentUsername || 'Usuário'} (${this.state.history.length})</h3>`;
      html += '<div>';
      html += `<button onclick="UI_FarmCalculator.state.showHistory = !UI_FarmCalculator.state.showHistory; UI_FarmCalculator.render();" style="padding: 6px 12px; font-size: 12px; margin-right: 8px;">${this.state.showHistory ? '▲ Ocultar' : '▼ Mostrar'}</button>`;
      html += '<button onclick="UI_FarmCalculator.clearHistory()" style="padding: 6px 12px; font-size: 12px; background: #dc3545;">🗑️ Limpar Tudo</button>';
      html += '</div>';
      html += '</div>';
      
      if (this.state.showHistory) {
        html += '<div class="farm-history-scroll">';
        this.state.history.forEach((entry, idx) => {
          html += '<div class="farm-history-item">';
          html += `<button onclick="UI_FarmCalculator.deleteHistoryEntry(${idx})" class="farm-history-delete">🗑️</button>`;
          html += '<div class="farm-history-content">';
          html += '<div>';
          html += `<span class="farm-history-date">${this.formatDate(entry.timestamp)}</span>`;
          html += `<span class="farm-history-ago">(${this.getTimeAgo(entry.timestamp)})</span>`;
          html += '</div>';
          html += '<div class="farm-history-stats">';
          html += '<div class="farm-history-stat">';
          html += '<span class="farm-history-stat-label">Power</span>';
          html += `<span class="farm-history-stat-value power">${this._formatarPoder(entry.power)}</span>`;
          html += '</div>';
          html += '<div class="farm-history-stat">';
          html += '<span class="farm-history-stat-label">Rede</span>';
          html += `<span class="farm-history-stat-value network">${(entry.networkTotal / 1000).toFixed(3)} Zh/s</span>`;
          html += '</div>';
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

    // Painel de Cotações (última seção)
    const statusIcon = this.state.priceStatus === 'success' ? '🟢' : this.state.priceStatus === 'fallback' ? '🟡' : '⚪';
    const statusText = this.state.priceStatus === 'fallback' ? ' (fallback)' : '';
    html += '<div class="farm-prices-panel">';
    html += '<div class="farm-prices-header">';
    html += '<h3 style="margin: 0;">💰 Cotações</h3>';
    html += '</div>';
    html += '<div class="farm-prices-info">';
    html += `<div>${statusIcon} 📡 Fonte: <strong style="color: #007bff;">CoinGecko API</strong>${statusText}</div>`;
    html += `<div>💱 Câmbio: <strong>R$ ${this.state.usdToBrl.toFixed(4)}</strong> | <strong>€${this.state.usdToEur.toFixed(4)}</strong></div>`;
    html += '</div>';
    // Grid de pílulas em vez de um card por moeda empilhado — cabia 10 cards de ~70px
    // (com USD/BRL/EUR cada um numa linha) num painel que devia ser só uma referência rápida.
    // R$ e € ficam no title (hover), já que a tabela de resultados tem o toggle de moeda pra isso.
    html += '<div class="farm-prices-grid">';
    Object.entries(this.state.prices).forEach(([coin, price]) => {
      const brl = (price * this.state.usdToBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const eur = (price * this.state.usdToEur).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const usd = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      html += `<div class="farm-price-chip" title="R$ ${brl} · €${eur}"><strong>${coin}</strong> $${usd}</div>`;
    });
    html += '</div>';
    if (this.state.lastUpdate) {
      html += `<div style="margin-top: 12px; color: #999; font-size: 11px; text-align: center;">⏰ Atualizado ${this.getTimeAgo(this.state.lastUpdate.toISOString())}</div>`;
    }
    html += '</div>';

    container.innerHTML = html;

    // Event listeners
    const powerInput = document.getElementById('farmMiningPower');
    const networkInput = document.getElementById('farmNetworkData');
    
    if (powerInput) {
      powerInput.addEventListener('input', (e) => {
        this.state.miningPower = e.target.value;
      });
    }
    
    if (networkInput) {
      networkInput.addEventListener('input', (e) => {
        this.state.networkData = e.target.value;
      });
    }

    const compareInput = document.getElementById('farmCompareNetworkData');
    if (compareInput) {
      compareInput.addEventListener('input', (e) => {
        this.state.compareNetworkData = e.target.value;
      });
    }

    const comparePowerInput = document.getElementById('farmComparePower');
    if (comparePowerInput) {
      comparePowerInput.addEventListener('input', (e) => {
        this.state.comparePower = e.target.value;
      });
    }

    setTimeout(() => this.renderChart(), 100);
  },

  // Mostrar na interface
  mostrar(userData) {
    const container = document.getElementById('farmcalculator');
    if (!container) return;

    const stateUser = State.getUserData();
    const user = stateUser || userData;
    
    const username = user?.name;
    this.loadFromStorage(username);
    
    if (user && user.powerData && user.powerData.current_power) {
      const powerEh = user.powerData.current_power / 1000000000;

      // Sem preferência salva, abre na escala do poder da conta — com 673 Eh/s, abrir em
      // Zh/s mostraria "0.673", e em Ph/s mostraria "673000". Depois o que ele escolher manda.
      if (!localStorage.getItem('farm_power_unit')) {
        const escalas = Object.entries(this._UNIDADES_POWER).sort((a, b) => b[1] - a[1]);
        for (const [nome, fator] of escalas) {
          if (powerEh >= fator) { this.state.powerUnit = nome; break; }
        }
      }

      const valor = powerEh / (this._UNIDADES_POWER[this.state.powerUnit] || 1);
      // Trunca em vez de arredondar: o poder exibido nunca deve passar do real, senão
      // dá pra concluir que se está numa liga acima da verdadeira por causa do arredondamento.
      const milesimos = Math.floor(valor * 1000).toString();
      this.state.miningPower = milesimos.length > 3
        ? milesimos.slice(0, -3) + '.' + milesimos.slice(-3)
        : '0.' + milesimos.padStart(3, '0');
    }

    this.init();
    this.render();
  }
};

window.UI_FarmCalculator = UI_FarmCalculator;