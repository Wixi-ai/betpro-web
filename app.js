// ===== СОСТОЯНИЕ =====
let state = {
  balance: 0,
  goal: 20000,
  wins: 0,
  losses: 0,
  bets: [],
  timePlayed: 0
};

let selectedOutcome = true;

// ===== ЗАГРУЗКА / СОХРАНЕНИЕ =====
function loadState() {
  const saved = localStorage.getItem('betpro_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
      state.bets = state.bets.map(b => ({ ...b, date: new Date(b.date) }));
    } catch (e) { console.warn('Ошибка загрузки', e); }
  }
}

function saveState() {
  localStorage.setItem('betpro_state', JSON.stringify(state));
}

// ===== БУКМЕКЕРЫ =====
const bookmakers = [
  {
    id: 'pari',
    shortName: 'PR',
    fullName: 'Pari',
    description: 'Букмекерская компания с биржевым модулем и отложенными ставками.',
    advantages: '• Биржевой модуль для обмена ставками\n• Отложенные ставки\n• Ранний выкуп позиции',
    bonus: 'Фрибет 3 000 ₽ за регистрацию',
    link: ''
  },
  {
    id: 'fonbet',
    shortName: 'FB',
    fullName: 'Фонбет',
    description: 'Первый букмекер России, лидер по количеству спортивных событий.',
    advantages: '• Фрибет до 15 000 ₽\n• Бесплатные трансляции\n• Центр статистики',
    bonus: 'Бесплатные трансляции матчей',
    link: ''
  },
  {
    id: 'betcity',
    shortName: 'BC',
    fullName: 'Betcity',
    description: 'Один из крупнейших букмекеров, основанный в 2003 году.',
    advantages: '• Минимальная маржа 2.3-3.5%\n• Кэшбэк до 25%\n• Три фрибета по 500 ₽',
    bonus: 'Кэшбэк до 25% за месяц',
    link: 'https://betsxwin.pro/click?o=6&a=52219&tsource=1046&link_id=518'
  }
  {
    id: 'winline',
    shortName: 'Wl',
    fullName: 'Betcity',
    description: 'Российская букмекерская компания. Основана в 2009 году.',
    advantages: '• Минимальная маржа 2.3-3.5%\n• Кэшбэк до 25%\n• Три фрибета по 500 ₽',
    bonus: 'Кэшбэк до 25% за месяц',
    link: 'https://betsxwin.pro/click?o=159&a=52219&tsource=1046&link_id=4717'
  }
];

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
  // Главная
  document.getElementById('balance').textContent = state.balance + ' ₽';
  document.getElementById('wl').textContent = `${state.wins}W / ${state.losses}L`;
  document.getElementById('totalBets').textContent = state.bets.length;
  document.getElementById('timePlayed').textContent = state.timePlayed + ' мин';

  // Цель
  const progress = Math.min((state.balance / state.goal) * 100, 100);
  document.getElementById('goalProgress').style.width = progress + '%';
  document.getElementById('goalText').textContent = `${state.balance} / ${state.goal} ₽`;

  // История
  renderHistory();
  renderFullHistory();

  // Аналитика
  updateAnalytics();

  // Настройки
  document.getElementById('settingsBalance').textContent = state.balance + ' ₽';
  document.getElementById('settingsGoal').textContent = state.goal + ' ₽';

  // Букмекеры
  renderBookmakers();
}

// ===== ИСТОРИЯ (главная) — С БУКМЕКЕРОМ И КОЭФФИЦИЕНТОМ =====
function renderHistory() {
  const container = document.getElementById('historyList');
  if (state.bets.length === 0) {
    container.innerHTML = `
            <div class="history-empty">
                <div class="history-empty__icon">🏆</div>
                <div class="history-empty__text">ставок пока нет</div>
            </div>
        `;
    return;
  }
  const recent = state.bets.slice(-5).reverse();
  container.innerHTML = recent.map(bet => {
    const profit = bet.isWin ? (bet.amount * bet.odds - bet.amount) : -bet.amount;
    const sign = profit >= 0 ? '+' : '';
    const color = bet.isWin ? '#4CAF50' : '#E53935';
    const dateStr = bet.date ? new Date(bet.date).toLocaleDateString('ru-RU') : '—';
    return `
            <div class="history-item">
                <div class="history-item__info" style="flex:1;">
                    <div class="history-item__amount">${bet.amount} ₽</div>
                    <div class="history-item__date">${bet.bookmaker} • Кф ${bet.odds.toFixed(2)} • ${dateStr}</div>
                </div>
                <div class="history-item__result" style="color:${color}">${sign}${profit.toFixed(0)} ₽</div>
            </div>
        `;
  }).join('');
}

// ===== ИСТОРИЯ (полная) — С БУКМЕКЕРОМ И КОЭФФИЦИЕНТОМ =====
function renderFullHistory() {
  const container = document.getElementById('historyFullList');
  if (state.bets.length === 0) {
    container.innerHTML = `
            <div class="history-empty">
                <div class="history-empty__icon">🏆</div>
                <div class="history-empty__text">ставок пока нет</div>
            </div>
        `;
    return;
  }
  const all = [...state.bets].reverse();
  container.innerHTML = all.map(bet => {
    const profit = bet.isWin ? (bet.amount * bet.odds - bet.amount) : -bet.amount;
    const sign = profit >= 0 ? '+' : '';
    const color = bet.isWin ? '#4CAF50' : '#E53935';
    const dateStr = bet.date ? new Date(bet.date).toLocaleDateString('ru-RU') : '—';
    return `
            <div class="history-item">
                <div class="history-item__info" style="flex:1;">
                    <div class="history-item__amount">${bet.amount} ₽</div>
                    <div class="history-item__date">${bet.bookmaker} • Кф ${bet.odds.toFixed(2)} • ${dateStr}</div>
                </div>
                <div class="history-item__result" style="color:${color}">${sign}${profit.toFixed(0)} ₽</div>
            </div>
        `;
  }).join('');
}

// ===== АНАЛИТИКА =====
function updateAnalytics() {
  const total = state.bets.length;
  const wins = state.wins;
  const losses = state.losses;
  const winrate = total > 0 ? (wins / total) * 100 : 0;
  const profit = state.bets.reduce((sum, bet) => {
    return sum + (bet.isWin ? bet.amount * bet.odds - bet.amount : -bet.amount);
  }, 0);

  document.getElementById('analyticsTotal').textContent = total;
  document.getElementById('analyticsWins').textContent = wins;
  document.getElementById('analyticsLosses').textContent = losses;
  document.getElementById('analyticsWinrate').textContent = winrate.toFixed(1) + '%';
  document.getElementById('winrateProgress').style.width = winrate + '%';
  document.getElementById('analyticsProfit').textContent = (profit >= 0 ? '+' : '') + profit.toFixed(0) + ' ₽';

  // Лучшая ставка
  let best = null;
  let bestProfit = -Infinity;
  state.bets.forEach(bet => {
    const p = bet.isWin ? bet.amount * bet.odds - bet.amount : 0;
    if (p > bestProfit) {
      bestProfit = p;
      best = bet;
    }
  });
  document.getElementById('analyticsBest').textContent = best && bestProfit > 0
    ? `+${bestProfit.toFixed(0)} ₽ (${best.bookmaker})`
    : 'Пока нет ставок';
}

// ===== БУКМЕКЕРЫ =====
function renderBookmakers() {
  const container = document.getElementById('bookmakersList');
  container.innerHTML = bookmakers.map(bk => `
        <div class="bookmaker-card">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div class="bookmaker-icon">${bk.shortName}</div>
                <div style="font-size: 18px; font-weight: 700; color: #F5F5F5;">${bk.fullName}</div>
            </div>
            <div style="font-size: 13px; color: #aaa; margin-bottom: 8px;">${bk.description}</div>
            <div style="background: #2A2A2A; padding: 8px 12px; border-radius: 8px; font-size: 13px; color: #E53935; font-weight: 700; margin-bottom: 12px;">
                🎁 ${bk.bonus}
            </div>
            <div style="font-size: 12px; color: #888; white-space: pre-line; margin-bottom: 12px;">${bk.advantages}</div>
            <button class="bookmaker-btn" onclick="window.open('${bk.link}', '_blank')">Перейти</button>
        </div>
    `).join('');
}

// ===== ДОБАВЛЕНИЕ СТАВКИ =====
function addBet(amount, odds, bookmaker, isWin) {
  const bet = { amount, odds, isWin, bookmaker, date: new Date() };
  state.bets.push(bet);
  if (isWin) {
    state.wins++;
    state.balance += amount * odds - amount;
  } else {
    state.losses++;
    state.balance -= amount;
  }
  state.timePlayed += Math.floor(Math.random() * 10) + 5;
  saveState();
  updateUI();
}

// ===== ОЧИСТКА ДАННЫХ =====
function clearAllData() {
  if (confirm('Вы уверены? Все ставки и история будут удалены.')) {
    state.bets = [];
    state.balance = 0;
    state.wins = 0;
    state.losses = 0;
    state.timePlayed = 0;
    saveState();
    updateUI();
  }
}

// ===== МОДАЛЬНОЕ ОКНО ДЛЯ СТАВКИ =====
const betModal = document.getElementById('betModal');
document.getElementById('addBetBtn').addEventListener('click', () => betModal.style.display = 'flex');
document.getElementById('modalCancel').addEventListener('click', () => betModal.style.display = 'none');
betModal.addEventListener('click', (e) => { if (e.target === betModal) betModal.style.display = 'none'; });

document.getElementById('modalWin').addEventListener('click', function () {
  selectedOutcome = true;
  this.classList.add('active');
  document.getElementById('modalLose').classList.remove('active');
});
document.getElementById('modalLose').addEventListener('click', function () {
  selectedOutcome = false;
  this.classList.add('active');
  document.getElementById('modalWin').classList.remove('active');
});

document.getElementById('modalSave').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('modalAmount').value);
  const odds = parseFloat(document.getElementById('modalOdds').value);
  const bookmaker = document.getElementById('modalBookmaker').value;
  if (!amount || amount <= 0) { alert('Введите корректную сумму'); return; }
  if (!odds || odds <= 1) { alert('Введите корректный коэффициент'); return; }
  addBet(amount, odds, bookmaker, selectedOutcome);
  betModal.style.display = 'none';
  document.getElementById('modalAmount').value = '';
  document.getElementById('modalOdds').value = '';
});

// ===== МОДАЛЬНОЕ ОКНО ДЛЯ ЦЕЛИ =====
const goalModal = document.getElementById('goalModal');
document.getElementById('setGoalBtn').addEventListener('click', () => {
  document.getElementById('goalInput').value = state.goal;
  goalModal.style.display = 'flex';
});
document.getElementById('goalCancel').addEventListener('click', () => goalModal.style.display = 'none');
goalModal.addEventListener('click', (e) => { if (e.target === goalModal) goalModal.style.display = 'none'; });

document.getElementById('goalSave').addEventListener('click', () => {
  const val = parseFloat(document.getElementById('goalInput').value);
  if (val && val > 0) {
    state.goal = val;
    saveState();
    updateUI();
    goalModal.style.display = 'none';
  } else {
    alert('Введите корректную сумму');
  }
});

// ===== НАСТРОЙКИ =====
document.getElementById('depositBtn').addEventListener('click', () => {
  const amount = prompt('Введите сумму для пополнения:');
  if (amount) {
    const val = parseFloat(amount);
    if (val > 0) { state.balance += val; saveState(); updateUI(); }
  }
});
document.getElementById('withdrawBtn').addEventListener('click', () => {
  const amount = prompt('Введите сумму для вывода:');
  if (amount) {
    const val = parseFloat(amount);
    if (val > 0 && val <= state.balance) { state.balance -= val; saveState(); updateUI(); }
    else if (val > state.balance) { alert('Недостаточно средств'); }
  }
});
document.getElementById('clearDataBtn').addEventListener('click', clearAllData);

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    this.classList.add('active');
    const pageId = this.dataset.page;
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    updateUI();
  });
});

// ===== ПРОСМОТР ВСЕЙ ИСТОРИИ =====
document.getElementById('viewAll').addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-page="page-history"]').classList.add('active');
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-history').classList.add('active');
  renderFullHistory();
});

// ===== ИНИЦИАЛИЗАЦИЯ =====
loadState();
updateUI();
