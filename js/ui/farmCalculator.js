// js/ui/farmCalculator.js - Calculadora de Farming Completa com Sistema de Ligas
// v2.3 - CoinGecko API usando polygon-ecosystem-token (testado e confirmado!)

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
    currentUsername: null
  },

  // Dados das ligas
  leagueData: {},

  // Configurações
  CONFIG: {
    BLOCKS_PER_DAY: 144.9664, // 09:56 segundos por bloco (padrão)
    BLOCKS_PER_DAY_LTC_TRX: 143.5215, // 10:02 segundos por bloco para LTC e TRX
    GAME_COINS: ['RLT', 'RST', 'HMT'],
    NON_WITHDRAWABLE: ['ALGO'],
    FIXED_PRICES: {
      RLT: 1.00,
      RST: 0.01,
      HMT: 1.00
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

  // Converter payouts da API para valores corretos
  convertLeaguePayouts(currencies) {
    const conversions = {
      'RLT': 1e6,
      'RST': 1e6,
      'SAT': 1e10,
      'LTC_SMALL': 1e8,
      'BNB_SMALL': 1e10,
      'MATIC_SMALL': 1e10,
      'XRP_SMALL': 1e6,
      'DOGE_SMALL': 1e4,
      'ETH_SMALL': 1e10,
      'TRX_SMALL': 1e10,
      'SOL_SMALL': 1e9,
      'ALGO_SMALL': 1e6,
      'HMT': 1e6
    };

    const nameMap = {
      'SAT': 'BTC',
      'LTC_SMALL': 'LTC',
      'BNB_SMALL': 'BNB',
      'MATIC_SMALL': 'POL',
      'XRP_SMALL': 'XRP',
      'DOGE_SMALL': 'DOGE',
      'ETH_SMALL': 'ETH',
      'TRX_SMALL': 'TRX',
      'SOL_SMALL': 'SOL',
      'ALGO_SMALL': 'ALGO'
    };

    const rewards = {};
    currencies.forEach(c => {
      const coinName = nameMap[c.name] || c.name;
      const divider = conversions[c.name] || 1;
      rewards[coinName] = c.payout / divider;
    });

    return rewards;
  },

// Carregar dados das ligas da API (com fallback hardcoded)
  async loadLeagueData() {
    // Fallback com dados das ligas
const leaguesFallback = {
  '68af01ce48490927df92d687': { 
    name: 'Bronze I', 
    rewards: { RLT: 0.73828, RST: 46, BTC: 0.00000179, LTC: 0.00119 } 
  },
  '68af01ce48490927df92d686': { 
    name: 'Bronze II', 
    rewards: { RLT: 1.33984, RST: 83, BTC: 0.00000389, LTC: 0.00253, BNB: 0.00067 } 
  },
  '68af01ce48490927df92d685': { 
    name: 'Bronze III', 
    rewards: { RLT: 1.9, RST: 117, BTC: 0.00000759, LTC: 0.0049, BNB: 0.00087, POL: 6.73 } 
  },
  '68af01ce48490927df92d684': { 
    name: 'Silver I', 
    rewards: { RLT: 1.12, RST: 69, BTC: 0.00000494, LTC: 0.003, BNB: 0.00051, POL: 3.76, XRP: 0.3 } 
  },
  '68af01ce48490927df92d683': { 
    name: 'Silver II', 
    rewards: { RLT: 1.32, RST: 81, BTC: 0.00000528, LTC: 0.0031, BNB: 0.00049, POL: 3.44, XRP: 0.26, DOGE: 6.39 } 
  },
  '68af01ce48490927df92d682': { 
    name: 'Silver III', 
    rewards: { RLT: 1.08, RST: 66, BTC: 0.00000471, LTC: 0.0026, BNB: 0.0004, POL: 2.63, XRP: 0.19, DOGE: 4.42, ETH: 0.00024 } 
  },
  '68af01ce48490927df92d681': { 
    name: 'Gold I', 
    rewards: { RLT: 0.81, RST: 50, BTC: 0.00000396, LTC: 0.0021, BNB: 0.0003, POL: 1.9, XRP: 0.13, DOGE: 2.87, ETH: 0.00015, TRX: 2.56 } 
  },
  '68af01ce48490927df92d680': { 
    name: 'Gold II', 
    rewards: { RLT: 1.3, RST: 80, BTC: 0.00000632, LTC: 0.0027, BNB: 0.0004, POL: 2.29, XRP: 0.15, DOGE: 3.39, ETH: 0.00017, TRX: 2.87, SOL: 0.0107, HMT: 625 } 
  },
  '68af01ce48490927df92d67f': { 
    name: 'Gold III', 
    rewards: { RLT: 3.33, RST: 204, BTC: 0.0000176, LTC: 0.0084, BNB: 0.00127, POL: 7.71, XRP: 0.52, DOGE: 12.03, ETH: 0.00061, TRX: 10.83, SOL: 0.028, HMT: 1528 } 
  },
  '68af01ce48490927df92d67e': { 
    name: 'Platinum I', 
    rewards: { RLT: 5.51, RST: 338, BTC: 0.00003546, LTC: 0.0175, BNB: 0.00273, POL: 17.15, XRP: 1.2, DOGE: 28.39, ETH: 0.00148, TRX: 27.05, SOL: 0.0362, ALGO: 30.9, HMT: 3125 } 
  },
  '68af01ce48490927df92d67d': { 
    name: 'Platinum II', 
    rewards: { RLT: 2.58, RST: 158, BTC: 0.00002172, LTC: 0.0107, BNB: 0.00174, POL: 11.11, XRP: 0.8, DOGE: 19.41, ETH: 0.00104, TRX: 19.35, SOL: 0.0398, ALGO: 12.9, HMT: 2430 } 
  },
  '68af01ce48490927df92d67c': { 
    name: 'Platinum III', 
    rewards: { RLT: 1.48, RST: 91, BTC: 0.00001466, LTC: 0.0073, BNB: 0.00125, POL: 8.22, XRP: 0.61, DOGE: 15.45, ETH: 0.00085, TRX: 16.42, SOL: 0.0423, ALGO: 8.3, HMT: 2084 } 
  },
  '68af01ce48490927df92d67b': { 
    name: 'Diamond I', 
    rewards: { RST: 81, BTC: 0.00001428, LTC: 0.0158, BNB: 0.00144, POL: 16.04, XRP: 1.02, DOGE: 16.33, ETH: 0.00079, TRX: 5.07, SOL: 0.0126, ALGO: 18.6 } 
  },
  '68af01ce48490927df92d67a': { 
    name: 'Diamond II', 
    rewards: { RST: 84, BTC: 0.00001746, LTC: 0.0192, BNB: 0.00201, POL: 19.5, XRP: 1.24, DOGE: 19.86, ETH: 0.00096, TRX: 6.17, SOL: 0.0153, ALGO: 22.6 } 
  },
  '68af01ce48490927df92d679': { 
    name: 'Diamond III', 
    rewards: { RST: 11, BTC: 0.00000198, LTC: 0.00199, BNB: 0.0003, POL: 1.32163, XRP: 0.11772, DOGE: 1.7745, ETH: 0.00009, TRX: 1.262, SOL: 0.00249, ALGO: 1.83942 } 
  }
};
    try {
      const res = await fetch('https://rollercoin.com/api/game/league-list');
      if (!res.ok) throw new Error('Erro ao carregar ligas');
      
      const data = await res.json();
      if (!data.success) throw new Error('API retornou erro');
      
      // Processar ligas da API
      this.leagueData = {};
      data.data.forEach(league => {
        this.leagueData[league._id] = {
          name: league.title.en,
          minPower: league.min_power,
          rewards: this.convertLeaguePayouts(league.currencies)
        };
      });
      
      console.log('✅ Ligas carregadas da API:', Object.keys(this.leagueData).length);
    } catch (error) {
      console.warn('⚠️ Erro ao carregar ligas da API, usando fallback:', error.message);
      
      // Usar fallback
      this.leagueData = leaguesFallback;
      console.log('✅ Ligas carregadas do fallback:', Object.keys(this.leagueData).length);
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
    await this.loadLeagueData();
    this.fetchPrices();
    setInterval(() => this.fetchPrices(), 5 * 60 * 1000);
  },

  // Carregar dados do localStorage - POR USUÁRIO
  loadFromStorage(username) {
    try {
      const savedNetwork = localStorage.getItem('farm_network_data');
      
      if (savedNetwork) this.state.networkData = savedNetwork;
      
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
  saveToStorage(power, network, result, username) {
    try {
      localStorage.setItem('farm_network_data', network);
      
      const newEntry = {
        timestamp: new Date().toISOString(),
        power: parseFloat(power),
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
      // CoinGecko API - Pega cryptos em USD, BRL e EUR numa chamada só!
      // Nota: Testado - "polygon-ecosystem-token" é o ID que funciona!
      const ids = 'bitcoin,ethereum,binancecoin,solana,ripple,dogecoin,tron,litecoin,polygon-ecosystem-token,algorand';
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,brl,eur`;
      
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        
        // Mapear IDs da CoinGecko para símbolos
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
        
        // Calcular taxas de câmbio usando BTC como referência
        if (data.bitcoin?.brl && data.bitcoin?.eur) {
          this.state.usdToBrl = data.bitcoin.brl / data.bitcoin.usd;
          this.state.usdToEur = data.bitcoin.eur / data.bitcoin.usd;
          console.log('✅ CoinGecko: Preços e câmbio atualizados!', {
            BTC: this.state.prices.BTC,
            usdToBrl: this.state.usdToBrl.toFixed(4),
            usdToEur: this.state.usdToEur.toFixed(4)
          });
        } else {
          // Fallback para câmbio se não vier
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

// Parser de dados da rede - CORRIGIDO para aceitar Zh/s e Eh/s
  parseNetworkData(text) {
    const network = {};
    
    // Buscar Zh/s (Zettahash) - converter para Eh/s multiplicando por 1000
    const regexZh = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Zh\/s/gi;
    let match;
    
    while ((match = regexZh.exec(text)) !== null) {
      const symbol = match[2];
      const value = parseFloat(match[3]);
      network[symbol] = value * 1000; // Zh/s -> Eh/s
    }
    
    // Buscar Eh/s (Exahash) - já está na unidade certa
    const regexEh = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Eh\/s/gi;
    
    while ((match = regexEh.exec(text)) !== null) {
      const symbol = match[2];
      const value = parseFloat(match[3]);
      network[symbol] = value; // Já está em Eh/s
    }
    
    return network;
  },

  // Cálculo principal - PASSAR USERNAME
  calculate() {
    const { miningPower, networkData } = this.state;
    
    if (!miningPower || !networkData) {
      alert('Preencha todos os campos!');
      return;
    }

    this.state.loading = true;
    this.render();
    
    const myPowerEh = parseFloat(miningPower);
    const network = this.parseNetworkData(networkData);
    
    // Obter block rewards baseado na liga do usuário
    const userData = State.getUserData();
    const blockRewards = this.getBlockRewards(userData);
    
    const calculations = [];
    
    Object.keys(blockRewards).forEach(coin => {
      if (!network[coin]) return;
      
      const networkPowerEh = network[coin];
      const contribution = (myPowerEh / networkPowerEh) * 100;
      const blockReward = blockRewards[coin];
      const myRewardPerBlock = (contribution / 100) * blockReward;
      
      // Usar blocos/dia específico para LTC e TRX
      const blocksPerDay = (coin === 'LTC' || coin === 'TRX') 
        ? this.CONFIG.BLOCKS_PER_DAY_LTC_TRX 
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
    
    // Salvar com username
    const username = userData?.name || 'unknown';
    this.saveToStorage(miningPower, networkData, calculations, username);
    
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

  // Obter comparação com histórico - CORRIGIDO
  getComparison() {
    if (this.state.history.length < 2) return null;
    
    const current = this.state.history[0];
    const previous = this.state.history[1];
    
    const powerChange = ((current.power - previous.power) / previous.power) * 100;
    const networkChange = ((current.networkTotal - previous.networkTotal) / previous.networkTotal) * 100;
    
    // Filtrar e ordenar para pegar a melhor crypto sacável
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
    
    const labels = this.state.history.slice(0, 10).reverse().map(h => this.formatDate(h.timestamp));
    const powerData = this.state.history.slice(0, 10).reverse().map(h => h.power);
    const networkData = this.state.history.slice(0, 10).reverse().map(h => h.networkTotal / 1000);
    
    this.state.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Meu Power (Eh/s)',
            data: powerData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Rede Total (Zh/s)',
            data: networkData,
            borderColor: '#6f42c1',
            backgroundColor: 'rgba(111, 66, 193, 0.1)',
            tension: 0.4,
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
            labels: { color: '#333' }
          },
          title: {
            display: true,
            text: '📈 Evolução do Poder',
            color: '#333',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: '#007bff' },
            grid: { color: 'rgba(0, 123, 255, 0.1)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            ticks: { color: '#6f42c1' },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: { color: '#333' },
            grid: { color: 'rgba(0, 0, 0, 0.1)' }
          }
        }
      }
    });
  },

  // Limpar histórico - DO USUÁRIO ATUAL
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
    html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
    
    // Linha 1: Power e Botão alinhados
    html += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">';
    
    html += '<div>';
    html += '<label style="font-weight: 600; margin-bottom: 8px; display: block;">Mining Power (Eh):</label>';
    html += `<input type="text" id="farmMiningPower" value="${this.state.miningPower}" placeholder="100.106" style="width: 100%;">`;
    html += '</div>';
    
    html += '<div>';
    html += '<label style="font-weight: 600; margin-bottom: 8px; display: block;">&nbsp;</label>';
    html += '<button onclick="UI_FarmCalculator.calculate()" style="width: 100%;">💰 Calcular</button>';
    html += '</div>';
    
    html += '</div>';
    
    // Linha 2: Info de blocos
    html += `<div style="text-align: center; margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 6px;">`;
    html += `<span style="font-weight: 600; color: #007bff;">📊 Blocos/dia: ${this.CONFIG.BLOCKS_PER_DAY} (padrão) | LTC/TRX: ${this.CONFIG.BLOCKS_PER_DAY_LTC_TRX}</span>`;
    html += '</div>';
    
    // Campo Network Data
    html += '<div>';
    html += '<label style="font-weight: 600; margin-bottom: 8px; display: block;">Rede das moedas:</label>';
    html += `<textarea id="farmNetworkData" rows="3" placeholder="Total 59.869 Zh/s  rlt RLT 2.823 Zh/s rst RST 1.471 Zh/s..." style="width: 100%; font-family: monospace; font-size: 14px;">${this.state.networkData}</textarea>`;
    html += '</div>';
    
    html += '</div>';

    // NOVA SEÇÃO: Informações da Liga
    if (this.state.results) {
      const userData = State.getUserData();
      const leagueInfo = userData && userData.league_id ? this.leagueData[userData.league_id] : null;
      const blockRewards = this.getBlockRewards(userData);
      
      html += '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; color: white;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">';
      html += '<div>';
      html += '<h3 style="margin: 0; color: white;">🏆 Sua Liga</h3>';
      if (leagueInfo) {
        html += `<div style="font-size: 24px; font-weight: bold; margin-top: 5px;">${leagueInfo.name}</div>`;
      } else {
        html += '<div style="font-size: 18px; margin-top: 5px;">Liga não detectada</div>';
      }
      html += '</div>';
      if (userData && userData.league && userData.league.main_img_url) {
        html += `<img src="${userData.league.main_img_url}" alt="Liga" style="height: 80px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">`;
      }
      html += '</div>';
      
      html += '<div style="background: rgba(255,255,255,0.15); padding: 15px; border-radius: 6px; backdrop-filter: blur(10px);">';
      html += '<h4 style="margin: 0 0 12px 0; color: white;">📦 Block Rewards (sua liga)</h4>';
      html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px;">';
      
      Object.entries(blockRewards).forEach(([coin, reward]) => {
        const isGameCoin = this.CONFIG.GAME_COINS.includes(coin);
        html += '<div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px; text-align: center;">';
        html += `<div style="font-size: 11px; opacity: 0.9; margin-bottom: 4px;">${coin}</div>`;
        html += `<div style="font-size: 14px; font-weight: bold;">${isGameCoin ? reward.toFixed(6) : reward.toFixed(8)}</div>`;
        html += `<div style="font-size: 10px; opacity: 0.8;">${isGameCoin ? 'tokens' : 'crypto'}</div>`;
        html += '</div>';
      });
      
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    // Comparação com histórico - COM VALORES ABSOLUTOS
    const comparison = this.getComparison();
    if (comparison) {
      html += '<div style="background: #e8f4f8; border-left: 4px solid #007bff; padding: 15px; margin-bottom: 20px;">';
      html += '<h4 style="margin: 0 0 10px 0;">📊 Comparado com última pesquisa:</h4>';
      html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
      
      // Rede Total
      const currentNetworkZh = (this.state.history[0].networkTotal / 1000).toFixed(3);
      html += '<div>';
      html += '<div style="font-size: 12px; color: #666;">Rede Total</div>';
      html += `<div style="font-size: 18px; color: #6f42c1; font-weight: bold;">${currentNetworkZh} Zh/s</div>`;
      html += `<div style="font-size: 13px; color: ${comparison.networkChange > 0 ? 'green' : comparison.networkChange < 0 ? 'red' : '#666'}; margin-top: 4px;">${comparison.networkDiff > 0 ? '+' : ''}${comparison.networkDiff.toFixed(3)} Zh/s (${comparison.networkChange > 0 ? '↑' : comparison.networkChange < 0 ? '↓' : '→'} ${Math.abs(comparison.networkChange).toFixed(2)}%)</div>`;
      html += '</div>';
      
      // Meu Power
      const currentPower = this.state.history[0].power;
      html += '<div>';
      html += '<div style="font-size: 12px; color: #666;">Meu Power</div>';
      html += `<div style="font-size: 18px; color: #007bff; font-weight: bold;">${currentPower.toFixed(3)} Eh/s</div>`;
      html += `<div style="font-size: 13px; color: ${comparison.powerChange > 0 ? 'green' : comparison.powerChange < 0 ? 'red' : '#666'}; margin-top: 4px;">${comparison.powerDiff > 0 ? '+' : ''}${comparison.powerDiff.toFixed(3)} Eh/s (${comparison.powerChange > 0 ? '↑' : comparison.powerChange < 0 ? '↓' : '→'} ${Math.abs(comparison.powerChange).toFixed(2)}%)</div>`;
      html += '</div>';
      
      // Melhor Crypto - CORRIGIDO
      const currentCryptos = this.state.history[0].results
        ?.filter(r => !this.CONFIG.GAME_COINS.includes(r.coin) && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .sort((a, b) => b.monthly - a.monthly) || [];
      const currentBest = currentCryptos[0];
      const currentBestProfit = currentBest?.monthly || 0;
      
      html += '<div>';
      html += `<div style="font-size: 12px; color: #666;">Melhor Crypto (${comparison.currentBestCoin})</div>`;
      html += `<div style="font-size: 18px; color: #28a745; font-weight: bold;">${this.state.useEUR ? `€${(currentBestProfit * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(currentBestProfit * this.state.usdToBrl).toFixed(2)}` : `$${currentBestProfit.toFixed(2)}`}/mês</div>`;
      html += `<div style="font-size: 13px; color: ${comparison.profitChange > 0 ? 'green' : comparison.profitChange < 0 ? 'red' : '#666'}; margin-top: 4px;">${comparison.profitDiff > 0 ? '+' : ''}${this.state.useEUR ? `€${(comparison.profitDiff * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(comparison.profitDiff * this.state.usdToBrl).toFixed(2)}` : `$${comparison.profitDiff.toFixed(2)}`} (${comparison.profitChange > 0 ? '↑' : comparison.profitChange < 0 ? '↓' : '→'} ${Math.abs(comparison.profitChange).toFixed(2)}%)</div>`;
      if (comparison.currentBestCoin !== comparison.previousBestCoin) {
        html += `<div style="font-size: 11px; color: #ff9800; margin-top: 4px;">⚠️ Antes era ${comparison.previousBestCoin}</div>`;
      }
      html += '</div>';
      
      html += '</div>';
      html += '</div>';
    }

    // Melhor Crypto - CORRIGIDO
    if (this.state.results) {
      const withdrawableCryptos = this.state.results
        .filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .sort((a, b) => b.monthly - a.monthly);
      
      const bestCrypto = withdrawableCryptos[0];
      
      if (bestCrypto) {
        html += '<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: 20px;">';
        html += '<h3 style="margin: 0 0 15px 0;">🏆 Melhor Crypto para Farmar</h3>';
        html += '<div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 2px solid #ffc107;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 4px;">🎯 Recomendação</div>';
        html += `<div style="font-size: 24px; color: #ff9800; font-weight: bold;">${bestCrypto.coin} <span style="background: #e3f2fd; color: #007bff; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">Crypto</span></div>`;
        html += `<div style="font-size: 13px; color: #666; margin-top: 8px;">💡 Esta é a crypto mais lucrativa e sacável com sua contribuição de <strong>${bestCrypto.contribution}%</strong></div>`;
        html += '</div>';
        
html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
        html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Diário</div>';
        html += `<div style="font-size: 20px; color: #ff9800; font-weight: bold;">${this.state.showQuantity ? `${bestCrypto.dailyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useEUR ? `€${(bestCrypto.daily * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(bestCrypto.daily * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.daily.toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Mensal (30D)</div>';
        html += `<div style="font-size: 20px; color: #ff9800; font-weight: bold;">${this.state.showQuantity ? `${bestCrypto.monthlyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useEUR ? `€${(bestCrypto.monthly * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(bestCrypto.monthly * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.monthly.toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Anual (365D)</div>';
        html += `<div style="font-size: 20px; color: #ff9800; font-weight: bold;">${this.state.showQuantity ? `${(bestCrypto.monthlyQty * 12).toFixed(4)} ${bestCrypto.coin}` : (this.state.useEUR ? `€${(bestCrypto.monthly * 12 * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(bestCrypto.monthly * 12 * this.state.usdToBrl).toFixed(2)}` : `$${(bestCrypto.monthly * 12).toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }
    }

    // Top 3 Cryptos - CORRIGIDO
    if (this.state.results) {
      const topCryptos = this.state.results
        .filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .slice(0, 3);
      if (topCryptos.length >= 3) {
        html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
        html += '<h3 style="margin: 0 0 15px 0;">🥇🥈🥉 Top 3 Cryptos (Sacáveis)</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">';
        
        topCryptos.forEach((coin, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
          html += `<div style="background: #fff; padding: 15px; border-radius: 8px; border: ${idx === 0 ? '2px solid #ffc107' : '1px solid #ddd'};">`;
          html += `<div style="font-size: 28px; margin-bottom: 8px;">${medal}</div>`;
          html += `<div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">${coin.coin}</div>`;
          html += `<div style="font-size: 12px; color: #666; margin-bottom: 12px;">Contrib: ${coin.contribution}%</div>`;
          html += '<div style="font-size: 14px; color: #666;">Mensal:</div>';
          html += `<div style="font-size: 16px; color: ${idx === 0 ? '#ff9800' : '#007bff'}; font-weight: bold;">${this.state.showQuantity ? `${coin.monthlyQty.toFixed(4)} ${coin.coin}` : (this.state.useEUR ? `€${(coin.monthly * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(coin.monthly * this.state.usdToBrl).toFixed(2)}` : `$${coin.monthly.toFixed(2)}`)}</div>`;
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
    }



    // Painel de Preços
    html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
    html += '<h3 style="margin: 0;">💰 Cotações</h3>';
    html += '<button onclick="UI_FarmCalculator.fetchPrices()" style="padding: 6px 12px; font-size: 12px;">🔄 Atualizar</button>';
    html += '</div>';
    
    const statusIcon = this.state.priceStatus === 'success' ? '🟢' : this.state.priceStatus === 'fallback' ? '🟡' : '⚪';
    const statusText = this.state.priceStatus === 'fallback' ? ' (fallback)' : '';
    html += `<div style="background: #e3f2fd; padding: 10px; border-radius: 6px; margin-bottom: 12px; font-size: 11px; color: #666;">`;
    html += `<div>${statusIcon} 📡 Fonte: <strong style="color: #007bff;">CoinGecko API</strong>${statusText} (1 chamada para tudo!)</div>`;
    html += `<div>💰 Preços em tempo real | 💱 Câmbio: <strong>R$ ${this.state.usdToBrl.toFixed(4)}</strong> | <strong>€${this.state.usdToEur.toFixed(4)}</strong></div>`;
    html += '</div>';
    
    html += '<div style="max-height: 300px; overflow-y: auto;">';
Object.entries(this.state.prices).forEach(([coin, price]) => {
      html += '<div style="background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #ddd;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center;">';
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

    // Gráfico
    if (this.state.history.length >= 2) {
      html += '<div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; height: 400px;">';
      html += '<canvas id="farmChart"></canvas>';
      html += '</div>';
    }

    // Tabela de Resultados
    if (this.state.results) {
      html += '<div style="background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; flex-wrap: wrap; gap: 10px;">';
      html += '<h3 style="margin: 0;">📊 Resultados Detalhados</h3>';
      
      html += '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
      html += '<button onclick="UI_FarmCalculator.exportCSV()" style="padding: 8px 16px; background: #28a745; font-size: 14px;">📥 Exportar CSV</button>';
      
      html += '<div style="display: flex; background: #f8f9fa; border-radius: 8px; padding: 4px; border: 1px solid #ddd;">';
      html += `<button onclick="UI_FarmCalculator.state.useBRL = false; UI_FarmCalculator.state.useEUR = false; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${!this.state.useBRL && !this.state.useEUR ? '#007bff' : 'transparent'}; color: ${!this.state.useBRL && !this.state.useEUR ? 'white' : '#333'}; font-weight: ${!this.state.useBRL && !this.state.useEUR ? 'bold' : 'normal'};">USD $</button>`;
      html += `<button onclick="UI_FarmCalculator.state.useBRL = true; UI_FarmCalculator.state.useEUR = false; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${this.state.useBRL ? '#007bff' : 'transparent'}; color: ${this.state.useBRL ? 'white' : '#333'}; font-weight: ${this.state.useBRL ? 'bold' : 'normal'};">BRL R$</button>`;
      html += `<button onclick="UI_FarmCalculator.state.useBRL = false; UI_FarmCalculator.state.useEUR = true; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${this.state.useEUR ? '#007bff' : 'transparent'}; color: ${this.state.useEUR ? 'white' : '#333'}; font-weight: ${this.state.useEUR ? 'bold' : 'normal'};">EUR €</button>`;
      html += '</div>';
      
      html += '<div style="display: flex; background: #f8f9fa; border-radius: 8px; padding: 4px; border: 1px solid #ddd;">';
      html += `<button onclick="UI_FarmCalculator.state.showQuantity = false; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${!this.state.showQuantity ? '#6f42c1' : 'transparent'}; color: ${!this.state.showQuantity ? 'white' : '#333'}; font-weight: ${!this.state.showQuantity ? 'bold' : 'normal'};">💰 Valor</button>`;
      html += `<button onclick="UI_FarmCalculator.state.showQuantity = true; UI_FarmCalculator.render();" style="padding: 8px 16px; background: ${this.state.showQuantity ? '#6f42c1' : 'transparent'}; color: ${this.state.showQuantity ? 'white' : '#333'}; font-weight: ${this.state.showQuantity ? 'bold' : 'normal'};">🪙 Quantidade</button>`;
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
        const rowClass = isTopCrypto ? ' style="background: #fff3cd;"' : '';
        const isNonWithdrawable = this.CONFIG.NON_WITHDRAWABLE.includes(r.coin);
        
        html += `<tr${rowClass}>`;
        html += `<td><strong>${r.coin}</strong> <span style="background: ${r.isGameCoin ? '#e3f2fd' : '#f3e5f5'}; color: ${r.isGameCoin ? '#007bff' : '#6f42c1'}; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">${r.isGameCoin ? 'Game' : 'Crypto'}</span>${isTopCrypto ? ' <span style="background: #fff3cd; color: #ff9800; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">🏆 TOP</span>' : ''}${isNonWithdrawable ? ' <span style="background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">🚫 Não sacável</span>' : ''}</td>`;
        html += `<td style="text-align: right; font-size: 13px;">${r.contribution}%</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.block, r.blockQty, !r.isGameCoin, r.coin, 'block')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.daily, r.dailyQty, !r.isGameCoin, r.coin, 'daily')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.weekly, r.weeklyQty, !r.isGameCoin, r.coin, 'weekly')}</td>`;
        html += `<td style="text-align: right;">${this.formatValue(r.monthly, r.monthlyQty, !r.isGameCoin, r.coin, 'monthly')}</td>`;
        html += '</tr>';
      });
      
      html += '</tbody></table>';
      html += '</div>';
      html += '</div>';
    }

    // Histórico
    if (this.state.history.length > 0) {
      html += '<div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">';
      html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">';
      html += `<h3 style="margin: 0;">📜 Histórico de ${this.state.currentUsername || 'Usuário'} (${this.state.history.length})</h3>`;
      html += '<div>';
      html += `<button onclick="UI_FarmCalculator.state.showHistory = !UI_FarmCalculator.state.showHistory; UI_FarmCalculator.render();" style="padding: 6px 12px; font-size: 12px; margin-right: 8px;">${this.state.showHistory ? '▲ Ocultar' : '▼ Mostrar'}</button>`;
      html += '<button onclick="UI_FarmCalculator.clearHistory()" style="padding: 6px 12px; font-size: 12px; background: #dc3545;">🗑️ Limpar Tudo</button>';
      html += '</div>';
      html += '</div>';
      
      if (this.state.showHistory) {
        html += '<div style="max-height: 400px; overflow-y: auto;">';
        this.state.history.forEach((entry, idx) => {
          html += '<div style="background: #fff; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #ddd; position: relative;">';
          
          // Botão de delete no canto superior direito
          html += `<button onclick="UI_FarmCalculator.deleteHistoryEntry(${idx})" style="position: absolute; top: 8px; right: 8px; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">🗑️</button>`;
          
          html += '<div style="display: flex; justify-content: space-between; align-items: center; padding-right: 40px;">';
          html += '<div>';
          html += `<span style="font-weight: 600;">${this.formatDate(entry.timestamp)}</span>`;
          html += `<span style="color: #999; font-size: 12px; margin-left: 8px;">(${this.getTimeAgo(entry.timestamp)})</span>`;
          html += '</div>';
          html += '<div style="text-align: right;">';
          html += `<div style="color: #007bff; font-size: 14px;">Power: ${entry.power.toFixed(3)} Eh/s</div>`;
          html += `<div style="color: #6f42c1; font-size: 12px;">Rede: ${(entry.networkTotal / 1000).toFixed(3)} Zh/s</div>`;
          html += '</div>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Adicionar event listeners para os inputs
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

    // Renderizar gráfico se necessário
    setTimeout(() => this.renderChart(), 100);
  },

   // Mostrar na interface - CARREGAR HISTÓRICO DO USUÁRIO
  mostrar(userData) {
    const container = document.getElementById('farmcalculator');
    if (!container) return;

    const stateUser = State.getUserData();
    const user = stateUser || userData;
    
    // Carregar histórico do usuário específico
    const username = user?.name;
    this.loadFromStorage(username);
    
    if (user && user.powerData && user.powerData.current_power) {
      const powerEh = user.powerData.current_power / 1000000000;
      const powerInt = Math.floor(powerEh * 1000);
      const powerStr = powerInt.toString();
      
      if (powerStr.length > 3) {
        this.state.miningPower = powerStr.slice(0, -3) + '.' + powerStr.slice(-3);
      } else {
        this.state.miningPower = '0.' + powerStr.padStart(3, '0');
      }
    }

    this.init();
    this.render();
  }
};

window.UI_FarmCalculator = UI_FarmCalculator;