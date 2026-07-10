// js/ui/tabs.js - Gerenciamento de Abas COM DEBUG

const UI_Tabs = {
  init() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
      item.addEventListener('click', function() {
        const targetTab = this.dataset.tab;

        // Remove active de todos
        navItems.forEach(n => n.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        // Adiciona active na selecionada
        this.classList.add('active');
        document.getElementById(targetTab).classList.add('active');

        if (typeof Analytics !== 'undefined') Analytics.tabView(targetTab);
      
    
        
        // ========== CHAMAR MOSTRAR() DOS MÓDULOS ==========
        
        // Merge Analyzer
        if (targetTab === 'merge' || targetTab === 'mergeanalyzer') {
          console.log('🎯 Aba: Merge Analyzer');
          if (typeof UI_MergeAnalyzer !== 'undefined' && typeof UI_MergeAnalyzer.mostrar === 'function') {
            console.log('✅ Chamando UI_MergeAnalyzer.mostrar()');
            UI_MergeAnalyzer.mostrar();
          } else {
            console.error('❌ UI_MergeAnalyzer não está definido!');
          }
        }


        // Se for a aba farmcalculator, recarregar o power
if (targetTab === 'farmcalculator') {
  const user = State.getUserData();
  if (user && typeof UI_FarmCalculator !== 'undefined') {
    UI_FarmCalculator.mostrar(user);
  }
}
        
        // Merge Calculator
        else if (targetTab === 'mergecalculator') {
          console.log('🎯 Aba: Merge Calculator');
          if (typeof UI_MergeCalculator !== 'undefined' && typeof UI_MergeCalculator.mostrar === 'function') {
            console.log('✅ Chamando UI_MergeCalculator.mostrar()');
            UI_MergeCalculator.mostrar();
          } else {
            console.error('❌ UI_MergeCalculator não está definido ou falta o método .mostrar()!');
          }
        }
        
        // Merge vs Market
        else if (targetTab === 'mergevsmarket') {
          console.log('🎯 Aba: Merge vs Market');
          if (typeof UI_MergeVsMarket !== 'undefined' && typeof UI_MergeVsMarket.mostrar === 'function') {
            console.log('✅ Chamando UI_MergeVsMarket.mostrar()');
            UI_MergeVsMarket.mostrar();
          } else {
            console.error('❌ UI_MergeVsMarket não está definido ou falta o método .mostrar()!');
          }
        }
        
        // RST & Sell Analyzer
        else if (targetTab === 'rstsellanalyzer') {
          console.log('🎯 Aba: RST & Sell Analyzer');
          if (typeof UI_RSTSellAnalyzer !== 'undefined' && typeof UI_RSTSellAnalyzer.mostrar === 'function') {
            console.log('✅ Chamando UI_RSTSellAnalyzer.mostrar()');
            UI_RSTSellAnalyzer.mostrar();
          } else {
            console.error('❌ UI_RSTSellAnalyzer não está definido ou falta o método .mostrar()!');
          }
        }
        
        // Guia
        else if (targetTab === 'guia') {
          console.log('🎯 Aba: Guia');
          if (typeof UI_Guia !== 'undefined' && typeof UI_Guia.mostrar === 'function') {
            console.log('✅ Chamando UI_Guia.mostrar()');
            UI_Guia.mostrar();
          }
        }
        
        // Resumo
        else if (targetTab === 'resumo') {
          console.log('🎯 Aba: Resumo');
          if (typeof UI_Resumo !== 'undefined' && typeof UI_Resumo.mostrar === 'function') {
            console.log('✅ Chamando UI_Resumo.mostrar()');
            UI_Resumo.mostrar();
          }
        }
        
        // Miners
        else if (targetTab === 'miners') {
          console.log('🎯 Aba: Miners');
          if (typeof UI_Miners !== 'undefined' && typeof UI_Miners.mostrar === 'function') {
            console.log('✅ Chamando UI_Miners.mostrar()');
            UI_Miners.mostrar();
          }
        }
        
        // Buy Analyzer
        else if (targetTab === 'buyanalyzer') {
          console.log('🎯 Aba: Buy Analyzer');
          if (typeof UI_BuyAnalyzer !== 'undefined' && typeof UI_BuyAnalyzer.mostrar === 'function') {
            console.log('✅ Chamando UI_BuyAnalyzer.mostrar()');
            UI_BuyAnalyzer.mostrar();
          }
        }
        
// Inventário
else if (targetTab === 'inventario') {
  console.log('🎯 Aba: Inventário');
  if (typeof UI_Inventario !== 'undefined') {
    // ⬇️ MUDANÇA AQUI: recarregar() se tiver dados, senão mostrar()
    if (UI_Inventario.minersCached && UI_Inventario.minersCached.length > 0) {
      console.log('✅ Recarregando dados do inventário');
      UI_Inventario.recarregar();
    } else {
      console.log('✅ Mostrando formulário inicial');
      UI_Inventario.mostrar();
    }
  }
}
        
        // MinerMerge
        else if (targetTab === 'minermerge') {
          console.log('🎯 Aba: MinerMerge');
          if (typeof UI_MinerMerge !== 'undefined' && typeof UI_MinerMerge.mostrar === 'function') {
            console.log('✅ Chamando UI_MinerMerge.mostrar()');
            UI_MinerMerge.mostrar();
          } else {
            console.error('❌ UI_MinerMerge não está definido!');
          }
        }

        // SmartRoom
        else if (targetTab === 'roomplanner') {
          console.log('🎯 Aba: SmartRoom');
          if (typeof UI_RoomPlanner !== 'undefined' && typeof UI_RoomPlanner.mostrar === 'function') {
            console.log('✅ Chamando UI_RoomPlanner.mostrar()');
            UI_RoomPlanner.mostrar();
          } else {
            console.error('❌ UI_RoomPlanner não está definido!');
          }
        }

        // Racks
        else if (targetTab === 'racks') {
          console.log('🎯 Aba: Racks');
          if (typeof UI_Racks !== 'undefined' && typeof UI_Racks.mostrar === 'function') {
            console.log('✅ Chamando UI_Racks.mostrar()');
            UI_Racks.mostrar();
          }
        }
        
        // Debug
        else if (targetTab === 'debug') {
          console.log('🎯 Aba: Debug');
          if (typeof UI_Debug !== 'undefined' && typeof UI_Debug.mostrar === 'function') {
            console.log('✅ Chamando UI_Debug.mostrar()');
            UI_Debug.mostrar();
          }
        }
        
        else {
          console.log('ℹ️ Aba sem módulo específico:', targetTab);
        }
      });
    });
    
    console.log('✅ UI_Tabs inicializado com', navItems.length, 'itens de navegação');
  },
  
  switchTo(tabName) {
    const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (navItem) {
      console.log('🔄 Mudando para aba:', tabName);
      navItem.click();
    } else {
      console.warn('⚠️ Aba não encontrada:', tabName);
    }
  }
};

window.UI_Tabs = UI_Tabs;
console.log('✅ tabs.js loaded');