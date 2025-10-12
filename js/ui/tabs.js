// js/ui/tabs.js - Gerenciamento de Abas

const UI_Tabs = {
  init() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.dataset.tab;
        
        // Remove active de todas
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Adiciona active na selecionada
        this.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
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