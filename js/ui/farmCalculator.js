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
    currentUsername: null
  },

  // Dados das ligas
  leagueData: {},

  // Configurações
  CONFIG: {
    BLOCKS_PER_DAY: 144.9664, // 09:56 segundos por bloco (padrão)
    BLOCKS_PER_DAY_LTC_TRX: 143.5215, // 10:02 segundos por bloco para LTC e TRX
    BLOCKS_PER_DAY_USDT: 149.74, // 09:37 segundos por bloco para USDT ← ADICIONAR
    GAME_COINS: ['RLT', 'RST', 'HMT'],
    NON_WITHDRAWABLE: ['ALGO', 'USDT'],
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
      'HMT': 1e6,
      'USDT_SMALL': 1e6,
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
      'ALGO_SMALL': 'ALGO',
      'USDT_SMALL': 'USDT'
      
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
    rewards: { RLT: 0.76, RST: 48, BTC: 0.00000201, LTC: 0.0015 } 
  },
  '68af01ce48490927df92d686': { 
    name: 'Bronze II', 
    rewards: { RLT: 1.4, RST: 86, BTC: 0.00000411, LTC: 0.00269, BNB: 0.0007 } 
  },
  '68af01ce48490927df92d685': { 
    name: 'Bronze III', 
    rewards: { RLT: 1.55, RST: 117, BTC: 0.00000759, LTC: 0.0049, BNB: 0.00087, POL: 6.73 } 
  },
  '68af01ce48490927df92d684': { 
    name: 'Silver I', 
    rewards: { RLT: 0.91, RST: 69, BTC: 0.0000043, LTC: 0.0026, BNB: 0.00044, POL: 3.27, XRP: 0.26, USDT: 0.14287 } 
  },
  '68af01ce48490927df92d683': { 
    name: 'Silver II', 
    rewards: { RLT: 1.07, RST: 49.61213, BTC: 0.00000459, LTC: 0.0027, BNB: 0.00043, POL: 2.99, XRP: 0.22, DOGE: 5.56, USDT: 0.195529 } 
  },
  '68af01ce48490927df92d682': { 
    name: 'Silver III', 
    rewards: { RLT: 0.88, RST: 66, BTC: 0.0000041, LTC: 0.0023, BNB: 0.00035, POL: 2.29, XRP: 0.16, DOGE: 3.84, ETH: 0.00021, USDT: 0.274038 } 
  },
  '68af01ce48490927df92d681': { 
    name: 'Gold I', 
    rewards: { RLT: 0.66, RST: 50, BTC: 0.00000345, LTC: 0.0018, BNB: 0.00026, POL: 1.65, XRP: 0.11, DOGE: 2.5, ETH: 0.00013, TRX: 2.23, USDT: 0.151647 } 
  },
  '68af01ce48490927df92d680': { 
    name: 'Gold II', 
    rewards: { RLT: 1.06, RST: 80, BTC: 0.0000036, LTC: 0.0023, BNB: 0.00035, POL: 1.99, XRP: 0.13, DOGE: 2.95, ETH: 0.00014, TRX: 2.5, SOL: 0.0093, HMT: 625, USDT: 0.274038 } 
  },
  '68af01ce48490927df92d67f': { 
    name: 'Gold III', 
    rewards: { RLT: 2.72, RST: 204, BTC: 0.00001531, LTC: 0.0073, BNB: 0.00111, POL: 6.71, XRP: 0.46, DOGE: 10.47, ETH: 0.00053, TRX: 9.42, SOL: 0.0243, HMT: 1528, USDT: 1 } 
  },
  '68af01ce48490927df92d67e': { 
    name: 'Platinum I', 
    rewards: { RLT: 4.5, RST: 338, BTC: 0.00003085, LTC: 0.0152, BNB: 0.00238, POL: 14.92, XRP: 1.04, DOGE: 24.7, ETH: 0.00129, TRX: 23.53, SOL: 0.0315, ALGO: 26.9, HMT: 3125, USDT: 2.340383 } 
  },
  '68af01ce48490927df92d67d': { 
    name: 'Platinum II', 
    rewards: { RLT: 2.11, RST: 158, BTC: 0.0000189, LTC: 0.0093, BNB: 0.00151, POL: 9.67, XRP: 0.69, DOGE: 16.88, ETH: 0.0009, TRX: 16.84, SOL: 0.0346, ALGO: 11.2, HMT: 2430, USDT: 1.46274 } 
  },
  '68af01ce48490927df92d67c': { 
    name: 'Platinum III', 
    rewards: { RLT: 1.21, RST: 91, BTC: 0.00001275, LTC: 0.0064, BNB: 0.00109, POL: 7.16, XRP: 0.53, DOGE: 13.44, ETH: 0.00074, TRX: 14.28, SOL: 0.0368, ALGO: 7.2, HMT: 2084, USDT: 1.316466 } 
  },
  '68af01ce48490927df92d67b': { 
    name: 'Diamond I', 
    rewards: { RST: 81, BTC: 0.00001242, LTC: 0.0137, BNB: 0.00126, POL: 13.95, XRP: 0.89, DOGE: 14.21, ETH: 0.00068, TRX: 4.41, SOL: 0.0115, ALGO: 16.2, USDT: 1.170192 } 
  },
  '68af01ce48490927df92d67a': { 
    name: 'Diamond II', 
    rewards: { RST: 45.59218, BTC: 0.0000151, LTC: 0.0167, BNB: 0.00174, POL: 16.96, XRP: 1.08, DOGE: 17.28, ETH: 0.00083, TRX: 5.37, SOL: 0.0133, ALGO: 19.7, USDT: 1.609014 } 
  },
  '68af01ce48490927df92d679': { 
    name: 'Diamond III', 
    rewards: { RST: 88, BTC: 0.00000102, LTC: 0.00127, BNB: 0.00013, POL: 0.94354, XRP: 0.07015, DOGE: 1.1583, ETH: 0.00006, TRX: 0.43505, SOL: 0.00162, ALGO: 2.04621, USDT: 0.34722 } 
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
    
    // Buscar Zh/s (Zettahash) - converter para Eh/s multiplicando por 1000
    const regexZh = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Zh\/s/gi;
    let match;
    
    while ((match = regexZh.exec(text)) !== null) {
      const symbol = match[2];
      const value = parseFloat(match[3]);
      network[symbol] = value * 1000;
    }
    
    // Buscar Eh/s (Exahash)
    const regexEh = /([a-z]+)\s+([A-Z]+)\s+([\d.]+)\s+Eh\/s/gi;
    
    while ((match = regexEh.exec(text)) !== null) {
      const symbol = match[2];
      const value = parseFloat(match[3]);
      network[symbol] = value;
    }
    
    return network;
  },

  // Cálculo principal
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

    // Detectar dark mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#e2e8f0' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

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
    html += '<label class="farm-input-label">Mining Power (Eh):</label>';
    html += `<input type="text" id="farmMiningPower" value="${this.state.miningPower}" placeholder="100.106">`;
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
    html += `<textarea id="farmNetworkData" rows="3" placeholder="Total 59.869 Zh/s  rlt RLT 2.823 Zh/s rst RST 1.471 Zh/s...">${this.state.networkData}</textarea>`;
    html += '</div>';
    
    html += '</div>';

    // Seção da Liga
    if (this.state.results) {
      const userData = State.getUserData();
      const leagueInfo = userData && userData.league_id ? this.leagueData[userData.league_id] : null;
      const blockRewards = this.getBlockRewards(userData);
      
      html += '<div class="farm-league-section">';
      html += '<div class="farm-league-header">';
      html += '<div>';
      html += '<h3 style="margin: 0; color: white;">🏆 Sua Liga</h3>';
      if (leagueInfo) {
        html += `<div class="farm-league-name">${leagueInfo.name}</div>`;
      } else {
        html += '<div style="font-size: 18px; margin-top: 5px;">Liga não detectada</div>';
      }
      html += '</div>';
      if (userData && userData.league && userData.league.main_img_url) {
        html += `<img src="${userData.league.main_img_url}" alt="Liga" style="height: 80px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">`;
      }
      html += '</div>';
      
      html += '<div class="farm-league-rewards">';
      html += '<h4 style="margin: 0 0 12px 0; color: white;">📦 Block Rewards (sua liga)</h4>';
      html += '<div class="farm-rewards-grid">';
      
      Object.entries(blockRewards).forEach(([coin, reward]) => {
        const isGameCoin = this.CONFIG.GAME_COINS.includes(coin);
        html += '<div class="farm-reward-item">';
        html += `<div style="font-size: 11px; opacity: 0.9; margin-bottom: 4px;">${coin}</div>`;
        html += `<div style="font-size: 14px; font-weight: bold;">${isGameCoin ? reward.toFixed(6) : reward.toFixed(8)}</div>`;
        html += `<div style="font-size: 10px; opacity: 0.8;">${isGameCoin ? 'tokens' : 'crypto'}</div>`;
        html += '</div>';
      });
      
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

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
      html += `<div class="farm-comparison-value" style="color: #007bff;">${currentPower.toFixed(3)} Eh/s</div>`;
      html += `<div class="farm-comparison-change" style="color: ${comparison.powerChange > 0 ? 'green' : comparison.powerChange < 0 ? 'red' : '#666'};">${comparison.powerDiff > 0 ? '+' : ''}${comparison.powerDiff.toFixed(3)} Eh/s (${comparison.powerChange > 0 ? '↑' : comparison.powerChange < 0 ? '↓' : '→'} ${Math.abs(comparison.powerChange).toFixed(2)}%)</div>`;
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

    // Melhor Crypto
    if (this.state.results) {
      const withdrawableCryptos = this.state.results
        .filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .sort((a, b) => b.monthly - a.monthly);
      
      const bestCrypto = withdrawableCryptos[0];
      
      if (bestCrypto) {
        html += '<div class="farm-best-crypto">';
        html += '<h3 style="margin: 0 0 15px 0;">🏆 Melhor Crypto para Farmar</h3>';
        html += '<div class="farm-best-card">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 4px;">🎯 Recomendação</div>';
        html += `<div class="farm-best-name">${bestCrypto.coin} <span class="farm-badge-crypto">Crypto</span></div>`;
        html += `<div style="font-size: 13px; color: #666; margin-top: 8px;">💡 Esta é a crypto mais lucrativa e sacável com sua contribuição de <strong>${bestCrypto.contribution}%</strong></div>`;
        html += '</div>';
        
        html += '<div class="farm-stats-grid-3">';
        html += '<div class="farm-stat-box">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Diário</div>';
        html += `<div class="farm-stat-value">${this.state.showQuantity ? `${bestCrypto.dailyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useEUR ? `€${(bestCrypto.daily * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(bestCrypto.daily * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.daily.toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '<div class="farm-stat-box">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Mensal (30D)</div>';
        html += `<div class="farm-stat-value">${this.state.showQuantity ? `${bestCrypto.monthlyQty.toFixed(4)} ${bestCrypto.coin}` : (this.state.useEUR ? `€${(bestCrypto.monthly * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(bestCrypto.monthly * this.state.usdToBrl).toFixed(2)}` : `$${bestCrypto.monthly.toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '<div class="farm-stat-box">';
        html += '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">Anual (365D)</div>';
        html += `<div class="farm-stat-value">${this.state.showQuantity ? `${(bestCrypto.monthlyQty * 12).toFixed(4)} ${bestCrypto.coin}` : (this.state.useEUR ? `€${(bestCrypto.monthly * 12 * this.state.usdToEur).toFixed(2)}` : this.state.useBRL ? `R$ ${(bestCrypto.monthly * 12 * this.state.usdToBrl).toFixed(2)}` : `$${(bestCrypto.monthly * 12).toFixed(2)}`)}</div>`;
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }
    }

    // Top 3 Cryptos
    if (this.state.results) {
      const topCryptos = this.state.results
        .filter(r => !r.isGameCoin && !this.CONFIG.NON_WITHDRAWABLE.includes(r.coin))
        .slice(0, 3);
      if (topCryptos.length >= 3) {
        html += '<div class="farm-top3-section">';
        html += '<h3 style="margin: 0 0 15px 0;">🥇🥈🥉 Top 3 Cryptos (Sacáveis)</h3>';
        html += '<div class="farm-top3-grid">';
        
        topCryptos.forEach((coin, idx) => {
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
          html += `<div class="farm-top3-card ${idx === 0 ? 'gold' : ''}">`;
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
    html += '<div class="farm-prices-panel">';
    html += '<div class="farm-prices-header">';
    html += '<h3 style="margin: 0;">💰 Cotações</h3>';
    html += '<button onclick="UI_FarmCalculator.fetchPrices()" style="padding: 6px 12px; font-size: 12px;">🔄 Atualizar</button>';
    html += '</div>';
    
    const statusIcon = this.state.priceStatus === 'success' ? '🟢' : this.state.priceStatus === 'fallback' ? '🟡' : '⚪';
    const statusText = this.state.priceStatus === 'fallback' ? ' (fallback)' : '';
    html += '<div class="farm-prices-info">';
    html += `<div>${statusIcon} 📡 Fonte: <strong style="color: #007bff;">CoinGecko API</strong>${statusText} (1 chamada para tudo!)</div>`;
    html += `<div>💰 Preços em tempo real | 💱 Câmbio: <strong>R$ ${this.state.usdToBrl.toFixed(4)}</strong> | <strong>€${this.state.usdToEur.toFixed(4)}</strong></div>`;
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

    // Gráfico
    if (this.state.history.length >= 2) {
      html += '<div class="farm-chart-container">';
      html += '<canvas id="farmChart"></canvas>';
      html += '</div>';
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
      });
      
      html += '</tbody></table>';
      html += '</div>';
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
          html += `<span class="farm-history-stat-value power">${entry.power.toFixed(3)} Eh/s</span>`;
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