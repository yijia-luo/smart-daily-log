const STORAGE_KEYS = {
  tasks: 'calendar_tasks',
  types: 'calendar_types',
  daily: 'calendar_daily_summaries',
  monthly: 'calendar_monthly_summaries',
  monthlyPlans: 'calendar_monthly_plans',
  reminders: 'calendar_reminder_times',
  reminded: 'calendar_reminded_status'
};

const COLORS = [
  '#4f8cff', '#42d392', '#ffb84c', '#9b6bff', '#39c0c3', '#ffe16a', '#ff8cc7', '#5f4ffe', '#1fa574', '#d8a500'
];

const ENCOURAGEMENTS = [
  '太棒了！再接再厉！',
  '完成了一件重要的事，继续保持！',
  '你正在变得更高效，继续前进！',
  '这一步完成得很棒，冲刺下一个目标！',
  '你今天的表现非常出色！',
  '优秀！你的努力正在积累成果。',
  '干得漂亮！继续保持高能状态！',
  '又一项完成了，继续创造好节奏！',
  '这就是进步的感觉！继续前进！',
  '非常棒，继续把每一个任务完成掉！'
];

const state = {
  currentDate: new Date().toISOString().slice(0, 10),
  currentMonth: '',
  selectedTaskId: null,
  tasks: [],
  types: [],
  dailySummaries: {},
  monthlySummaries: {},
  monthlyPlans: {},
  reminders: {},
  remindedStatus: {},
  monthlyPlanEditing: false
};

const elements = {
  tabs: document.querySelectorAll('.tab-button'),
  panels: document.querySelectorAll('.panel'),
  totalTasks: document.getElementById('total-tasks'),
  completedTasks: document.getElementById('completed-tasks'),
  summaryCount: document.getElementById('summary-count'),
  yearSelect: document.getElementById('year-select'),
  monthSelect: document.getElementById('month-select'),
  calendarGrid: document.getElementById('calendar-grid'),
  selectedDateLabel: document.getElementById('selected-date-label'),
  calendarSummary: document.getElementById('calendar-summary'),
  reminderTime: document.getElementById('reminder-time'),
  saveReminder: document.getElementById('save-reminder'),
  reminderBanner: document.getElementById('reminder-banner'),
  exportBackupButton: document.getElementById('export-backup'),
  importBackupButton: document.getElementById('import-backup'),
  backupFileInput: document.getElementById('backup-file-input'),
  dismissReminder: document.getElementById('dismiss-reminder'),
  todayButton: document.getElementById('today-button'),
  taskTitle: document.getElementById('task-title'),
  taskDate: document.getElementById('task-date'),
  taskTime: document.getElementById('task-time'),
  taskType: document.getElementById('task-type'),
  saveTask: document.getElementById('save-task'),
  cancelEdit: document.getElementById('cancel-edit'),
  statusFilter: document.getElementById('status-filter'),
  typeFilter: document.getElementById('type-filter'),
  sortOrder: document.getElementById('sort-order'),
  taskList: document.getElementById('task-list'),
  summaryMonth: document.getElementById('summary-month'),
  monthlySummary: document.getElementById('monthly-summary'),
  saveMonthSummary: document.getElementById('save-month-summary'),
  dailySummaryList: document.getElementById('daily-summary-list'),
  typeName: document.getElementById('type-name'),
  typeColor: document.getElementById('type-color'),
  typeColorPreview: document.getElementById('type-color-preview'),
  typeColorPalette: document.getElementById('type-color-palette'),
  saveType: document.getElementById('save-type'),
  monthlyPlan: document.getElementById('monthly-plan'),
  saveMonthPlan: document.getElementById('save-month-plan'),
  typeList: document.getElementById('type-list'),
  fireworks: document.getElementById('fireworks')
};

function loadState() {
  state.tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');
  state.types = JSON.parse(localStorage.getItem(STORAGE_KEYS.types) || '[]');
  state.dailySummaries = JSON.parse(localStorage.getItem(STORAGE_KEYS.daily) || '{}');
  state.monthlySummaries = JSON.parse(localStorage.getItem(STORAGE_KEYS.monthly) || '{}');
  state.monthlyPlans = JSON.parse(localStorage.getItem(STORAGE_KEYS.monthlyPlans) || '{}');
  state.reminders = JSON.parse(localStorage.getItem(STORAGE_KEYS.reminders) || '{}');
  state.remindedStatus = JSON.parse(localStorage.getItem(STORAGE_KEYS.reminded) || '{}');
  if (!state.types.length) {
    const defaultTypes = [
      { id: 'default', name: '默认', color: '#4f8cff' }
    ];
    state.types = defaultTypes;
  }
  const today = new Date().toISOString().slice(0, 10);
  state.currentDate = state.currentDate || today;
  state.currentMonth = state.currentDate.slice(0, 7);
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
  localStorage.setItem(STORAGE_KEYS.types, JSON.stringify(state.types));
  localStorage.setItem(STORAGE_KEYS.daily, JSON.stringify(state.dailySummaries));
  localStorage.setItem(STORAGE_KEYS.monthly, JSON.stringify(state.monthlySummaries));
  localStorage.setItem(STORAGE_KEYS.monthlyPlans, JSON.stringify(state.monthlyPlans));
  localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(state.reminders));
  localStorage.setItem(STORAGE_KEYS.reminded, JSON.stringify(state.remindedStatus));
  refreshStats();
}

function getBackupData() {
  return {
    tasks: state.tasks,
    types: state.types,
    dailySummaries: state.dailySummaries,
    monthlySummaries: state.monthlySummaries,
    monthlyPlans: state.monthlyPlans,
    reminders: state.reminders,
    remindedStatus: state.remindedStatus,
    backedUpAt: new Date().toISOString()
  };
}

function exportBackup(filename) {
  const safeName = filename || `daily-log-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  const blob = new Blob([JSON.stringify(getBackupData(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('已导出备份文件，可用于恢复。');
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.tasks)) {
        throw new Error('备份文件格式不正确。');
      }
      state.tasks = data.tasks || [];
      state.types = data.types || state.types;
      state.dailySummaries = data.dailySummaries || {};
      state.monthlySummaries = data.monthlySummaries || {};
      state.monthlyPlans = data.monthlyPlans || {};
      state.reminders = data.reminders || {};
      state.remindedStatus = data.remindedStatus || {};
      saveState();
      renderAll();
      showToast('备份已导入，数据已恢复。');
    } catch (err) {
      showToast('导入失败：无效备份文件。');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function scheduleDailyAutoBackup() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(23, 59, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();
  setTimeout(() => {
    exportBackup(`daily-log-backup-${new Date().toISOString().slice(0, 10)}.json`);
    scheduleDailyAutoBackup();
  }, delay);
}

function refreshStats() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const summaryCount = Object.keys(state.dailySummaries).length;
  elements.totalTasks.textContent = `任务：${total}`;
  elements.completedTasks.textContent = `完成：${completed}`;
  elements.summaryCount.textContent = `总结：${summaryCount}`;
}

function buildDateOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  for (let year = currentYear - 3; year <= currentYear + 4; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = `${year}年`;
    elements.yearSelect.appendChild(option);
  }
  for (let month = 1; month <= 12; month++) {
    const option = document.createElement('option');
    option.value = month.toString().padStart(2, '0');
    option.textContent = `${month}月`;
    elements.monthSelect.appendChild(option);
  }
}

function buildTypeColorOptions() {
  if (elements.typeColor) elements.typeColor.innerHTML = '';
  if (elements.typeColorPalette) elements.typeColorPalette.innerHTML = '';
  COLORS.forEach(color => {
    const option = document.createElement('option');
    option.value = color;
    option.textContent = color;
    elements.typeColor.appendChild(option);

    if (elements.typeColorPalette) {
      const sw = document.createElement('div');
      sw.className = 'swatch';
      sw.style.background = color;
      sw.dataset.color = color;
      sw.title = color;
      sw.addEventListener('click', () => {
        if (elements.typeColor) elements.typeColor.value = color;
        updateTypeColorPreview(color);
        selectSwatch(color);
      });
      elements.typeColorPalette.appendChild(sw);
    }
  });
  const initColor = elements.typeColor?.value || COLORS[0];
  updateTypeColorPreview(initColor);
  selectSwatch(initColor);
}

function buildMonthOptions() {
  const start = new Date();
  const year = start.getFullYear();
  for (let offset = -6; offset <= 6; offset++) {
    const date = new Date(year, start.getMonth() + offset, 1);
    const monthKey = date.toISOString().slice(0, 7);
    const option = document.createElement('option');
    option.value = monthKey;
    option.textContent = `${date.getFullYear()}年 ${date.getMonth() + 1}月`;
    if (monthKey === state.currentMonth) option.selected = true;
    elements.summaryMonth.appendChild(option);
  }
}

function renderTabPanels() {
  elements.tabs.forEach(button => {
    button.addEventListener('click', () => {
      elements.tabs.forEach(tab => tab.classList.remove('active'));
      elements.panels.forEach(panel => panel.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.panel).classList.add('active');
    });
  });
}

function renderCalendar() {
  const year = parseInt(elements.yearSelect.value, 10);
  const month = parseInt(elements.monthSelect.value, 10) - 1;
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  elements.calendarGrid.innerHTML = '';
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  weekdays.forEach(weekday => {
    const label = document.createElement('div');
    label.className = 'weekday';
    label.textContent = weekday;
    elements.calendarGrid.appendChild(label);
  });
  const leading = firstWeekday;
  const totalCells = Math.ceil((leading + totalDays) / 7) * 7;
  for (let idx = 0; idx < totalCells; idx++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    const dayNumber = idx - leading + 1;
    let dateStr;
    if (idx < leading) {
      cell.classList.add('outside');
      const dayLabel = prevMonthDays - leading + idx + 1;
      cell.innerHTML = `<div class="day-number">${dayLabel}</div>`;
    } else if (dayNumber > totalDays) {
      cell.classList.add('outside');
      const dayLabel = dayNumber - totalDays;
      cell.innerHTML = `<div class="day-number">${dayLabel}</div>`;
    } else {
      dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNumber.toString().padStart(2, '0')}`;
      const tasksForDate = state.tasks.filter(t => t.date === dateStr);
      const totalCount = tasksForDate.length;
      const pendingCount = tasksForDate.filter(t => !t.completed).length;
      const badges = `${totalCount ? `<div class="task-count-total">${totalCount}</div>` : ''}${pendingCount ? `<div class="task-count-pending">${pendingCount}</div>` : ''}`;
      cell.innerHTML = `<div class="day-number">${dayNumber}</div>${badges}`;
      if (dateStr === state.currentDate) {
        cell.classList.add('active');
      }
      cell.addEventListener('click', () => {
        state.currentDate = dateStr;
        state.currentMonth = dateStr.slice(0, 7);
        elements.taskDate.value = dateStr;
        elements.yearSelect.value = year;
        elements.monthSelect.value = (month + 1).toString().padStart(2, '0');
        renderCalendar();
        renderCalendarSummary();
        renderTodoList();
      });
    }
    elements.calendarGrid.appendChild(cell);
  }
}

function renderCalendarSummary() {
  const selected = state.currentDate;
  const tasks = state.tasks.filter(t => t.date === selected);
  const summaryText = state.dailySummaries[selected] || '';
  const reminderValue = state.reminders[selected] || '';
  if (elements.monthlyPlan) {
    const planText = state.monthlyPlans[state.currentMonth] || '';
    elements.monthlyPlan.value = planText;
    const editable = !planText || state.monthlyPlanEditing;
    setMonthlyPlanMode(editable);
  }
  elements.selectedDateLabel.textContent = selected;
  elements.calendarSummary.innerHTML = `
    <div class="section-title">${selected} 任务</div>
    <div class="task-meta">
      <p class="help-text">当天共有 ${tasks.length} 条任务。</p>
      ${tasks.length ? tasks.map(t => {
        const type = state.types.find(type => type.id === t.typeId) || { name: '默认', color: '#4f8cff' };
        return `<div class="task-item ${t.completed ? 'completed' : ''}">
          <label class="checkbox-wrap">
            <input type="checkbox" ${t.completed ? 'checked' : ''} data-task-id="${t.id}" class="summary-complete-toggle" />
            <span>${t.title}</span>
          </label>
          <div class="task-meta">
            <div class="task-info">
              <span>${t.time || '未设置时间'}</span>
              <span class="pill"><span class="pill-dot" style="background:${type.color}"></span>${type.name}</span>
              <span>${t.completed ? '已完成' : '待完成'}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="icon-button" data-edit-summary-id="${t.id}" title="编辑">✎</button>
            <button class="icon-button danger" data-delete-summary-id="${t.id}" title="删除">🗑</button>
          </div>
        </div>`;
      }).join('') : '<p class="help-text">暂无今日任务。</p>'}
      <div style="margin-top:18px;">
        <label class="label">当天总结</label>
        <textarea id="daily-summary" placeholder="记录今日完成情况、灵感或反思...">${summaryText}</textarea>
        <button class="button-primary" id="save-daily-summary">保存总结</button>
      </div>
    </div>`;
  document.getElementById('daily-summary').addEventListener('input', e => {
    // no-op for now
  });
  document.getElementById('save-daily-summary').addEventListener('click', () => {
    const content = document.getElementById('daily-summary').value.trim();
    if (content) {
      state.dailySummaries[selected] = content;
    } else {
      delete state.dailySummaries[selected];
    }
    saveState();
    showToast('保存成功，今日总结已记录。');
    renderCalendarSummary();
  });
  elements.calendarSummary.querySelectorAll('.summary-complete-toggle').forEach(box => {
    box.addEventListener('change', e => {
      const id = e.target.dataset.taskId;
      toggleTaskCompletion(id, e.target.checked);
      renderCalendarSummary();
      renderCalendar();
      renderTodoList();
    });
  });
  elements.calendarSummary.querySelectorAll('[data-edit-summary-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      startEditTask(btn.dataset.editSummaryId);
    });
  });
  elements.calendarSummary.querySelectorAll('[data-delete-summary-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTask(btn.dataset.deleteSummaryId);
      renderCalendarSummary();
      renderCalendar();
      renderTodoList();
    });
  });
  elements.reminderTime.value = reminderValue;
}

function renderTaskTypeOptions() {
  elements.taskType.innerHTML = '';
  state.types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    elements.taskType.appendChild(option);
  });
  elements.typeFilter.innerHTML = '<option value="all">全部分类</option>';
  state.types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    elements.typeFilter.appendChild(option);
  });
}

function renderTodoList() {
  const filter = elements.statusFilter.value;
  const typeFilter = elements.typeFilter.value;
  const sortOrder = elements.sortOrder.value;
  let tasks = [...state.tasks];
  if (filter === 'pending') tasks = tasks.filter(t => !t.completed);
  if (filter === 'done') tasks = tasks.filter(t => t.completed);
  if (typeFilter !== 'all') tasks = tasks.filter(t => t.typeId === typeFilter);
  tasks.sort((a, b) => {
    if (sortOrder === 'dateAsc') return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
    if (sortOrder === 'dateDesc') return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '');
    if (sortOrder === 'timeAsc') return (a.time || '').localeCompare(b.time || '') || a.date.localeCompare(b.date);
    if (sortOrder === 'timeDesc') return (b.time || '').localeCompare(a.time || '') || b.date.localeCompare(a.date);
    if (sortOrder === 'status') return (a.completed === b.completed ? 0 : a.completed ? 1 : -1) || a.date.localeCompare(b.date);
    return 0;
  });
  elements.taskList.innerHTML = tasks.length ? tasks.map(task => {
    const type = state.types.find(t => t.id === task.typeId) || { name: '默认', color: '#4f8cff' };
    return `
          <div class="task-item">
            <label class="checkbox-wrap">
              <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" class="complete-toggle" />
              <span>${task.title}</span>
            </label>
            <div class="task-meta">
              <div class="task-info">
                <span>${task.date}</span>
                <span>${task.time || '无时间'}</span>
                <span class="pill"><span class="pill-dot" style="background:${type.color}"></span>${type.name}</span>
              </div>
            </div>
            <div class="task-actions">
              <button class="icon-button" data-edit-id="${task.id}" title="编辑">✎</button>
              <button class="icon-button danger" data-delete-id="${task.id}" title="删除">🗑</button>
            </div>
          </div>`;
  }).join('') : '<p class="help-text">暂无符合条件的任务。</p>';
  elements.taskList.querySelectorAll('.complete-toggle').forEach(box => {
    box.addEventListener('change', e => {
      const id = e.target.dataset.taskId;
      toggleTaskCompletion(id, e.target.checked);
    });
  });
  elements.taskList.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      startEditTask(btn.dataset.editId);
    });
  });
  elements.taskList.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTask(btn.dataset.deleteId);
    });
  });
}

function renderSummaryView() {
  elements.monthlySummary.value = state.monthlySummaries[elements.summaryMonth.value] || '';
  elements.dailySummaryList.innerHTML = '';
  const monthKey = elements.summaryMonth.value;
  const [year, month] = monthKey.split('-').map(Number);
  const totalDays = new Date(year, month, 0).getDate();
  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;
    const content = state.dailySummaries[dateKey] || '';
    const row = document.createElement('div');
    row.className = 'day-summary-row';
    row.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <strong>${dateKey}</strong>
            <span>${content ? '已记录' : '未记录'}</span>
          </div>
          <textarea data-date="${dateKey}" placeholder="输入每日总结...">${content}</textarea>
          <button class="button-primary save-day-summary" data-date="${dateKey}">保存</button>
        `;
    elements.dailySummaryList.appendChild(row);
  }
  elements.dailySummaryList.querySelectorAll('.save-day-summary').forEach(button => {
    button.addEventListener('click', () => {
      const dateKey = button.dataset.date;
      const textarea = button.previousElementSibling;
      const content = textarea.value.trim();
      if (content) {
        state.dailySummaries[dateKey] = content;
      } else {
        delete state.dailySummaries[dateKey];
      }
      saveState();
      renderSummaryView();
      showToast('每日总结已保存');
    });
  });
}

function renderTypeList() {
  elements.typeList.innerHTML = state.types.map(type => `
        <div class="type-row">
          <div class="type-chip">
            <span class="color-swatch" style="background:${type.color}"></span>
            <span>${type.name}</span>
          </div>
          <button class="icon-button danger" data-delete-type="${type.id}" title="删除类型">🗑</button>
        </div>
      `).join('');
  elements.typeList.querySelectorAll('[data-delete-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteType(btn.dataset.deleteType);
    });
  });
}

function updateCalendarSelection() {
  const selectedMonth = state.currentDate.slice(0, 7);
  const [year, month] = selectedMonth.split('-');
  elements.yearSelect.value = year;
  elements.monthSelect.value = month;
  elements.taskDate.value = state.currentDate;
  elements.summaryMonth.value = state.currentMonth;
  if (elements.monthlyPlan) elements.monthlyPlan.value = state.monthlyPlans[state.currentMonth] || '';
}

function addTask() {
  const title = elements.taskTitle.value.trim();
  const date = elements.taskDate.value;
  const time = elements.taskTime.value;
  const typeId = elements.taskType.value;
  if (!title || !date) {
    return showToast('请填写任务名称与日期。');
  }
  const task = {
    id: state.selectedTaskId || `task-${Date.now()}`,
    title,
    date,
    time,
    typeId,
    completed: false
  };
  if (state.selectedTaskId) {
    const idx = state.tasks.findIndex(t => t.id === state.selectedTaskId);
    if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...task };
    state.selectedTaskId = null;
  } else {
    state.tasks.push(task);
  }
  saveState();
  resetTaskForm();
  renderCalendar();
  renderTodoList();
  showToast('任务已保存。');
}

function resetTaskForm() {
  state.selectedTaskId = null;
  elements.taskTitle.value = '';
  elements.taskTime.value = '';
  elements.taskType.value = state.types[0]?.id || '';
  elements.taskDate.value = state.currentDate;
}

function startEditTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  state.selectedTaskId = taskId;
  elements.taskTitle.value = task.title;
  elements.taskDate.value = task.date;
  elements.taskTime.value = task.time;
  elements.taskType.value = task.typeId;
  const todoTab = Array.from(elements.tabs).find(tab => tab.dataset.panel === 'todo-panel');
  if (todoTab) todoTab.click();
  elements.taskTitle.focus();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  saveState();
  renderCalendar();
  renderTodoList();
  showToast('任务已删除。');
}

function toggleTaskCompletion(taskId, completed) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  task.completed = completed;
  saveState();
  renderTodoList();
  if (completed) {
    celebrate();
  }
}

function saveReminderTime() {
  const key = state.currentDate;
  const value = elements.reminderTime.value;
  if (value) {
    state.reminders[key] = value;
    delete state.remindedStatus[key];
  } else {
    delete state.reminders[key];
  }
  saveState();
  renderCalendarSummary();
  showToast('提醒时间已保存。');
}

function addType() {
  const name = elements.typeName.value.trim();
  const color = elements.typeColor.value;
  if (!name) {
    return showToast('请输入类型名称。');
  }
  const id = `type-${Date.now()}`;
  state.types.push({ id, name, color });
  saveState();
  renderTypeList();
  renderTaskTypeOptions();
  elements.typeName.value = '';
  showToast('任务类型已添加。');
}

function deleteType(typeId) {
  if (typeId === 'default') {
    return showToast('默认类型不能删除。');
  }
  const attached = state.tasks.some(task => task.typeId === typeId);
  if (attached) {
    showToast('该类型已有任务关联，无法删除。');
    return;
  }
  state.types = state.types.filter(type => type.id !== typeId);
  saveState();
  renderTypeList();
  renderTaskTypeOptions();
}

function renderAll() {
  updateCalendarSelection();
  renderCalendar();
  renderCalendarSummary();
  renderTaskTypeOptions();
  renderTodoList();
  renderSummaryView();
  renderTypeList();
  refreshStats();
}

function pushToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(10,18,44,.95);color:#fff;padding:14px 18px;border-radius:18px;box-shadow:0 24px 40px rgba(0,0,0,.35);z-index:9999;opacity:0;transition:opacity .2s;';
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2200);
}

function showToast(message) {
  pushToast(message);
}

function celebrate() {
  const message = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  speakText(message);
  createFireworks();
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function createFireworks() {
  const colors = ['#4f8cff', '#ffb84c', '#42d392', '#ff8cc7', '#9b6bff'];
  for (let i = 0; i < 18; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const dx = (Math.random() - 0.5) * 320;
    const dy = (Math.random() - 1) * 260;
    spark.style.setProperty('--dx', `${dx}px`);
    spark.style.setProperty('--dy', `${dy}px`);
    spark.style.background = colors[Math.floor(Math.random() * colors.length)];
    spark.style.left = `${50 + (Math.random()-0.5)*20}%`;
    spark.style.top = `${60 + (Math.random()-0.5)*20}%`;
    elements.fireworks.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove());
  }
}

function checkReminders() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const reminderTime = state.reminders[todayKey];
  const summaryExists = Boolean(state.dailySummaries[todayKey]);
  const alreadyReminded = state.remindedStatus[todayKey];
  if (!reminderTime || summaryExists || alreadyReminded) {
    elements.reminderBanner.classList.add('hidden');
    return;
  }
  const now = new Date();
  const [hour, minute] = reminderTime.split(':').map(Number);
  if (now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute)) {
    elements.reminderBanner.classList.remove('hidden');
    state.remindedStatus[todayKey] = true;
    saveState();
    playAlertTone();
  }
}

function playAlertTone() {
  if (!window.AudioContext) return;
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 720;
  gain.gain.value = 0.2;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  oscillator.stop(ctx.currentTime + 0.45);
}

function updateTypeColorPreview(color) {
  if (!elements.typeColorPreview) return;
  elements.typeColorPreview.style.background = color;
}

function selectSwatch(color) {
  if (!elements.typeColorPalette) return;
  elements.typeColorPalette.querySelectorAll('.swatch').forEach(s => s.classList.toggle('selected', s.dataset.color === color));
}

function saveMonthPlan() {
  if (!elements.monthlyPlan) return;
  const key = state.currentMonth;
  const text = elements.monthlyPlan.value.trim();
  if (text) state.monthlyPlans[key] = text;
  else delete state.monthlyPlans[key];
  state.monthlyPlanEditing = false;
  saveState();
  setMonthlyPlanMode(false);
  showToast('月度计划已保存。');
}

function setMonthlyPlanMode(editable) {
  if (!elements.monthlyPlan || !elements.saveMonthPlan) return;
  state.monthlyPlanEditing = editable;
  elements.monthlyPlan.readOnly = !editable;
  if (editable) {
    elements.monthlyPlan.classList.remove('readonly');
    elements.saveMonthPlan.textContent = '保存月度计划';
  } else {
    elements.monthlyPlan.classList.add('readonly');
    elements.saveMonthPlan.textContent = '编辑月度计划';
  }
}

function initEventListeners() {
  elements.yearSelect.addEventListener('change', renderCalendar);
  elements.monthSelect.addEventListener('change', renderCalendar);
  elements.todayButton.addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);
    state.currentDate = today;
    state.currentMonth = today.slice(0, 7);
    updateCalendarSelection();
    renderCalendar();
    renderCalendarSummary();
    renderTodoList();
  });
  elements.saveTask.addEventListener('click', addTask);
  elements.cancelEdit.addEventListener('click', resetTaskForm);
  elements.statusFilter.addEventListener('change', renderTodoList);
  elements.typeFilter.addEventListener('change', renderTodoList);
  elements.sortOrder.addEventListener('change', renderTodoList);
  elements.saveType.addEventListener('click', addType);
  elements.saveMonthSummary.addEventListener('click', () => {
    const key = elements.summaryMonth.value;
    const text = elements.monthlySummary.value.trim();
    if (text) state.monthlySummaries[key] = text;
    else delete state.monthlySummaries[key];
    saveState();
    showToast('月度总结已保存。');
  });
  elements.summaryMonth.addEventListener('change', renderSummaryView);
  elements.saveReminder.addEventListener('click', saveReminderTime);
  if (elements.exportBackupButton) elements.exportBackupButton.addEventListener('click', () => exportBackup());
  if (elements.importBackupButton && elements.backupFileInput) elements.importBackupButton.addEventListener('click', () => elements.backupFileInput.click());
  if (elements.backupFileInput) elements.backupFileInput.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) importBackup(file);
    e.target.value = '';
  });
  if (elements.saveMonthPlan) elements.saveMonthPlan.addEventListener('click', () => {
    if (elements.monthlyPlan.readOnly) {
      state.monthlyPlanEditing = true;
      setMonthlyPlanMode(true);
      elements.monthlyPlan.focus();
      return;
    }
    saveMonthPlan();
  });
  elements.dismissReminder.addEventListener('click', () => {
    elements.reminderBanner.classList.add('hidden');
  });
  if (elements.typeColor) elements.typeColor.addEventListener('change', e => {
    updateTypeColorPreview(e.target.value);
    selectSwatch(e.target.value);
  });
}

function init() {
  loadState();
  buildDateOptions();
  buildTypeColorOptions();
  buildMonthOptions();
  renderTabPanels();
  initEventListeners();
  updateCalendarSelection();
  renderAll();
  setInterval(checkReminders, 30000);
  scheduleDailyAutoBackup();
  checkReminders();
}

init();
