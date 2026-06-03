/**
 * db.js – Camada de dados (LocalStorage)
 * Gerencia transações, configurações, metas, recorrentes e categorias.
 */

 var DB = (function () {
  var TX_KEY    = 'fincontrol_transactions';
  var CFG_KEY   = 'fincontrol_config';
  var GOAL_KEY  = 'fincontrol_goals';
  var RECUR_KEY = 'fincontrol_recurring';
  var CAT_KEY   = 'fincontrol_categories';

  /* ---- CATEGORIAS ---- */
  var DEFAULT_CATS = [
    { id: 'c1', icon: '🍽️', name: 'Alimentação' },
    { id: 'c2', icon: '🚗', name: 'Transporte' },
    { id: 'c3', icon: '🏠', name: 'Moradia' },
    { id: 'c4', icon: '💊', name: 'Saúde' },
    { id: 'c5', icon: '📚', name: 'Educação' },
    { id: 'c6', icon: '🎮', name: 'Lazer' },
    { id: 'c7', icon: '🛒', name: 'Compras' },
    { id: 'c8', icon: '💰', name: 'Salário' },
    { id: 'c9', icon: '📦', name: 'Outros' }
  ];

  function getCategories() {
    var raw = localStorage.getItem(CAT_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_CATS.slice();
  }

  function saveCategories(list) { localStorage.setItem(CAT_KEY, JSON.stringify(list)); }

  function addCategory(icon, name) {
    var list = getCategories();
    list.push({ id: 'c' + Date.now(), icon: icon || '📦', name: name });
    saveCategories(list);
  }

  function removeCategory(id) {
    saveCategories(getCategories().filter(function (c) { return c.id !== id; }));
  }

  /* ---- TRANSAÇÕES ---- */
  function getAll() {
    var raw = localStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  function saveAll(list) { localStorage.setItem(TX_KEY, JSON.stringify(list)); }

  function create(data) {
    var list = getAll();
    var record = { id: Date.now().toString(), description: data.description,
      amount: parseFloat(data.amount), category: data.category,
      type: data.type, date: data.date };
    list.push(record);
    saveAll(list);
    return record;
  }

  function update(id, data) {
    var list = getAll();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].description = data.description;
        list[i].amount      = parseFloat(data.amount);
        list[i].category    = data.category;
        list[i].type        = data.type;
        list[i].date        = data.date;
        break;
      }
    }
    saveAll(list);
  }

  function remove(id) { saveAll(getAll().filter(function (t) { return t.id !== id; })); }
  function clear() { localStorage.removeItem(TX_KEY); }

  /* ---- CONFIGURAÇÕES ---- */
  function getConfig() {
    var raw = localStorage.getItem(CFG_KEY);
    return raw ? JSON.parse(raw) : { name: '', darkMode: false, photo: '' };
  }
  function saveConfig(cfg) { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); }

  /* ---- METAS ---- */
  function getGoals() {
    var raw = localStorage.getItem(GOAL_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  function saveGoals(list) { localStorage.setItem(GOAL_KEY, JSON.stringify(list)); }

  function createGoal(data) {
    var list = getGoals();
    var g = { id: 'g' + Date.now(), name: data.name, icon: data.icon || '🎯',
              target: parseFloat(data.target), current: parseFloat(data.current) || 0 };
    list.push(g);
    saveGoals(list);
    return g;
  }

  function updateGoal(id, data) {
    var list = getGoals();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].name    = data.name;
        list[i].icon    = data.icon || '🎯';
        list[i].target  = parseFloat(data.target);
        list[i].current = parseFloat(data.current) || 0;
        break;
      }
    }
    saveGoals(list);
  }

  function removeGoal(id) { saveGoals(getGoals().filter(function (g) { return g.id !== id; })); }

  /* ---- DESPESAS RECORRENTES ---- */
  function getRecurring() {
    var raw = localStorage.getItem(RECUR_KEY);
    return raw ? JSON.parse(raw) : [];
  }
  function saveRecurring(list) { localStorage.setItem(RECUR_KEY, JSON.stringify(list)); }

  function createRecurring(data) {
    var list = getRecurring();
    var r = { id: 'r' + Date.now(), description: data.description,
              amount: parseFloat(data.amount), category: data.category,
              day: parseInt(data.day) };
    list.push(r);
    saveRecurring(list);
    return r;
  }

  function updateRecurring(id, data) {
    var list = getRecurring();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].description = data.description;
        list[i].amount      = parseFloat(data.amount);
        list[i].category    = data.category;
        list[i].day         = parseInt(data.day);
        break;
      }
    }
    saveRecurring(list);
  }

  function removeRecurring(id) { saveRecurring(getRecurring().filter(function (r) { return r.id !== id; })); }

  /* ---- BACKUP ---- */
  function exportJSON() {
    return JSON.stringify({
      transactions: getAll(), config: getConfig(),
      goals: getGoals(), recurring: getRecurring(), categories: getCategories()
    }, null, 2);
  }

  function importJSON(raw) {
    var data = JSON.parse(raw);
    if (data.transactions) saveAll(data.transactions);
    if (data.config)       saveConfig(data.config);
    if (data.goals)        saveGoals(data.goals);
    if (data.recurring)    saveRecurring(data.recurring);
    if (data.categories)   saveCategories(data.categories);
  }

  return {
    getAll: getAll, create: create, update: update, remove: remove, clear: clear,
    getConfig: getConfig, saveConfig: saveConfig,
    getGoals: getGoals, createGoal: createGoal, updateGoal: updateGoal, removeGoal: removeGoal,
    getRecurring: getRecurring, createRecurring: createRecurring, updateRecurring: updateRecurring, removeRecurring: removeRecurring,
    getCategories: getCategories, addCategory: addCategory, removeCategory: removeCategory,
    exportJSON: exportJSON, importJSON: importJSON
  };
})();