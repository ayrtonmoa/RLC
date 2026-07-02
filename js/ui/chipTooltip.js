// js/ui/chipTooltip.js - Tooltip compartilhado entre Inventario, MinerMerge e RoomPlanner

const ChipTooltip = {
  _el: null,

  init: function() {
    if (this._el) return;
    const el = document.createElement('div');
    el.id = 'tier-chip-tooltip';
    el.style.cssText = 'display:none;position:fixed;z-index:9999;pointer-events:none;';
    document.body.appendChild(el);
    this._el = el;

    const show = (chip, x, y) => {
      const status  = chip.dataset.tipStatus  || '';
      const power   = chip.dataset.tipPower   || '';
      const bonus   = chip.dataset.tipBonus   || '';
      const cost    = chip.dataset.tipCost    || '';
      const parts   = chip.dataset.tipParts   || '';
      const impact  = chip.dataset.tipImpact  || '';
      const extra   = chip.dataset.tipExtra   || '';
      const isMergeChip = chip.classList.contains('merge-level-chip');

      let inner = `<div class="ctt-row ctt-status">${status}</div>`;
      if (power) inner += `<div class="ctt-row">⚡ <strong>${power}</strong>${bonus ? ` <span style="opacity:.65;">+${bonus} bônus</span>` : ''}</div>`;
      if (cost)  inner += `<div class="ctt-row">💰 ${cost}</div>`;
      if (impact) inner += `<div class="ctt-row">📉 Impacto real: <strong>${impact}</strong></div>`;
      if (extra) inner += `<div class="ctt-row">${extra}</div>`;

      if (parts) {
        inner += `<div class="ctt-divider"></div>`;
        inner += `<div class="ctt-row ctt-label">🧩 Ingredientes para este nível:</div>`;
        parts.split('~').forEach(p => {
          const [name, rarity, count] = p.split('|');
          const rarityStr = rarity ? ` (${rarity})` : '';
          inner += `<div class="ctt-row ctt-part">• ${count}× ${name}${rarityStr}</div>`;
        });
      } else if (isMergeChip && chip.dataset.tipPower) {
        inner += `<div class="ctt-divider"></div>`;
        inner += `<div class="ctt-row ctt-label" style="opacity:.5;">Sem receita (nível base)</div>`;
      }

      el.innerHTML = inner;
      el.style.display = 'block';
      this._position(x, y);
    };

    const tipSelector = '.merge-level-chip[data-tip-power], .rack-cell[data-tip-power], .bench-chip[data-tip-power], .room-planner-rack-header[data-tip-power]';
    document.addEventListener('mouseover', e => {
      const chip = e.target.closest(tipSelector);
      if (chip) show(chip, e.clientX, e.clientY);
      else el.style.display = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (el.style.display === 'none') return;
      const chip = e.target.closest(tipSelector);
      if (chip) this._position(e.clientX, e.clientY);
      else el.style.display = 'none';
    });
  },

  _position: function(x, y) {
    const el = this._el;
    if (!el) return;
    const gap = 12;
    const vw = window.innerWidth, vh = window.innerHeight;
    el.style.left = '0'; el.style.top = '0'; // reset for measurement
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = x + gap;
    let top  = y - h / 2;
    if (left + w > vw - 8) left = x - w - gap;
    if (top < 8) top = 8;
    if (top + h > vh - 8) top = vh - h - 8;
    el.style.left = left + 'px';
    el.style.top  = top  + 'px';
  },
};

window.ChipTooltip = ChipTooltip;
