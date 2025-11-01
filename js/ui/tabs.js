// js/ui/tabs.js - Gerenciamento de Abas COM DEBUG

const UI_Tabs = {
  init() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        
        console.log('🔍 Aba clicada:', targetTab);  // ✅ DEBUG
        
        // Remove active de todas
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Adiciona active na selecionada
        this.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        // Chamar mostrar() dos Módulos quando clicar na aba

        // Lógica para UI_MergeAnalyzer e UI_MergeCalculator (já existentes)
        if (targetTab === 'merge' || targetTab === 'mergeanalyzer') {
          console.log('🎯 É a aba mergeanalyzer!');  // ✅ DEBUG
          if (typeof UI_MergeAnalyzer !== 'undefined' && typeof UI_MergeAnalyzer.mostrar === 'function') {
            console.log('✅ Chamando UI_MergeAnalyzer.mostrar()');  // ✅ DEBUG
            UI_MergeAnalyzer.mostrar();
          } else {
            console.error('❌ UI_MergeAnalyzer não está definido!');  // ✅ DEBUG
          }
        }
        
        // --- NOVO CÓDIGO A SER ADICIONADO AQUI: MERGE VS MARKET ---
        else if (targetTab === 'mergevsmarket') {
          console.log('🎯 É a aba mergevsmarket!');  // ✅ DEBUG
          if (typeof UI_MergeVsMarket !== 'undefined' && typeof UI_MergeVsMarket.mostrar === 'function') {
            console.log('✅ Chamando UI_MergeVsMarket.mostrar()');  // ✅ DEBUG
            UI_MergeVsMarket.mostrar();
          } else {
            console.error('❌ UI_MergeVsMarket não está definido ou falta o método .mostrar()!');  // ✅ DEBUG
          }
        }
        // --- FIM DO NOVO CÓDIGO ---

        // Você pode querer adicionar 'mergecalculator' aqui também, 
        // caso não o inicialize no DOMContentLoaded
        /*
        else if (targetTab === 'mergecalculator') {
             if (typeof UI_MergeCalculator !== 'undefined' && typeof UI_MergeCalculator.mostrar === 'function') {
                 UI_MergeCalculator.mostrar();
             }
        }
        */
      });
    });
  },
  
  switchTo(tabName) {
    const tab = document.querySelector(`[data-tab="${tabName}"]`);
    if (tab) {
      tab.click();
    }
  }
};

window.UI_Tabs = UI_Tabs;