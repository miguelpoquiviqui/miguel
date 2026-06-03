/**
 * app.js – Lógica principal (v2)
 * Conecta db.js + ui.js + charts.js e gerencia todos os eventos.
 */

 (function () {
  var currentPage = 'dashboard';

  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    applyConfig();
    UI.populateCategorySelects();
    bindEvents();
    refreshDashboard();
  }

  /* ============================================================
     CONFIG
  ============================================================ */
  function applyConfig() {
    var cfg = DB.getConfig();
    if (cfg.name) {
      document.getElementById('settingsName').value = cfg.name;
      document.getElementById('sidebarName').textContent = cfg.name;
      document.getElementById('dashGreeting').textContent = 'Olá, ' + cfg.name + ' 👋';
    }
    if (cfg.photo) {
      UI.updateProfilePhoto(cfg.photo);
    }
    if (cfg.darkMode) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.getElementById('darkToggle').checked = true;
      document.getElementById('themeBtnMobile').textContent = '☀️';
    }
  }

  /* ============================================================
     EVENTOS
  ============================================================ */
  function bindEvents() {

    /* ---- Navegação ---- */
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-page]');
      if (el) { e.preventDefault(); navigateTo(el.getAttribute('data-page')); closeSidebar(); }
    });

    /* ---- Mobile ---- */
    document.getElementById('menuBtn').addEventListener('click', function () {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('overlay').classList.toggle('show');
    });
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    /* ---- Modais (abrir) ---- */
    document.getElementById('btnNewDash').addEventListener('click',       function () { UI.openModal(null); });
    document.getElementById('btnNewTx').addEventListener('click',         function () { UI.openModal(null); });
    document.getElementById('btnNewGoal').addEventListener('click',       function () { UI.openGoalModal(null); });
    document.getElementById('btnNewRecurring').addEventListener('click',  function () { UI.openRecurModal(null); });

    /* ---- Modais (fechar) ---- */
    document.getElementById('modalClose').addEventListener('click',       UI.closeModal);
    document.getElementById('goalModalClose').addEventListener('click',   UI.closeGoalModal);
    document.getElementById('recurModalClose').addEventListener('click',  UI.closeRecurModal);
    document.getElementById('confirmClose').addEventListener('click',     UI.closeConfirm);
    document.getElementById('confirmCancel').addEventListener('click',    UI.closeConfirm);

    ['modalBackdrop','goalModalBackdrop','recurModalBackdrop','confirmBackdrop'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('show');
      });
    });

    /* ---- Formulários ---- */
    document.getElementById('txForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var id   = document.getElementById('txId').value;
      var data = {
        description: document.getElementById('txDesc').value.trim(),
        amount:   document.getElementById('txAmount').value,
        type:     document.getElementById('txType').value,
        category: document.getElementById('txCategory').value,
        date:     document.getElementById('txDate').value
      };
      if (id) DB.update(id, data); else DB.create(data);
      UI.closeModal();
      refreshAll();
    });

    document.getElementById('goalForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var id   = document.getElementById('goalId').value;
      var data = {
        name:    document.getElementById('goalName').value.trim(),
        target:  document.getElementById('goalTarget').value,
        current: document.getElementById('goalCurrent').value,
        icon:    document.getElementById('goalIcon').value || '🎯'
      };
      if (id) DB.updateGoal(id, data); else DB.createGoal(data);
      UI.closeGoalModal();
      refreshGoals();
    });

    document.getElementById('recurForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var id   = document.getElementById('recurId').value;
      var data = {
        description: document.getElementById('recurDesc').value.trim(),
        amount:   document.getElementById('recurAmount').value,
        category: document.getElementById('recurCategory').value,
        day:      document.getElementById('recurDay').value
      };
      if (id) DB.updateRecurring(id, data); else DB.createRecurring(data);
      UI.closeRecurModal();
      refreshRecurring();
      refreshDashboard(); // alertas
    });

    /* ---- Delegação de cliques nas listas ---- */
    document.getElementById('txList').addEventListener('click', handleTxClick);
    document.getElementById('recentList').addEventListener('click', function (e) {
      // Sem ações na lista resumida do dashboard
    });
    document.getElementById('goalsList').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-id]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (btn.classList.contains('edit-goal')) {
        var g = DB.getGoals().filter(function (x) { return x.id === id; })[0];
        if (g) UI.openGoalModal(g);
      } else if (btn.classList.contains('delete-goal')) {
        UI.openConfirm('Excluir Meta', 'Deseja remover esta meta?', function () {
          DB.removeGoal(id); refreshGoals();
        });
      }
    });
    document.getElementById('recurringList').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-id]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      if (btn.classList.contains('edit-recur')) {
        var r = DB.getRecurring().filter(function (x) { return x.id === id; })[0];
        if (r) UI.openRecurModal(r);
      } else if (btn.classList.contains('delete-recur')) {
        UI.openConfirm('Excluir Recorrente', 'Remover esta despesa recorrente?', function () {
          DB.removeRecurring(id); refreshRecurring();
        });
      }
    });

    /* ---- Confirmação ---- */
    document.getElementById('confirmOk').addEventListener('click', function () {
      var cb = this._cb; UI.closeConfirm();
      if (typeof cb === 'function') cb();
    });

    /* ---- Filtros ---- */
    ['searchInput','filterDateFrom','filterDateTo','filterMonth','filterCategory','filterType'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', refreshTransactions);
    });

    /* ---- Relatório ---- */
    document.getElementById('reportMonth').addEventListener('change', refreshReports);
    document.getElementById('reportPeriod').addEventListener('change', refreshReports);

    /* ---- CSV ---- */
    document.getElementById('btnExportCSV').addEventListener('click', exportCSV);

    /* ---- PDF (simples via window.print) ---- */
    document.getElementById('btnExportPDF').addEventListener('click', function () {
      window.print();
    });

    /* ---- Configurações: nome ---- */
    document.getElementById('btnSaveName').addEventListener('click', function () {
      var name = document.getElementById('settingsName').value.trim();
      var cfg  = DB.getConfig(); cfg.name = name; DB.saveConfig(cfg);
      document.getElementById('sidebarName').textContent = name || 'Usuário';
      document.getElementById('dashGreeting').textContent = name ? 'Olá, ' + name + ' 👋' : 'Dashboard';
      alert('Nome salvo!');
    });

    /* ---- Foto de perfil ---- */
    document.getElementById('profilePicInput').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var data = ev.target.result;
        var cfg = DB.getConfig(); cfg.photo = data; DB.saveConfig(cfg);
        UI.updateProfilePhoto(data);
      };
      reader.readAsDataURL(file);
    });

    document.getElementById('btnRemovePhoto').addEventListener('click', function () {
      var cfg = DB.getConfig(); cfg.photo = ''; DB.saveConfig(cfg);
      UI.updateProfilePhoto('');
    });

    /* ---- Tema ---- */
    document.getElementById('darkToggle').addEventListener('change', function () { toggleTheme(this.checked); });
    document.getElementById('themeBtnMobile').addEventListener('click', function () {
      var dark = document.body.classList.contains('theme-dark');
      toggleTheme(!dark);
      document.getElementById('darkToggle').checked = !dark;
    });

    /* ---- Categorias ---- */
    document.getElementById('btnAddCat').addEventListener('click', function () {
      var icon = document.getElementById('newCatIcon').value.trim() || '📦';
      var name = document.getElementById('newCatName').value.trim();
      if (!name) { alert('Informe o nome da categoria.'); return; }
      DB.addCategory(icon, name);
      document.getElementById('newCatIcon').value = '';
      document.getElementById('newCatName').value = '';
      UI.renderCategories();
      UI.populateCategorySelects();
    });
    document.getElementById('catList').addEventListener('click', function (e) {
      var btn = e.target.closest('.cat-delete');
      if (btn) {
        var id = btn.getAttribute('data-id');
        DB.removeCategory(id);
        UI.renderCategories();
        UI.populateCategorySelects();
      }
    });

    /* ---- Backup ---- */
    document.getElementById('btnExportJSON').addEventListener('click', function () {
      var blob = new Blob([DB.exportJSON()], { type: 'application/json' });
      var url  = URL.createObjectURL(blob);
      var a    = document.createElement('a');
      a.href = url; a.download = 'fincontrol-backup.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    });

    document.getElementById('importFile').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        DB.importJSON(ev.target.result);
        alert('Backup importado com sucesso!');
        location.reload();
      };
      reader.readAsText(file);
    });

    /* ---- Limpar dados ---- */
    document.getElementById('btnClearAll').addEventListener('click', function () {
      UI.openConfirm('Limpar Todos os Dados',
        'Todas as transações serão apagadas. Esta ação não pode ser desfeita.',
        function () { DB.clear(); refreshAll(); }
      );
    });
  }

  /* ============================================================
     CLIQUES NA LISTA DE TRANSAÇÕES
  ============================================================ */
  function handleTxClick(e) {
    var btn = e.target.closest('.tx-btn');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    if (btn.classList.contains('edit')) {
      var tx = DB.getAll().filter(function (t) { return t.id === id; })[0];
      if (tx) UI.openModal(tx);
    } else if (btn.classList.contains('delete')) {
      UI.openConfirm('Excluir Transação',
        'Deseja excluir esta movimentação permanentemente?',
        function () { DB.remove(id); refreshAll(); }
      );
    }
  }

  /* ============================================================
     NAVEGAÇÃO
  ============================================================ */
  function navigateTo(page) {
    currentPage = page;
    UI.showPage(page);
    if (page === 'dashboard')    refreshDashboard();
    if (page === 'transactions') { UI.populateCategorySelects(); refreshTransactions(); }
    if (page === 'goals')        refreshGoals();
    if (page === 'recurring')    refreshRecurring();
    if (page === 'reports')      refreshReports();
    if (page === 'settings')     { UI.renderCategories(); }
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');
  }

  /* ============================================================
     REFRESH
  ============================================================ */
  function refreshAll() {
    if (currentPage === 'dashboard')    refreshDashboard();
    if (currentPage === 'transactions') refreshTransactions();
    if (currentPage === 'goals')        refreshGoals();
    if (currentPage === 'recurring')    refreshRecurring();
    if (currentPage === 'reports')      refreshReports();
  }

  function refreshDashboard() {
    var all = DB.getAll();
    UI.updateCards(all);
    UI.updateAlerts(DB.getRecurring());

    // Comparativo mês atual vs anterior
    var now = new Date();
    var curKey  = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
    var prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    var prevKey = prevDate.getFullYear() + '-' + ('0' + (prevDate.getMonth() + 1)).slice(-2);

    function monthExpense(key) {
      return all.filter(function (t) { return t.type === 'despesa' && t.date && t.date.substring(0, 7) === key; })
                .reduce(function (s, t) { return s + t.amount; }, 0);
    }
    var curExp  = monthExpense(curKey);
    var prevExp = monthExpense(prevKey);
    var diffEl  = document.getElementById('compareValue');
    var iconEl  = document.getElementById('compareIcon');
    if (prevExp > 0) {
      var pct = ((curExp - prevExp) / prevExp * 100).toFixed(0);
      diffEl.textContent = (pct > 0 ? '+' : '') + pct + '% despesas';
      diffEl.style.color = pct > 0 ? 'var(--expense)' : 'var(--income)';
      iconEl.textContent = pct > 0 ? '📉' : '📈';
    } else {
      diffEl.textContent = 'Sem dados anteriores';
    }

    // Top categoria
    var expenses = all.filter(function (t) { return t.type === 'despesa'; });
    var grouped  = {};
    expenses.forEach(function (t) { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
    var sorted = Object.keys(grouped).sort(function (a, b) { return grouped[b] - grouped[a]; });
    var topBar = document.getElementById('topCatBar');
    if (sorted.length) {
      topBar.style.display = 'block';
      topBar.innerHTML = '🏆 Categoria com mais gastos: <strong>' + UI.escHtml(sorted[0]) + '</strong>'
        + ' — <strong class="expense-value">' + UI.fmtMoney(grouped[sorted[0]]) + '</strong>';
    } else {
      topBar.style.display = 'none';
    }

    // Últimas 5
    var recent = all.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 5);
    UI.renderList('recentList', recent, false);

    // Gráficos
    var catData = getCategoryData(expenses);
    Charts.drawPie('dashPieChart', 'dashPieLegend', catData);

    var barData = getMonthlyData(all, 6);
    Charts.drawLine('dashBarChart', barData);
  }

  function refreshTransactions() {
    var all      = DB.getAll();
    var search   = document.getElementById('searchInput').value.toLowerCase();
    var dateFrom = document.getElementById('filterDateFrom').value;
    var dateTo   = document.getElementById('filterDateTo').value;
    var month    = document.getElementById('filterMonth').value;
    var category = document.getElementById('filterCategory').value;
    var type     = document.getElementById('filterType').value;

    var filtered = all.filter(function (t) {
      if (search   && t.description.toLowerCase().indexOf(search) === -1) return false;
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo   && t.date > dateTo)   return false;
      if (month    && (!t.date || t.date.substring(5, 7) !== month)) return false;
      if (category && t.category !== category) return false;
      if (type     && t.type !== type) return false;
      return true;
    });

    document.getElementById('txSubtitle').textContent = filtered.length + ' movimentações';
    UI.renderList('txList', filtered, true);
  }

  function refreshGoals() {
    UI.renderGoals(DB.getGoals());
  }

  function refreshRecurring() {
    UI.renderRecurring(DB.getRecurring());
  }

  function refreshReports() {
    var all    = DB.getAll();
    var month  = document.getElementById('reportMonth').value;
    var period = document.getElementById('reportPeriod').value;

    var filtered;
    if (period === 'weekly') {
      var now = new Date();
      var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      var weekKey = weekAgo.toISOString().split('T')[0];
      filtered = all.filter(function (t) { return t.date >= weekKey; });
    } else if (period === 'annual') {
      var year = new Date().getFullYear().toString();
      filtered = all.filter(function (t) { return t.date && t.date.substring(0, 4) === year; });
    } else {
      // mensal
      filtered = month
        ? all.filter(function (t) { return t.date && t.date.substring(5, 7) === month; })
        : all;
    }

    var income  = filtered.filter(function (t) { return t.type === 'receita'; }).reduce(function (s, t) { return s + t.amount; }, 0);
    var expense = filtered.filter(function (t) { return t.type === 'despesa'; }).reduce(function (s, t) { return s + t.amount; }, 0);

    document.getElementById('rptIncome').textContent  = UI.fmtMoney(income);
    document.getElementById('rptExpense').textContent = UI.fmtMoney(expense);
    var bal = income - expense;
    var balEl = document.getElementById('rptBalance');
    balEl.textContent = UI.fmtMoney(Math.abs(bal));
    balEl.className   = 'card-value ' + (bal >= 0 ? 'income-value' : 'expense-value');

    // Gráficos
    Charts.drawPie('rptPieChart', 'rptPieLegend', getCategoryData(filtered.filter(function (t) { return t.type === 'despesa'; })));
    Charts.drawBar('rptBarChart', getMonthlyData(all, 6));

    // Tabela detalhe
    var catData = getCategoryData(filtered.filter(function (t) { return t.type === 'despesa'; }));
    var maxVal  = catData.length ? catData[0].value : 1;
    var html = catData.map(function (d) {
      var pct = Math.round(d.value / maxVal * 100);
      return '<div class="rpt-cat-row">'
        + '<span class="rpt-cat-name">' + UI.getCatIcon(d.name) + ' ' + UI.escHtml(d.name) + '</span>'
        + '<div class="rpt-cat-bar-wrap"><div class="rpt-cat-bar" style="width:' + pct + '%"></div></div>'
        + '<span class="rpt-cat-val expense-value">' + UI.fmtMoney(d.value) + '</span>'
        + '</div>';
    }).join('');
    document.getElementById('rptCatTable').innerHTML = html || '<div class="empty-state">Sem despesas no período</div>';
  }

  /* ============================================================
     HELPERS
  ============================================================ */
  function getCategoryData(transactions) {
    var grouped = {};
    transactions.forEach(function (t) { grouped[t.category] = (grouped[t.category] || 0) + t.amount; });
    return Object.keys(grouped).map(function (k) { return { name: k, value: grouped[k] }; })
                               .sort(function (a, b) { return b.value - a.value; });
  }

  function getMonthlyData(all, months) {
    var LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    var now = new Date(), result = [];
    for (var i = months - 1; i >= 0; i--) {
      var d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
      var mTx = all.filter(function (t) { return t.date && t.date.substring(0, 7) === key; });
      result.push({
        label:   LABELS[d.getMonth()],
        income:  mTx.filter(function (t) { return t.type === 'receita'; }).reduce(function (s, t) { return s + t.amount; }, 0),
        expense: mTx.filter(function (t) { return t.type === 'despesa'; }).reduce(function (s, t) { return s + t.amount; }, 0)
      });
    }
    return result;
  }

  function exportCSV() {
    var all      = DB.getAll();
    var search   = document.getElementById('searchInput').value.toLowerCase();
    var month    = document.getElementById('filterMonth').value;
    var category = document.getElementById('filterCategory').value;
    var type     = document.getElementById('filterType').value;
    var data     = all.filter(function (t) {
      if (search   && t.description.toLowerCase().indexOf(search) === -1) return false;
      if (month    && (!t.date || t.date.substring(5, 7) !== month)) return false;
      if (category && t.category !== category) return false;
      if (type     && t.type !== type) return false;
      return true;
    });
    var csv = 'Descri\u00e7\u00e3o,Valor,Categoria,Tipo,Data\n';
    data.forEach(function (t) {
      csv += '"' + t.description + '",' + t.amount + ',"' + t.category + '","' + t.type + '","' + t.date + '"\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = 'transacoes.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function toggleTheme(dark) {
    document.body.classList.toggle('theme-dark',  dark);
    document.body.classList.toggle('theme-light', !dark);
    document.getElementById('themeBtnMobile').textContent = dark ? '☀️' : '🌙';
    var cfg = DB.getConfig(); cfg.darkMode = dark; DB.saveConfig(cfg);
    setTimeout(refreshAll, 60);
  }

  /* Start */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();