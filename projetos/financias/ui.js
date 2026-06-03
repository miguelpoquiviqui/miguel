/**
 * ui.js – Camada de interface
 * Renderiza o DOM baseado nos dados recebidos.
 */

 var UI = (function () {

  function fmtMoney(v) {
    return 'R$ ' + Math.abs(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function fmtDate(str) {
    if (!str) return '';
    var p = str.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }

  function getCatIcon(catName) {
    var cats = DB.getCategories();
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].name === catName) return cats[i].icon;
    }
    return '📦';
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ---- Renderizar item de transação ---- */
  function renderTxItem(t, showActions) {
    var div = document.createElement('div');
    div.className = 'tx-item';
    div.setAttribute('data-id', t.id);
    var prefix = t.type === 'receita' ? '+' : '-';
    var actions = showActions
      ? '<div class="tx-actions">'
          + '<button class="tx-btn edit" data-id="' + t.id + '" title="Editar">✏️</button>'
          + '<button class="tx-btn delete" data-id="' + t.id + '" title="Excluir">🗑️</button>'
        + '</div>'
      : '';

    div.innerHTML =
      '<div class="tx-icon ' + t.type + '">' + getCatIcon(t.category) + '</div>'
      + '<div class="tx-info">'
        + '<div class="tx-desc">' + escHtml(t.description) + '</div>'
        + '<div class="tx-meta">' + escHtml(t.category) + ' · ' + fmtDate(t.date) + '</div>'
      + '</div>'
      + '<span class="tx-amount ' + t.type + '">' + prefix + fmtMoney(t.amount) + '</span>'
      + actions;
    return div;
  }

  function renderList(containerId, transactions, showActions) {
    var el = document.getElementById(containerId);
    el.innerHTML = '';
    if (!transactions.length) {
      el.innerHTML = '<div class="empty-state">Nenhuma transação encontrada</div>';
      return;
    }
    var sorted = transactions.slice().sort(function (a, b) { return b.date.localeCompare(a.date); });
    sorted.forEach(function (t) { el.appendChild(renderTxItem(t, showActions)); });
  }

  /* ---- Cards ---- */
  function updateCards(transactions) {
    var income = 0, expense = 0;
    transactions.forEach(function (t) {
      if (t.type === 'receita') income  += t.amount;
      else                       expense += t.amount;
    });
    var balance = income - expense;
    document.getElementById('totalBalance').textContent = (balance < 0 ? '-' : '') + fmtMoney(Math.abs(balance));
    document.getElementById('totalIncome').textContent  = fmtMoney(income);
    document.getElementById('totalExpense').textContent = fmtMoney(expense);
    var balCard = document.getElementById('cardBalance');
    if (balance < 0) balCard.classList.add('balance-negative');
    else             balCard.classList.remove('balance-negative');
  }

  /* ---- Metas ---- */
  function renderGoals(goals) {
    var el = document.getElementById('goalsList');
    el.innerHTML = '';
    if (!goals.length) {
      el.innerHTML = '<div class="empty-state">Nenhuma meta criada ainda</div>';
      return;
    }
    goals.forEach(function (g) {
      var pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
      var complete = pct >= 100;
      var div = document.createElement('div');
      div.className = 'goal-card';
      div.innerHTML =
        '<div class="goal-header">'
          + '<div class="goal-title"><span class="goal-icon">' + escHtml(g.icon) + '</span>' + escHtml(g.name) + '</div>'
          + '<div class="tx-actions">'
            + '<button class="tx-btn edit-goal" data-id="' + g.id + '" title="Editar">✏️</button>'
            + '<button class="tx-btn delete delete-goal" data-id="' + g.id + '" title="Excluir">🗑️</button>'
          + '</div>'
        + '</div>'
        + '<div class="goal-values">'
          + '<span class="goal-current">' + fmtMoney(g.current) + '</span>'
          + '<span class="goal-target">de ' + fmtMoney(g.target) + '</span>'
        + '</div>'
        + '<div class="progress-bar-wrap"><div class="progress-bar' + (complete ? ' complete' : '') + '" style="width:' + pct + '%"></div></div>'
        + '<div class="goal-pct">' + pct + '% ' + (complete ? '🎉 Concluída!' : 'concluído') + '</div>';
      el.appendChild(div);
    });
  }

  /* ---- Recorrentes ---- */
  function renderRecurring(list) {
    var el = document.getElementById('recurringList');
    el.innerHTML = '';
    if (!list.length) {
      el.innerHTML = '<div class="empty-state">Nenhuma despesa recorrente cadastrada</div>';
      return;
    }
    var today = new Date().getDate();
    list.forEach(function (r) {
      var diff = r.day - today;
      var badge, badgeText;
      if (diff < 0)       { badge = 'late'; badgeText = 'Venceu há ' + Math.abs(diff) + ' dias'; }
      else if (diff <= 5) { badge = 'warn'; badgeText = 'Vence em ' + diff + ' dia(s)'; }
      else                { badge = 'ok';   badgeText = 'Vence dia ' + r.day; }

      var div = document.createElement('div');
      div.className = 'tx-item';
      div.innerHTML =
        '<div class="tx-icon despesa">' + getCatIcon(r.category) + '</div>'
        + '<div class="tx-info">'
          + '<div class="tx-desc">' + escHtml(r.description) + '</div>'
          + '<div class="tx-meta">' + escHtml(r.category) + '</div>'
        + '</div>'
        + '<span class="recur-badge ' + badge + '">' + badgeText + '</span>'
        + '<span class="tx-amount despesa" style="margin-left:10px">-' + fmtMoney(r.amount) + '</span>'
        + '<div class="tx-actions">'
          + '<button class="tx-btn edit-recur" data-id="' + r.id + '" title="Editar">✏️</button>'
          + '<button class="tx-btn delete delete-recur" data-id="' + r.id + '" title="Excluir">🗑️</button>'
        + '</div>';
      el.appendChild(div);
    });
  }

  /* ---- Categorias (settings) ---- */
  function renderCategories() {
    var el = document.getElementById('catList');
    el.innerHTML = '';
    var cats = DB.getCategories();
    cats.forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'cat-item';
      div.innerHTML =
        '<span class="cat-item-icon">' + escHtml(c.icon) + '</span>'
        + '<span class="cat-item-name">' + escHtml(c.name) + '</span>'
        + '<button class="cat-delete" data-id="' + c.id + '" title="Remover">✕</button>';
      el.appendChild(div);
    });
  }

  /* ---- Popula selects de categoria ---- */
  function populateCategorySelects() {
    var cats = DB.getCategories();
    var ids = ['txCategory', 'recurCategory', 'filterCategory'];
    ids.forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      var isFilter = id === 'filterCategory';
      sel.innerHTML = isFilter ? '<option value="">Todas categorias</option>' : '';
      cats.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.icon + ' ' + c.name;
        sel.appendChild(opt);
      });
    });
  }

  /* ---- Foto de perfil ---- */
  function updateProfilePhoto(photoData) {
    var ids = ['sidebarAvatar', 'profilePicDisplay'];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (photoData) {
        el.innerHTML = '<img src="' + photoData + '" alt="Foto" />';
      } else {
        el.innerHTML = '👤';
      }
    });
  }

  /* ---- Alertas de vencimento ---- */
  function updateAlerts(recurring) {
    var box = document.getElementById('alertsBox');
    var today = new Date().getDate();
    var alerts = recurring.filter(function (r) { return (r.day - today) <= 5 && (r.day - today) >= -1; });
    if (!alerts.length) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    box.innerHTML = '<strong>⚠️ Contas a vencer:</strong>';
    alerts.forEach(function (r) {
      var diff = r.day - today;
      var msg = diff < 0 ? 'Venceu há ' + Math.abs(diff) + ' dia(s)' : (diff === 0 ? 'Vence hoje!' : 'Vence em ' + diff + ' dia(s)');
      var div = document.createElement('div');
      div.className = 'alert-item';
      div.innerHTML = '<span>🔔</span> <b>' + escHtml(r.description) + '</b> – ' + fmtMoney(r.amount) + ' – <em>' + msg + '</em>';
      box.appendChild(div);
    });
  }

  /* ---- Modais ---- */
  function openModal(tx) {
    document.getElementById('txId').value         = tx ? tx.id : '';
    document.getElementById('txDesc').value       = tx ? tx.description : '';
    document.getElementById('txAmount').value     = tx ? tx.amount : '';
    document.getElementById('txType').value       = tx ? tx.type : 'despesa';
    document.getElementById('txCategory').value  = tx ? tx.category : (DB.getCategories()[0] || {name:''}).name;
    document.getElementById('txDate').value       = tx ? tx.date : new Date().toISOString().split('T')[0];
    document.getElementById('modalTitle').textContent = tx ? 'Editar Movimentação' : 'Nova Movimentação';
    document.getElementById('btnSaveTx').textContent  = tx ? 'Salvar' : 'Adicionar';
    document.getElementById('modalBackdrop').classList.add('show');
  }
  function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }

  function openGoalModal(g) {
    document.getElementById('goalId').value      = g ? g.id : '';
    document.getElementById('goalName').value    = g ? g.name : '';
    document.getElementById('goalTarget').value  = g ? g.target : '';
    document.getElementById('goalCurrent').value = g ? g.current : '0';
    document.getElementById('goalIcon').value    = g ? g.icon : '🎯';
    document.getElementById('goalModalTitle').textContent = g ? 'Editar Meta' : 'Nova Meta';
    document.getElementById('goalModalBackdrop').classList.add('show');
  }
  function closeGoalModal() { document.getElementById('goalModalBackdrop').classList.remove('show'); }

  function openRecurModal(r) {
    document.getElementById('recurId').value       = r ? r.id : '';
    document.getElementById('recurDesc').value     = r ? r.description : '';
    document.getElementById('recurAmount').value   = r ? r.amount : '';
    document.getElementById('recurCategory').value = r ? r.category : '';
    document.getElementById('recurDay').value      = r ? r.day : '';
    document.getElementById('recurModalTitle').textContent = r ? 'Editar Recorrente' : 'Nova Despesa Recorrente';
    document.getElementById('recurModalBackdrop').classList.add('show');
  }
  function closeRecurModal() { document.getElementById('recurModalBackdrop').classList.remove('show'); }

  function openConfirm(title, msg, onOk) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent   = msg;
    document.getElementById('confirmBackdrop').classList.add('show');
    document.getElementById('confirmOk')._cb = onOk;
  }
  function closeConfirm() { document.getElementById('confirmBackdrop').classList.remove('show'); }

  function showPage(name) {
    document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-link').forEach(function (l) { l.classList.remove('active'); });
    var pg = document.getElementById('page-' + name);
    if (pg) pg.classList.add('active');
    var lk = document.querySelector('.nav-link[data-page="' + name + '"]');
    if (lk) lk.classList.add('active');
  }

  return {
    fmtMoney: fmtMoney, fmtDate: fmtDate, escHtml: escHtml, getCatIcon: getCatIcon,
    renderList: renderList, updateCards: updateCards,
    renderGoals: renderGoals, renderRecurring: renderRecurring,
    renderCategories: renderCategories, populateCategorySelects: populateCategorySelects,
    updateProfilePhoto: updateProfilePhoto, updateAlerts: updateAlerts,
    openModal: openModal, closeModal: closeModal,
    openGoalModal: openGoalModal, closeGoalModal: closeGoalModal,
    openRecurModal: openRecurModal, closeRecurModal: closeRecurModal,
    openConfirm: openConfirm, closeConfirm: closeConfirm,
    showPage: showPage
  };
})();