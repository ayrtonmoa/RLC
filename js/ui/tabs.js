// js/ui/tabs.js - Gerenciamento de Abas COM DEBUG

const UI_Tabs = {
  init() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        
        console.log('🔍 Aba clicada:', targetTab);  // ✅ DEBUG
        
        // Remove active de todas
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Adiciona active na selecionada
        this.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        // Chamar mostrar() do MergeAnalyzer quando clicar na aba
        if (targetTab === 'merge' || targetTab === 'mergeanalyzer') {
          console.log('🎯 É a aba mergeanalyzer!');  // ✅ DEBUG
          console.log('UI_MergeAnalyzer existe?', typeof UI_MergeAnalyzer !== 'undefined');  // ✅ DEBUG
          
          if (typeof UI_MergeAnalyzer !== 'undefined') {
            console.log('✅ Chamando UI_MergeAnalyzer.mostrar()');  // ✅ DEBUG
            UI_MergeAnalyzer.mostrar();
          } else {
            console.error('❌ UI_MergeAnalyzer não está definido!');  // ✅ DEBUG
          }
        }
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