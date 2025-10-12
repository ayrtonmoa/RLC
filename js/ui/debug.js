// js/ui/debug.js - Aba Debug

const UI_Debug = {
  mostrar(user) {
    const div = document.getElementById('debug');
    let html = '<h2>Debug Information</h2><div class="debug-info"><h4>Logs do Processo:</h4>';
    
    State.getDebugInfo().forEach(info => {
      html += `<div class="formula-step">${info}</div>`;
    });
    
    html += '</div>';
    
    if (user.powerData) {
      html += `<div class="debug-info">
        <h4>Power Data Raw:</h4>
        <pre>${JSON.stringify(user.powerData, null, 2)}</pre>
      </div>`;
    }
    
    if (user.roomData && user.roomData.miners.length > 0) {
      html += `<div class="debug-info">
        <h4>Primeiro Miner (Sample):</h4>
        <pre>${JSON.stringify(user.roomData.miners[0], null, 2)}</pre>
      </div>`;
    }
    
    div.innerHTML = html;
  }
};

window.UI_Debug = UI_Debug;