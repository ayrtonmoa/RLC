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
    // Liga escolhida à mão pra simular ("e se eu estivesse na liga de cima?").
    // null = usa a liga real do perfil analisado.
    leagueOverride: null,
    // Unidade em que o usuário digita/lê o poder. O cálculo é sempre em Eh/s.
    powerUnit: 'EH'
  },

  // Fatores relativos a Eh/s — a unidade interna desta aba (o SmartRoom usa GH/s
  // porque lá a base é miner.power; aqui a base é o power da rede, que vem em Eh/Zh).
  _UNIDADES_POWER: { GH: 1e-9, TH: 1e-6, PH: 1e-3, EH: 1, ZH: 1e3, YH: 1e6 },

  // Block rewards por liga (fonte estática oficial).
  // Não há API pública de ligas e a captura via rede exige login,
  // portanto estes valores são mantidos manualmente.
  // Última sincronização manual: 2026-08-18 (IDs de liga trocaram; 7 ligas novas: Titan I-III, Emerald I-III, Legend)
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
      rewards: { RLT: 1.5916, RST: 106.1038, BTC: 0.0000121, LTC: 0.004838, BNB: 0.000726, POL: 3.3866, XRP: 0.2903, DOGE: 7.7409, ETH: 0.00029, TRX: 1.9352, USDT: 0.3714 }
    },
    '6a846d84d4be9e1aa9a15598': {
      name: 'Gold II',
      powerGoal: '1.5 EH/s',
      rewards: { RLT: 2.0937, RST: 157.0244, BTC: 0.00000631, LTC: 0.002525, BNB: 0.000486, POL: 2.6219, XRP: 0.1651, DOGE: 7.7686, ETH: 0.000272, TRX: 2.0393, SOL: 0.007769, HMT: 68.0439, USDT: 0.314 }
    },
    '6a846d84d4be9e1aa9a15599': {
      name: 'Gold III',
      powerGoal: '3.5 EH/s',
      rewards: { RLT: 4.2084, RST: 263.0258, BTC: 0.00002903, LTC: 0.009677, BNB: 0.001645, POL: 6.7742, XRP: 0.6774, DOGE: 29.0323, ETH: 0.000581, TRX: 7.7419, SOL: 0.020323, HMT: 1630.7601, USDT: 1.736 }
    },
    '6a846d84d4be9e1aa9a1559a': {
      name: 'Platinum I',
      powerGoal: '16 EH/s',
      rewards: { RLT: 5.7428, RST: 417.6555, BTC: 0.00004164, LTC: 0.019366, BNB: 0.002275, POL: 15.0083, XRP: 1.2103, DOGE: 31.9531, ETH: 0.001288, TRX: 22.7545, SOL: 0.031953, ALGO: 36.5449, HMT: 4072.1415, USDT: 3.1324 }
    },
    '6a846d84d4be9e1aa9a1559b': {
      name: 'Platinum II',
      powerGoal: '50 EH/s',
      rewards: { RLT: 2.6586, RST: 212.6904, BTC: 0.00002714, LTC: 0.012117, BNB: 0.001454, POL: 9.6936, XRP: 0.9694, DOGE: 24.2339, ETH: 0.000969, TRX: 16.4791, SOL: 0.036836, ALGO: 14.8883, HMT: 3043.599, USDT: 1.9142 }
    },
    '6a846d84d4be9e1aa9a1559c': {
      name: 'Platinum III',
      powerGoal: '100 EH/s',
      rewards: { RLT: 1.9093, RST: 143.6189, BTC: 0.00002134, LTC: 0.010215, BNB: 0.001312, POL: 8.9078, XRP: 0.7762, DOGE: 22.262, ETH: 0.000953, TRX: 17.259, SOL: 0.047063, ALGO: 11.6387, HMT: 3285.4745, USDT: 2.0756 }
    },
    '6a846d84d4be9e1aa9a1559d': {
      name: 'Diamond I',
      powerGoal: '200 EH/s',
      rewards: { RST: 94.2671, BTC: 0.00001708, LTC: 0.017757, BNB: 0.001184, POL: 12.6832, XRP: 1.0569, DOGE: 19.4476, ETH: 0.000676, TRX: 4.3123, SOL: 0.010147, ALGO: 21.6814, USDT: 1.5083 }
    },
    '6a846d84d4be9e1aa9a1559e': {
      name: 'Diamond II',
      powerGoal: '375 EH/s',
      rewards: { RST: 41.929, BTC: 0.00002635, LTC: 0.021252, BNB: 0.00221, POL: 11.9012, XRP: 0.8926, DOGE: 29.753, ETH: 0.000595, TRX: 3.4003, SOL: 0.012751, ALGO: 33.0773, USDT: 2.7953 }
    },
    '6a846d84d4be9e1aa9a1559f': {
      name: 'Diamond III',
      powerGoal: '650 EH/s',
      rewards: { RST: 22.8695, BTC: 0.00001418, LTC: 0.011406, BNB: 0.001153, POL: 6.3032, XRP: 0.4725, DOGE: 15.7344, ETH: 0.000321, TRX: 1.9373, SOL: 0.006804, ALGO: 17.359, USDT: 1.3514 }
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
    BLOCKS_PER_DAY: 144.9664, // 09:56 segundos por bloco (padrão)
    BLOCKS_PER_DAY_LTC_TRX: 143.5215, // 10:02 segundos por bloco para LTC e TRX
    BLOCKS_PER_DAY_USDT: 149.74, // 09:37 segundos por bloco para USDT ← ADICIONAR
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
    // Simulação de outra liga tem prioridade sobre a liga real do perfil.
    const simulada = this.state.leagueOverride;
    if (simulada && this.leagueData[simulada]) {
      return this.leagueData[simulada].rewards;
    }

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
    this.fetchPrices();
    setInterval(() => this.fetchPrices(), 5 * 60 * 1000);
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
      
      const blocksPerDay = (coin === 'LTC' || coin === 'TRX') 
        ? this.CONFIG.BLOCKS_PER_DAY_LTC_TRX 
        : (coin === 'USDT')
          ? this.CONFIG.BLOCKS_PER_DAY_USDT
          : this.CONFIG.BLOCKS_PER_DAY;
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

  // Troca a liga usada no cálculo. Vazio volta pra liga real do perfil.
  // Recalcula na hora (sem gravar histórico) pra tabela e ranking refletirem a liga nova.
  mudarLiga(leagueId) {
    this.state.leagueOverride = leagueId || null;
    if (this.state.results) {
      this.calculate(false);
    } else {
      this.render();
    }
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

  // Exportar CSV
  exportCSV() {
    if (!this.state.results) return;
    if (typeof Analytics !== 'undefined') Analytics.farmCsvExportado();
    
    const csvContent = [
      ['Moeda', 'Tipo', 'Contribuição %', 'Por Bloco', 'Diário', 'Semanal', 'Mensal'],
      ...this.state.results.map(r => [
        r.coin,
        r.isGameCoin ? 'Game' : 'Crypto',
        r.contribution + '%',
        this.state.showQuantity ? `${r.blockQty.toFixed(8)} ${r.coin}` : (r.isGameCoin ? r.blockQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.block * this.state.usdToBrl).toFixed(4)}` : `$${r.block.toFixed(4)}`)),
        this.state.showQuantity ? `${r.dailyQty.toFixed(4)} ${r.coin}` : (r.isGameCoin ? r.dailyQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.daily * this.state.usdToBrl).toFixed(2)}` : `$${r.daily.toFixed(2)}`)),
        this.state.showQuantity ? `${r.weeklyQty.toFixed(4)} ${r.coin}` : (r.isGameCoin ? r.weeklyQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.weekly * this.state.usdToBrl).toFixed(2)}` : `$${r.weekly.toFixed(2)}`)),
        this.state.showQuantity ? `${r.monthlyQty.toFixed(4)} ${r.coin}` : (r.isGameCoin ? r.monthlyQty.toFixed(2) : (this.state.useBRL ? `R$ ${(r.monthly * this.state.usdToBrl).toFixed(2)}` : `$${r.monthly.toFixed(2)}`))
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mining-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },

  // Função principal de renderização
  render() {
    const container = document.getElementById('farmcalculator');
    if (!container) return;

    let html = '<h2>⚡ Farm Calculator</h2>';

    // Seção de Input
    html += '<div class="farm-input-section">';
    html += '<div class="farm-input-grid">';
    
    html += '<div>';
    html += '<label class="farm-input-label">Mining Power:</label>';
    html += '<div style="display:flex; gap:8px;">';
    html += `<input type="text" id="farmMiningPower" value="${this.state.miningPower}" placeholder="100.106" style="flex:1; min-width:0;">`;
    // Trocar a unidade converte o número, então o poder real não muda ao alternar —
    // é exatamente a conta de cabeça que o seletor existe pra evitar.
    html += '<select onchange="UI_FarmCalculator.mudarUnidade(this.value)" id="farmPowerUnit" style="flex:0 0 auto;">';
    Object.keys(this._UNIDADES_POWER).forEach(u => {
      const sel = u === this.state.powerUnit ? ' selected' : '';
      html += `<option value="${u}"${sel}>${u.charAt(0)}${u.charAt(1).toLowerCase()}/s</option>`;
    });
    html += '</select>';
    html += '</div>';
    html += '</div>';
    
    html += '<div>';
    html += '<label class="farm-input-label">&nbsp;</label>';
    html += '<button onclick="UI_FarmCalculator.calculate()">💰 Calcular</button>';
    html += '</div>';
    
    html += '</div>';
    
    // Info de blocos
    html += '<div class="farm-blocks-info">';
    html += `<span style="font-weight: 600; color: #007bff;">📊 Blocos/dia: ${this.CONFIG.BLOCKS_PER_DAY} (padrão) | LTC/TRX: ${this.CONFIG.BLOCKS_PER_DAY_LTC_TRX} | USDT: ${this.CONFIG.BLOCKS_PER_DAY_USDT}</span>`;
    html += '</div>';
    
    // Campo Network Data
    html += '<div>';
    html += '<label class="farm-input-label">Rede das moedas:</label>';
    html += '<div class="farm-network-notice">';
    html += '⚠️ <strong>Atenção:</strong> a fonte dos dados da rede mudou. ';
    html += 'Acesse <a href="https://rollercoin.com/game/league" target="_blank">rollercoin.com/game/league</a>, ';
    html += 'clique na aba <strong>League Power</strong> (por padrão abre em My Power), ';
    html += 'copie tudo que está em <strong>League Power Partition</strong> e cole aqui abaixo.';
    html += '</div>';
    html += `<textarea id="farmNetworkData" rows="6" placeholder="Cole os dados da rede. Formato novo:\nRST\n2%\nPower\n8.082 Zh/s\n\nBTC\n8%\nPower\n34.870 Zh/s">${this.state.networkData}</textarea>`;
    html += '</div>';
    
    html += '</div>';

    // Seção da Liga (compacta) — com seletor pra simular outra liga
    if (this.state.results) {
      const userData = State.getUserData();
      const ligaPerfil = this._ligaDoPerfil();
      const simulando = !!this.state.leagueOverride && this.state.leagueOverride !== ligaPerfil;
      const idEmUso = this.state.leagueOverride || ligaPerfil;
      const leagueInfo = idEmUso ? this.leagueData[idEmUso] : null;
      const blockRewards = this.getBlockRewards(userData);
      const leagueName = leagueInfo ? leagueInfo.name : 'Liga não detectada';
      // A imagem vem do perfil, então só faz sentido enquanto mostramos a liga real.
      const leagueImg = !simulando && userData?.league?.main_img_url
        ? `<img src="${userData.league.main_img_url}" alt="Liga" style="height: 28px; vertical-align: middle; margin-right: 6px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">`
        : '';

      const fundo = simulando
        ? 'linear-gradient(135deg,#4a2c00,#6b3f00)'
        : 'linear-gradient(135deg,#1a1a2e,#16213e)';

      html += `<div style="background:${fundo}; border-radius:8px; padding:10px 16px; margin-bottom:12px;">`;

      html += '<div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">';
      html += `<div style="display:flex; align-items:center; color:white; font-weight:bold; font-size:14px; white-space:nowrap;">${leagueImg}🏆 ${leagueName}${leagueInfo?.powerGoal ? `<span style="margin-left:8px; font-weight:normal; font-size:12px; color:rgba(255,255,255,0.7);">⚡ ${leagueInfo.powerGoal}</span>` : ''}</div>`;

      // Seletor: permite calcular com os rewards de qualquer liga, útil pra simular
      // com o power da rede que alguém de uma liga acima compartilhou.
      html += '<select onchange="UI_FarmCalculator.mudarLiga(this.value)" style="padding:4px 8px; border-radius:4px; border:1px solid rgba(255,255,255,0.3); background:rgba(255,255,255,0.12); color:white; font-size:12px; cursor:pointer;">';
      html += `<option value="" style="color:#000;">${ligaPerfil ? '📍 Minha liga (' + (this.leagueData[ligaPerfil]?.name || '?') + ')' : '📍 Liga do perfil'}</option>`;
      Object.entries(this.leagueData).forEach(([id, liga]) => {
        const sel = id === this.state.leagueOverride ? ' selected' : '';
        html += `<option value="${id}"${sel} style="color:#000;">${liga.name} — ${liga.powerGoal}</option>`;
      });
      html += '</select>';

      if (simulando) {
        html += '<span style="background:#ffc107; color:#000; font-weight:700; font-size:11px; padding:3px 8px; border-radius:4px; white-space:nowrap;">🔬 SIMULAÇÃO</span>';
      }
      html += '</div>';

      if (simulando) {
        html += `<div style="color:rgba(255,255,255,0.8); font-size:11px; margin-top:6px;">Usando os block rewards da <strong>${leagueName}</strong>, não os da sua liga. Cole o power da rede daquela liga pra o resultado fazer sentido. Simulações não entram no histórico.</div>`;
      }

      html += '<div style="display:flex; gap:8px; flex-wrap:wrap; overflow-x:auto; margin-top:8px;">';
      Object.entries(blockRewards).forEach(([coin, reward]) => {
        const isGameCoin = this.CONFIG.GAME_COINS.includes(coin);
        const val = isGameCoin ? reward.toFixed(4) : reward.toFixed(8);
        html += `<span style="background:rgba(255,255,255,0.1); border-radius:4px; padding:3px 8px; color:white; font-size:12px; white-space:nowrap;"><strong>${coin}</strong> ${val}</span>`;
      });
      html += '</div>';
      html += '</div>';
    }

    // Comparação com histórico
    // Durante uma simulação de liga a comparação sairia do histórico real, ao lado de
    // resultados simulados — dois contextos diferentes lado a lado. Melhor esconder.
    const simulandoLiga = !!this.state.leagueOverride && this.state.leagueOverride !== this._ligaDoPerfil();
    const comparison = simulandoLiga ? null : this.getComparison();
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

    // Ranking das cryptos sacáveis. Antes eram dois blocos ("Melhor Crypto" e "Top 3"),
    // e o 1o lugar do Top 3 era exatamente a Melhor Crypto — a mesma moeda aparecia duas
    // vezes seguidas antes da tabela. Aqui o vencedor fica em destaque e o 2o/3o entram
    // como vice-campeões logo abaixo, no mesmo bloco.
    if (this.state.results) {
      const sacaveis = this.state.results
        .filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .sort((a, b) => b.monthly - a.monthly);

      const vencedora = sacaveis[0];
      const vices = sacaveis.slice(1, 3);

      if (vencedora) {
        html += '<div class="farm-best-crypto">';
        html += '<h3 style="margin: 0 0 15px 0;">🏆 Melhor Crypto para Farmar</h3>';
        html += '<div class="farm-best-card">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 4px;">🥇 Recomendação</div>';
        html += `<div class="farm-best-name">${vencedora.coin} <span class="farm-badge-crypto">Crypto</span></div>`;
        html += `<div style="font-size: 13px; color: #666; margin-top: 8px;">💡 Esta é a crypto mais lucrativa e sacável com sua contribuição de <strong>${vencedora.contribution}%</strong></div>`;
        html += '</div>';

        html += '<div class="farm-stats-grid-3">';
        [
          ['Diário', 'daily', 'dailyQty', 1],
          ['Mensal (30D)', 'monthly', 'monthlyQty', 1],
          ['Anual (365D)', 'monthly', 'monthlyQty', 12]
        ].forEach(([rotulo, campoValor, campoQtd, fator]) => {
          const valor = this.state.showQuantity
            ? `${(vencedora[campoQtd] * fator).toFixed(4)} ${vencedora.coin}`
            : this._moeda(vencedora[campoValor] * fator);
          html += '<div class="farm-stat-box">';
          html += `<div style="font-size: 14px; color: #666; margin-bottom: 8px;">${rotulo}</div>`;
          html += `<div class="farm-stat-value">${valor}</div>`;
          html += '</div>';
        });
        html += '</div>';

        if (vices.length) {
          html += '<div style="margin-top: 16px;">';
          html += '<div style="font-size: 13px; color: #666; margin-bottom: 8px;">Se preferir outra moeda:</div>';
          html += '<div class="farm-top3-grid">';
          vices.forEach((c, idx) => {
            html += '<div class="farm-top3-card">';
            html += `<div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">${idx === 0 ? '🥈' : '🥉'} ${c.coin}</div>`;
            html += `<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Contrib: ${c.contribution}%</div>`;
            html += '<div style="font-size: 13px; color: #666;">Mensal:</div>';
            html += `<div style="font-size: 16px; color: #007bff; font-weight: bold;">${this._ganho(c, 'monthly', 'monthlyQty')}</div>`;
            html += '</div>';
          });
          html += '</div>';
          html += '</div>';
        }

        html += '</div>';
      }
    }

    // Tabela de Resultados
    if (this.state.results) {
      html += '<div class="farm-results-section">';
      html += '<div class="farm-results-header">';
      html += '<h3 style="margin: 0;">📊 Resultados Detalhados</h3>';
      
      html += '<div class="farm-toolbar">';
      html += '<button onclick="UI_FarmCalculator.exportCSV()" style="padding: 8px 16px; background: #28a745; font-size: 14px;">📥 Exportar CSV</button>';
      
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

        // EVENTO TEMPORÁRIO — boost DOGE x3. Anunciado por e-mail em 19/08/2026 16:35 como
        // "próximos 7 dias", ou seja, acaba por volta de 26/08/2026: REMOVER este bloco então.
        // (Não confundir com 20 e 21/08, que são os fins dos eventos No Reservations e
        // Road to Five Stars — esses são outra coisa e não afetam o multiplicador do DOGE.)
        if (r.coin === 'DOGE') {
          html += '<tr style="background: rgba(255, 193, 7, 0.12);">';
          html += `<td><strong>DOGE</strong> <span class="farm-badge-crypto">Crypto</span> <span style="background:#ffc107; color:#000; font-weight:700; font-size:11px; padding:2px 6px; border-radius:4px; margin-left:4px; white-space:nowrap; display:inline-block;">🐕 3x EVENTO</span></td>`;
          html += `<td style="text-align: right; font-size: 13px;">${r.contribution}%</td>`;
          html += `<td style="text-align: right;">${this.formatValue(r.block * 3, r.blockQty * 3, true, 'DOGE', 'block')}</td>`;
          html += `<td style="text-align: right;">${this.formatValue(r.daily * 3, r.dailyQty * 3, true, 'DOGE', 'daily')}</td>`;
          html += `<td style="text-align: right;">${this.formatValue(r.weekly * 3, r.weeklyQty * 3, true, 'DOGE', 'weekly')}</td>`;
          html += `<td style="text-align: right;">${this.formatValue(r.monthly * 3, r.monthlyQty * 3, true, 'DOGE', 'monthly')}</td>`;
          html += '</tr>';
        }
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
    html += '<button onclick="UI_FarmCalculator.fetchPrices()" style="padding: 6px 12px; font-size: 12px;">🔄 Atualizar</button>';
    html += '</div>';
    html += '<div class="farm-prices-info">';
    html += `<div>${statusIcon} 📡 Fonte: <strong style="color: #007bff;">CoinGecko API</strong>${statusText}</div>`;
    html += `<div>💱 Câmbio: <strong>R$ ${this.state.usdToBrl.toFixed(4)}</strong> | <strong>€${this.state.usdToEur.toFixed(4)}</strong></div>`;
    html += '</div>';
    html += '<div class="farm-prices-scroll">';
    Object.entries(this.state.prices).forEach(([coin, price]) => {
      html += '<div class="farm-price-item">';
      html += '<div class="farm-price-row">';
      html += `<span style="font-weight: 600;">${coin}</span>`;
      html += '<div style="text-align: right;">';
      html += `<div style="color: #ff9800; font-size: 14px; font-weight: bold;">$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>`;
      html += `<div style="color: #666; font-size: 12px;">R$ ${(price * this.state.usdToBrl).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>`;
      html += `<div style="color: #666; font-size: 12px;">€${(price * this.state.usdToEur).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>`;
      html += '</div>';
      html += '</div>';
      html += '</div>';
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