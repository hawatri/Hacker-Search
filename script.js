// Search logic
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const tags = document.querySelectorAll('.tag');
const searchSuggestions = document.createElement('div');
searchSuggestions.className = 'search-suggestions';
searchForm.appendChild(searchSuggestions);

const searchEngines = {
  google: query => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  youtube: query => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  github: query => `https://github.com/search?q=${encodeURIComponent(query)}`,
  duckduckgo: query => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  bing: query => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
  scholar: query => `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`
};

let selectedEngine = 'google';

// Function to save selected search engine
function saveSelectedEngine(engine) {
  chrome.storage.local.set({ selectedSearchEngine: engine });
}

// Function to restore selected search engine
function restoreSelectedEngine() {
  chrome.storage.local.get(['selectedSearchEngine'], (result) => {
    if (result.selectedSearchEngine) {
      const tag = document.querySelector(`.tag[data-engine="${result.selectedSearchEngine}"]`);
      if (tag) {
        selectTag(tag);
      }
    }
  });
}

tags.forEach(tag => {
  tag.addEventListener('click', () => selectTag(tag));
  tag.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectTag(tag);
    }
  });
});

function selectTag(tag) {
  tags.forEach(t => {
    t.classList.remove('selected');
    t.setAttribute('aria-pressed', 'false');
  });
  tag.classList.add('selected');
  tag.setAttribute('aria-pressed', 'true');
  selectedEngine = tag.getAttribute('data-engine');
  saveSelectedEngine(selectedEngine);
  searchInput.focus();
}

function parseInput(input) {
  const parts = input.trim().split(/\s+/);
  const first = parts[0].toLowerCase();
  const second = parts[1]?.toLowerCase();
  
  // Handle NT command
  if (first === 'nt' && second && searchEngines[second]) {
    return {
      engine: second,
      query: parts.slice(2).join(' '),
      newTab: true
    };
  }
  
  // Handle direct search engine access
  if (searchEngines[first] && parts.length === 1) {
    return {
      engine: first,
      query: '',
      newTab: false,
      directAccess: true
    };
  }
  
  // Handle regular search engine commands
  if (searchEngines[first]) {
    return {
      engine: first,
      query: parts.slice(1).join(' '),
      newTab: false
    };
  }
  
  return {
    engine: selectedEngine,
    query: input.trim(),
    newTab: false
  };
}

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const input = searchInput.value.trim();
  if (!input) return;
  const { engine, query, newTab, directAccess } = parseInput(input);
  
  if (directAccess) {
    // Direct access to search engine
    const baseUrls = {
      google: 'https://www.google.com',
      youtube: 'https://www.youtube.com',
      github: 'https://github.com',
      duckduckgo: 'https://duckduckgo.com',
      bing: 'https://www.bing.com',
      scholar: 'https://scholar.google.com'
    };
    window.location.href = baseUrls[engine];
    return;
  }
  
  if (!query) return;
  const url = searchEngines[engine](query);
  
  if (newTab) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
});

// Draggable logic
function makeDraggable(dragElement, dragHandle) {
  let offsetX = 0, offsetY = 0, isDragging = false;

  // Load saved position
  chrome.storage.local.get(['widgetPositions'], (result) => {
    const positions = result.widgetPositions || {};
    const widgetId = dragElement.id;
    if (positions[widgetId]) {
      dragElement.style.left = positions[widgetId].left;
      dragElement.style.top = positions[widgetId].top;
    } else {
      // Save initial position if not already saved
      saveWidgetPosition(dragElement);
    }
  });

  dragHandle.addEventListener('mousedown', (e) => {
    if (dragElement.dataset.locked === 'true') return;
    isDragging = true;
    
    // Calculate the offset from the mouse position to the element's top-left corner
    const rect = dragElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    
    document.body.style.userSelect = 'none';
    dragElement.style.transition = 'none';
    dragElement.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      dragElement.style.cursor = '';
      dragElement.style.transition = 'all 0.3s ease';
      // Save position when dragging ends
      saveWidgetPosition(dragElement);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    // Calculate new position based on mouse position and initial offset
    let left = e.clientX - offsetX;
    let top = e.clientY - offsetY;

    // Constrain to window bounds
    const maxLeft = window.innerWidth - dragElement.offsetWidth;
    const maxTop = window.innerHeight - dragElement.offsetHeight;
    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));

    // Apply the new position
    dragElement.style.left = `${left}px`;
    dragElement.style.top = `${top}px`;
  });

  // Keyboard accessibility: move with arrow keys when focused on header
  dragHandle.addEventListener('keydown', (e) => {
    const step = 10;
    const rect = dragElement.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top;
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        top = Math.max(0, top - step);
        break;
      case 'ArrowDown':
        e.preventDefault();
        top = Math.min(window.innerHeight - dragElement.offsetHeight, top + step);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        left = Math.max(0, left - step);
        break;
      case 'ArrowRight':
        e.preventDefault();
        left = Math.min(window.innerWidth - dragElement.offsetWidth, left + step);
        break;
      default:
        return;
    }
    dragElement.style.left = left + 'px';
    dragElement.style.top = top + 'px';
    // Save position after keyboard movement
    saveWidgetPosition(dragElement);
  });
}

// Function to get computed position
function getComputedPosition(element) {
  const style = window.getComputedStyle(element);
  return {
    left: style.left,
    top: style.top
  };
}

// Function to save widget position
function saveWidgetPosition(widget) {
  const widgetId = widget.id;
  const position = {
    left: widget.style.left || getComputedPosition(widget).left,
    top: widget.style.top || getComputedPosition(widget).top
  };
  
  chrome.storage.local.get(['widgetPositions'], (result) => {
    const positions = result.widgetPositions || {};
    positions[widgetId] = position;
    chrome.storage.local.set({ widgetPositions: positions });
  });
}

// Function to restore all widget positions
function restoreWidgetPositions() {
  chrome.storage.local.get(['widgetPositions'], (result) => {
    const positions = result.widgetPositions || {};
    widgets.forEach(id => {
      const widget = document.getElementById(id);
      if (positions[id]) {
        widget.style.left = positions[id].left;
        widget.style.top = positions[id].top;
      } else {
        // Save initial position if not already saved
        saveWidgetPosition(widget);
      }
    });
  });
}

// Initialize draggable widgets
const widgets = [
  'clockWidget',
  'todoWidget',
  'weatherWidget',
  'screensaverWidget',
  'mediaPlayer',
  'readmeWidget',
  'notesWidget',
  'calendarWidget',
  'clipboardWidget'
];

// Minimize and resize logic
const minimizedContainer = document.getElementById('minimizedContainer');

function createMinimizedButton(widget, title) {
  const btn = document.createElement('button');
  btn.className = 'minimized-widget';
  btn.textContent = title;
  btn.setAttribute('aria-label', `Restore ${title} widget`);
  btn.tabIndex = 0;
  btn.addEventListener('click', () => {
    restoreWidget(widget, btn);
  });
  btn.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      restoreWidget(widget, btn);
    }
  });
  return btn;
}

function minimizeWidget(widget) {
  if (widget.dataset.minimized === 'true') return;
  const title = widget.querySelector('.drag-header').textContent.trim();
  const btn = createMinimizedButton(widget, title);
  minimizedContainer.appendChild(btn);
  widget.style.display = 'none';
  widget.dataset.minimized = 'true';
  
  // Save minimized state
  saveWidgetState(widget.id, true);
}

function restoreWidget(widget, btn) {
  widget.style.display = 'flex';
  widget.dataset.minimized = 'false';
  minimizedContainer.removeChild(btn);
  
  // Save restored state
  saveWidgetState(widget.id, false);
}

// Function to save widget state
function saveWidgetState(widgetId, isMinimized) {
  chrome.storage.local.get(['widgetStates'], (result) => {
    const states = result.widgetStates || {};
    states[widgetId] = { minimized: isMinimized };
    chrome.storage.local.set({ widgetStates: states });
  });
}

// Function to restore widget states
function restoreWidgetStates() {
  chrome.storage.local.get(['widgetStates'], (result) => {
    const states = result.widgetStates || {};
    widgets.forEach(id => {
      const widget = document.getElementById(id);
      if (states[id] && states[id].minimized) {
        minimizeWidget(widget);
      }
    });
  });
}

// Attach minimize and resize button handlers
widgets.forEach(id => {
  const widget = document.getElementById(id);
  const minimizeBtn = widget.querySelector('.minimize-btn');
  const resizeBtn = widget.querySelector('.resize-btn');
  minimizeBtn.addEventListener('click', () => minimizeWidget(widget));
  resizeBtn.addEventListener('click', () => resizeWidget(widget));
});

// Function to save widget lock state
function saveWidgetLockState(widgetId, isLocked) {
  chrome.storage.local.get(['widgetLocks'], (result) => {
    const locks = result.widgetLocks || {};
    locks[widgetId] = isLocked;
    chrome.storage.local.set({ widgetLocks: locks });
  });
}

// Function to restore widget lock states
function restoreWidgetLockStates() {
  chrome.storage.local.get(['widgetLocks'], (result) => {
    const locks = result.widgetLocks || {};
    widgets.forEach(id => {
      const widget = document.getElementById(id);
      const lockBtn = widget.querySelector('.lock-btn');
      if (locks[id]) {
        lockBtn.classList.add('locked');
        lockBtn.textContent = '[ ]';
        widget.dataset.locked = 'true';
      }
    });
  });
}

// Function to toggle header visibility
function toggleHeaders(show) {
  widgets.forEach(id => {
    const widget = document.getElementById(id);
    const header = widget.querySelector('.drag-header');
    if (show) {
      header.classList.remove('hidden');
    } else {
      header.classList.add('hidden');
    }
  });
}

// Add lock button handlers
widgets.forEach(id => {
  const widget = document.getElementById(id);
  const lockBtn = widget.querySelector('.lock-btn');
  lockBtn.addEventListener('click', () => {
    const isLocked = lockBtn.classList.toggle('locked');
    lockBtn.textContent = isLocked ? '[ ]' : '[X]';
    widget.dataset.locked = isLocked;
    saveWidgetLockState(id, isLocked);
  });
});

// Initialize widgets and restore positions
async function initializeWidgets() {
  // Hide all widgets initially and add loading state
  widgets.forEach(id => {
    const widget = document.getElementById(id);
    widget.style.visibility = 'hidden';
    widget.style.opacity = '0';
    widget.classList.add('loading');
  });

  // Wait for all widget states to be restored
  await new Promise(resolve => {
    chrome.storage.local.get(['widgetPositions', 'widgetStates', 'widgetSizes'], (result) => {
      const positions = result.widgetPositions || {};
      const states = result.widgetStates || {};
      const sizes = result.widgetSizes || {};
      
      widgets.forEach(id => {
        const widget = document.getElementById(id);
        // Restore position
        if (positions[id]) {
          widget.style.left = positions[id].left;
          widget.style.top = positions[id].top;
        }
        
        // Set default size if no size is saved
        if (!sizes[id]) {
          const sizePresets = {
            mediaPlayer: [
              { w: 320, h: 400 },   // Small
              { w: 400, h: 500 },   // Normal
              { w: 480, h: 600 },   // Medium
              { w: 560, h: 700 },   // Large
              { w: 640, h: 800 }    // Huge
            ],
            default: [
              { w: 240, h: 180 },   // Small
              { w: 320, h: 240 },   // Normal
              { w: 400, h: 320 },   // Medium
              { w: 480, h: 400 },   // Large
              { w: 560, h: 480 }    // Huge
            ]
          };
          
          const presetSizes = sizePresets[id] || sizePresets.default;
          const defaultSize = presetSizes[1]; // Normal size is at index 1
          
          widget.style.width = `${defaultSize.w}px`;
          widget.style.height = `${defaultSize.h}px`;
          
          // Update resize button to show Normal size
          const resizeBtn = widget.querySelector('.resize-btn');
          resizeBtn.textContent = 'N';
          resizeBtn.setAttribute('title', 'Size: Normal');
          
          // Save the default size
          saveWidgetSize(id, defaultSize);
        } else {
          // Restore saved size
          widget.style.width = `${sizes[id].w}px`;
          widget.style.height = `${sizes[id].h}px`;
        }
        
        // Restore minimized state
        if (states[id] && states[id].minimized) {
          minimizeWidget(widget);
        }

        // Make widget draggable
        const header = widget.querySelector('.drag-header');
        makeDraggable(widget, header);
      });
      resolve();
    });
  });

  // Restore playlist data
  await restorePlaylistData();

  // Small delay to ensure smooth transition
  await new Promise(resolve => setTimeout(resolve, 50));

  // Show widgets with fade-in effect
  widgets.forEach(id => {
    const widget = document.getElementById(id);
    widget.classList.remove('loading');
    widget.style.visibility = 'visible';
    widget.style.opacity = '1';
  });

  // Restore lock states
  restoreWidgetLockStates();
}

// Focus management
function ensureSearchFocus() {
  // Only focus search if no other input is focused
  if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    searchInput.focus();
  }
}

// Initialize on page load
window.addEventListener('load', () => {
  initializeWidgets();
  restoreSelectedEngine();
  restoreClockState();
  loadSettings();
  initializeClipboardWidget();
  setInterval(updateClocks, 1000);
  updateClocks();
  
  // Initial focus attempt
  ensureSearchFocus();

  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      ensureSearchFocus();
    }
  });

  // Handle window focus
  window.addEventListener('focus', ensureSearchFocus);

  // Handle clicks on the page
  document.addEventListener('click', (e) => {
    // Don't steal focus if clicking on inputs or buttons
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'BUTTON' ||
        e.target.closest('.widget-content')) {
      return;
    }
    ensureSearchFocus();
  });
});

// Listen for new tab creation
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.pendingUrl === 'chrome://newtab/') {
    ensureSearchFocus();
  }
});

// Clock toggle logic
const toggleBtn = document.querySelector('#clockWidget .toggle-btn');
const digitalClock = document.getElementById('digitalClock');
const analogClock = document.getElementById('analogClock');
const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');

let isAnalog = false;
let currentTimezone = 'local'; // Default timezone

// Function to save clock state
function saveClockState() {
  chrome.storage.local.set({ clockState: { isAnalog } });
}

// Function to restore clock state
function restoreClockState() {
  chrome.storage.local.get(['clockState'], (result) => {
    if (result.clockState && result.clockState.isAnalog) {
      isAnalog = true;
      digitalClock.style.display = 'none';
      analogClock.classList.add('visible');
      toggleBtn.textContent = 'Digital';
      toggleBtn.setAttribute('aria-pressed', 'true');
      analogClock.setAttribute('aria-hidden', 'false');
      digitalClock.setAttribute('aria-hidden', 'true');
    }
  });
}

toggleBtn.addEventListener('click', () => {
  isAnalog = !isAnalog;
  if (isAnalog) {
    digitalClock.style.display = 'none';
    analogClock.classList.add('visible');
    toggleBtn.textContent = 'Digital';
    toggleBtn.setAttribute('aria-pressed', 'true');
    analogClock.setAttribute('aria-hidden', 'false');
    digitalClock.setAttribute('aria-hidden', 'true');
  } else {
    digitalClock.style.display = 'block';
    analogClock.classList.remove('visible');
    toggleBtn.textContent = 'Analog';
    toggleBtn.setAttribute('aria-pressed', 'false');
    analogClock.setAttribute('aria-hidden', 'true');
    digitalClock.setAttribute('aria-hidden', 'false');
  }
  saveClockState();
});

// Function to update clock timezone
function updateClockTimezone(timezone) {
  const now = new Date();
  let time;
  
  if (timezone === 'local') {
    time = now;
  } else {
    try {
      // Get the time in the target timezone
      const options = {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      
      // Get the time string in the target timezone
      const timeString = now.toLocaleTimeString('en-US', options);
      const [hours, minutes, seconds] = timeString.split(':').map(Number);
      
      // Create a new date with the target timezone's time
      time = new Date();
      time.setHours(hours);
      time.setMinutes(minutes);
      time.setSeconds(seconds);
    } catch (e) {
      console.error('Invalid timezone:', timezone);
      time = now;
    }
  }
  
  return time;
}

// Modify the clock update functions to use timezone
function updateDigitalClock() {
  const time = updateClockTimezone(currentTimezone);
  const h = time.getHours().toString().padStart(2,'0');
  const m = time.getMinutes().toString().padStart(2,'0');
  const s = time.getSeconds().toString().padStart(2,'0');
  digitalClock.textContent = `${h}:${m}:${s}`;
}

function updateAnalogClock() {
  const time = updateClockTimezone(currentTimezone);
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // Calculate angles for the clock hands
  const secondsDeg = ((seconds / 60) * 360) + 1800;
  const minutesDeg = ((minutes / 60) * 360) + ((seconds/60)*6) + 1800;
  const hoursDeg = ((hours % 12) / 12 * 360) + ((minutes/60)*30) + 1800;

  // Update the clock hands
  secondHand.style.transform = `translate(-50%, -100%) rotate(${secondsDeg}deg)`;
  minuteHand.style.transform = `translate(-50%, -100%) rotate(${minutesDeg}deg)`;
  hourHand.style.transform = `translate(-50%, -100%) rotate(${hoursDeg}deg)`;
}

function updateClocks() {
  updateDigitalClock();
  updateAnalogClock();
}

// Settings functionality
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeBtn = document.querySelector('.close-btn');
const timezoneSelect = document.getElementById('timezoneSelect');
const weatherLocation = document.getElementById('weatherLocation');
const saveWeatherLocation = document.getElementById('saveWeatherLocation');

// Function to save settings
function saveSettings() {
  const settings = {
    timezone: timezoneSelect.value,
    weatherLocation: weatherLocation.value.trim(),
    theme: document.getElementById('themeSelect').value,
    showHeaders: document.getElementById('showHeaders').checked,
    showAITools: document.getElementById('showAITools').checked
  };
  
  chrome.storage.local.set({ settings }, () => {
    currentTimezone = settings.timezone;
    updateClockTimezone(settings.timezone);
    fetchWeather(settings.weatherLocation);
    applyTheme(settings.theme);
    toggleHeaders(settings.showHeaders);
    toggleAITools(settings.showAITools);
  });
}

// Function to load settings
function loadSettings() {
  chrome.storage.local.get('settings', (data) => {
    const settings = data.settings || {
      timezone: 'Asia/Kolkata',
      weatherLocation: 'Kolkata',
      theme: 'matrix',
      showHeaders: true,
      showAITools: true
    };
    
    timezoneSelect.value = settings.timezone;
    weatherLocation.value = settings.weatherLocation;
    document.getElementById('themeSelect').value = settings.theme;
    document.getElementById('showHeaders').checked = settings.showHeaders;
    document.getElementById('showAITools').checked = settings.showAITools;
    
    updateClockTimezone(settings.timezone);
    fetchWeather(settings.weatherLocation);
    applyTheme(settings.theme);
    toggleHeaders(settings.showHeaders);
    toggleAITools(settings.showAITools);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update matrix background color based on theme
  const matrixCanvas = document.getElementById('matrixBackground');
  if (matrixCanvas) {
    const ctx = matrixCanvas.getContext('2d');
    const themeColors = {
      matrix: '#00ff00',
      cyberpunk: '#ff00ff',
      retro: '#ffb000',
      hacker: '#00ffff',
      neon: '#9d00ff'
    };
    
    // Update the matrix color
    ctx.fillStyle = themeColors[theme] || '#00ff00';
    
    // Clear the canvas and redraw with new color
    ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    drawMatrix();
  }
}

// Settings modal event listeners
settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('visible');
  settingsModal.setAttribute('aria-hidden', 'false');
  // Load current settings when opening modal
  loadSettings();
});

closeBtn.addEventListener('click', () => {
  settingsModal.classList.remove('visible');
  settingsModal.setAttribute('aria-hidden', 'true');
});

// Only close modal when clicking the background, not the content
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('visible');
    settingsModal.setAttribute('aria-hidden', 'true');
  }
});

// Prevent clicks inside the settings content from closing the modal
const settingsContent = document.querySelector('.settings-content');
settingsContent.addEventListener('click', (e) => {
  e.stopPropagation();
});

// Save settings when timezone changes
timezoneSelect.addEventListener('change', () => {
  saveSettings();
});

// Save settings when weather location is changed
weatherLocation.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveSettings();
  }
});

saveWeatherLocation.addEventListener('click', () => {
  const location = weatherLocation.value.trim();
  if (location) {
    saveSettings();
  }
});

// Add event listener for theme select
document.getElementById('themeSelect').addEventListener('change', () => {
  saveSettings();
});

// Add event listener for show headers checkbox
document.getElementById('showHeaders').addEventListener('change', () => {
  saveSettings();
});

// Add event listener for show AITools checkbox
document.getElementById('showAITools').addEventListener('change', () => {
  saveSettings();
});

// Todo List Logic
const todoListEl = document.getElementById('todoList');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');

function saveTodos(todos) {
  chrome.storage.local.set({ 'hackerTodoList': todos });
}

function loadTodos() {
  return new Promise((resolve) => {
    chrome.storage.local.get('hackerTodoList', (result) => {
      resolve(result.hackerTodoList || []);
    });
  });
}

async function renderTodos() {
  const todos = await loadTodos();
  todoListEl.innerHTML = '';
  todos.forEach((todo, idx) => {
    const div = document.createElement('div');
    div.className = 'todo-item';
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo;
    div.appendChild(span);
    const removeBtn = document.createElement('span');
    removeBtn.className = 'todo-remove';
    removeBtn.setAttribute('role', 'button');
    removeBtn.setAttribute('tabindex', '0');
    removeBtn.setAttribute('aria-label', `Remove task: ${todo}`);
    removeBtn.textContent = '×';
    removeBtn.onclick = async () => {
      const currentTodos = await loadTodos();
      currentTodos.splice(idx, 1);
      await saveTodos(currentTodos);
      renderTodos();
    };
    removeBtn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        removeBtn.click();
      }
    };
    div.appendChild(removeBtn);
    todoListEl.appendChild(div);
  });
}

addTodoBtn.addEventListener('click', async () => {
  const val = todoInput.value.trim();
  if (!val) return;
  const todos = await loadTodos();
  todos.push(val);
  await saveTodos(todos);
  todoInput.value = '';
  renderTodos();
});

todoInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTodoBtn.click();
  }
});

renderTodos();

// Weather Widget Logic
const weatherInfo = document.getElementById('weatherInfo');
const defaultCity = 'New York';

async function fetchWeather(city) {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      weatherInfo.textContent = `Weather: City "${city}" not found.`;
      return;
    }
    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();
    if (!weatherData.current_weather) {
      weatherInfo.textContent = `Weather: No data available for ${name}.`;
      return;
    }
    const tempC = weatherData.current_weather.temperature;
    const windSpeed = weatherData.current_weather.windspeed;
    const weatherCode = weatherData.current_weather.weathercode;
    const weatherDesc = weatherCodeToDesc(weatherCode);
    weatherInfo.innerHTML = `<strong>${name}, ${country}</strong><br>Temp: ${tempC}°C<br>Wind: ${windSpeed} km/h<br>${weatherDesc}`;
  } catch (e) {
    weatherInfo.textContent = 'Weather: Error fetching data.';
  }
}

function weatherCodeToDesc(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Unknown weather';
}

fetchWeather(defaultCity);

// Screensaver Widget Logic
const screensaverCanvas = document.getElementById('screensaverCanvas');
const ctx = screensaverCanvas.getContext('2d');
const width = screensaverCanvas.width;
const height = screensaverCanvas.height;

const letters = '01';
const fontSize = 16;
const columns = Math.floor(width / fontSize);
const drops = Array(columns).fill(1);

function drawMatrix() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#00ff00';
  ctx.font = fontSize + 'px Share Tech Mono';
  for (let i = 0; i < drops.length; i++) {
    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
    if (drops[i] * fontSize > height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

let screensaverInterval = null;
let screensaverActive = false;
let inactivityTimeout = null;

function startScreensaver() {
  if (screensaverActive) return;
  screensaverActive = true;
  screensaverCanvas.style.display = 'block';
  screensaverInterval = setInterval(drawMatrix, 50);
}
function stopScreensaver() {
  if (!screensaverActive) return;
  screensaverActive = false;
  screensaverCanvas.style.display = 'none';
  clearInterval(screensaverInterval);
}

function resetInactivityTimer() {
  stopScreensaver();
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(startScreensaver, 60000); // 1 min inactivity
}

['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
  window.addEventListener(evt, resetInactivityTimer);
});
resetInactivityTimer();

// Media Player Logic
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const seekBar = document.getElementById('seekBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeSpan = document.getElementById('currentTime');
const durationSpan = document.getElementById('duration');
const mediaFileInput = document.getElementById('mediaFileInput');
const selectMediaBtn = document.getElementById('selectMediaBtn');
const selectedMediaName = document.getElementById('selectedMediaName');
const folderInput = document.getElementById('folderInput');
const selectFolderBtn = document.getElementById('selectFolderBtn');
const playlist = document.getElementById('playlist');
const clearPlaylistBtn = document.getElementById('clearPlaylistBtn');

let mediaFiles = [];
let currentTrackIndex = 0;
let isDragging = false;
let isLoading = false;
let mediaUrls = []; // Store URLs for the media files
let isPlaying = false;

// Format time in MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update time display
function updateTimeDisplay() {
  if (audioPlayer.readyState >= 1) {
    currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    durationSpan.textContent = formatTime(audioPlayer.duration);
  }
}

// Update seek bar
function updateSeekBar() {
  if (!isDragging && audioPlayer.readyState >= 1) {
    const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    seekBar.value = percentage;
  }
}

// Create playlist item
function createPlaylistItem(file, index) {
  const item = document.createElement('div');
  item.className = 'playlist-item';
  if (index === currentTrackIndex) {
    item.classList.add('active');
  }

  const title = document.createElement('div');
  title.className = 'playlist-item-title';
  title.textContent = file.name;

  const controls = document.createElement('div');
  controls.className = 'playlist-item-controls';

  const playButton = document.createElement('button');
  playButton.textContent = 'PLAY';
  playButton.onclick = async (e) => {
    e.stopPropagation();
    await playTrack(index);
  };

  const removeButton = document.createElement('button');
  removeButton.textContent = '×';
  removeButton.onclick = async (e) => {
    e.stopPropagation();
    await removeTrack(index);
  };

  controls.appendChild(playButton);
  controls.appendChild(removeButton);

  item.appendChild(title);
  item.appendChild(controls);

  item.onclick = async () => {
    await playTrack(index);
  };

  return item;
}

// Update playlist display
function updatePlaylist() {
  playlist.innerHTML = '';
  mediaFiles.forEach((file, index) => {
    playlist.appendChild(createPlaylistItem(file, index));
  });
}

// Play specific track
async function playTrack(index) {
  if (index >= 0 && index < mediaFiles.length) {
    try {
      isLoading = true;
      currentTrackIndex = index;
      const file = mediaFiles[index];
      
      // Only create new URL if we don't have one
      if (!mediaUrls[index]) {
        mediaUrls[index] = URL.createObjectURL(file);
      }
      
      audioPlayer.src = mediaUrls[index];
      await audioPlayer.load();
      selectedMediaName.textContent = `${file.name} (${index + 1} of ${mediaFiles.length})`;
      await audioPlayer.play();
      isPlaying = true;
      updatePlaylist();
      await savePlaylistData();
    } catch (error) {
      console.error('Error playing track:', error);
      selectedMediaName.textContent = 'Error playing track';
    } finally {
      isLoading = false;
    }
  }
}

// Remove track from playlist
async function removeTrack(index) {
  if (index >= 0 && index < mediaFiles.length) {
    // Clean up the URL
    if (mediaUrls[index]) {
      URL.revokeObjectURL(mediaUrls[index]);
    }
    mediaUrls.splice(index, 1);
    mediaFiles.splice(index, 1);
    
    if (mediaFiles.length === 0) {
      audioPlayer.pause();
      audioPlayer.src = '';
      selectedMediaName.textContent = 'No media selected';
      currentTrackIndex = -1;
      isPlaying = false;
    } else if (index === currentTrackIndex) {
      await playTrack(Math.min(index, mediaFiles.length - 1));
    } else if (index < currentTrackIndex) {
      currentTrackIndex--;
    }
    updatePlaylist();
    await savePlaylistData();
  }
}

// Clear playlist
async function clearPlaylist() {
  // Clean up all URLs
  mediaUrls.forEach(url => {
    if (url) URL.revokeObjectURL(url);
  });
  mediaUrls = [];
  mediaFiles = [];
  currentTrackIndex = -1;
  isPlaying = false;
  audioPlayer.pause();
  audioPlayer.src = '';
  selectedMediaName.textContent = 'No media selected';
  updatePlaylist();
  await chrome.storage.local.remove('playlistData');
}

// Handle single file selection
selectMediaBtn.addEventListener('click', () => {
  mediaFileInput.click();
});

// Handle folder selection
selectFolderBtn.addEventListener('click', () => {
  folderInput.click();
});

// Handle folder selection
folderInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));
  if (files.length > 0) {
    // Clean up existing URLs
    mediaUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    mediaUrls = [];
    mediaFiles = files;
    // Create URLs for all files
    mediaFiles.forEach((file, index) => {
      mediaUrls[index] = URL.createObjectURL(file);
    });
    currentTrackIndex = 0;
    await playTrack(0);
    await savePlaylistData();
  }
});

// Clear playlist button
clearPlaylistBtn.addEventListener('click', clearPlaylist);

// Handle audio ended
audioPlayer.addEventListener('ended', async () => {
  if (mediaFiles.length > 0) {
    const nextIndex = (currentTrackIndex + 1) % mediaFiles.length;
    await playTrack(nextIndex);
  }
});

// Handle seek bar changes
seekBar.addEventListener('input', () => {
  if (audioPlayer.readyState >= 1) {
    isDragging = true;
    const time = (seekBar.value / 100) * audioPlayer.duration;
    if (isFinite(time)) {
      audioPlayer.currentTime = time;
    }
  }
});

seekBar.addEventListener('change', () => {
  if (audioPlayer.readyState >= 1) {
    isDragging = false;
    const time = (seekBar.value / 100) * audioPlayer.duration;
    if (isFinite(time)) {
      audioPlayer.currentTime = time;
    }
  }
});

// Handle volume changes
volumeBar.addEventListener('input', () => {
  audioPlayer.volume = volumeBar.value / 100;
});

// Update time and seek bar during playback
audioPlayer.addEventListener('timeupdate', () => {
  updateTimeDisplay();
  updateSeekBar();
});

// Handle audio loaded
audioPlayer.addEventListener('loadedmetadata', () => {
  updateTimeDisplay();
  updateSeekBar();
  isLoading = false;
});

// Handle audio can play
audioPlayer.addEventListener('canplay', () => {
  updateTimeDisplay();
  updateSeekBar();
});

// Handle audio errors
audioPlayer.addEventListener('error', (e) => {
  console.error('Audio error:', e);
  selectedMediaName.textContent = 'Error loading media';
  isLoading = false;
});

// Play button
playBtn.addEventListener('click', async () => {
  if (!isLoading && audioPlayer.readyState >= 1) {
    try {
      if (!isPlaying) {
        await audioPlayer.play();
        isPlaying = true;
      }
    } catch (error) {
      console.error('Error playing:', error);
    }
  }
});

// Pause button
pauseBtn.addEventListener('click', () => {
  if (!isLoading && audioPlayer.readyState >= 1) {
    audioPlayer.pause();
    isPlaying = false;
  }
});

// Stop button
stopBtn.addEventListener('click', () => {
  if (!isLoading && audioPlayer.readyState >= 1) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
  }
});

// Resize logic
function resizeWidget(widget) {
  const currentWidth = widget.offsetWidth;
  const currentHeight = widget.offsetHeight;
  
  const sizePresets = {
    mediaPlayer: [
      { w: 320, h: 400 },   // Small
      { w: 400, h: 500 },   // Normal
      { w: 480, h: 600 },   // Medium
      { w: 560, h: 700 },   // Large
      { w: 640, h: 800 }    // Huge
    ],
    default: [
      { w: 240, h: 180 },   // Small
      { w: 320, h: 240 },   // Normal
      { w: 400, h: 320 },   // Medium
      { w: 480, h: 400 },   // Large
      { w: 560, h: 480 }    // Huge
    ]
  };

  const sizes = sizePresets[widget.id] || sizePresets.default;
  
  // Get current size index from the resize button text
  const resizeBtn = widget.querySelector('.resize-btn');
  const sizeLabels = ['S', 'N', 'M', 'L', 'H'];
  const currentLabel = resizeBtn.textContent;
  const currentIndex = sizeLabels.indexOf(currentLabel);
  
  // Calculate next size index
  const nextSizeIndex = (currentIndex + 1) % sizes.length;
  const newSize = sizes[nextSizeIndex];
  
  // Apply the new size
  widget.style.width = `${newSize.w}px`;
  widget.style.height = `${newSize.h}px`;

  // Update resize button text
  resizeBtn.textContent = sizeLabels[nextSizeIndex];
  resizeBtn.setAttribute('title', `Size: ${['Small', 'Normal', 'Medium', 'Large', 'Huge'][nextSizeIndex]}`);

  // Save the new size
  saveWidgetSize(widget.id, newSize);
}

// Function to save widget size
function saveWidgetSize(widgetId, size) {
  chrome.storage.local.get(['widgetSizes'], (result) => {
    const sizes = result.widgetSizes || {};
    sizes[widgetId] = size;
    chrome.storage.local.set({ widgetSizes: sizes });
  });
}

// Function to restore widget sizes
function restoreWidgetSizes() {
  chrome.storage.local.get(['widgetSizes'], (result) => {
    const sizes = result.widgetSizes || {};
    widgets.forEach(id => {
      const widget = document.getElementById(id);
      if (sizes[id]) {
        widget.style.width = `${sizes[id].w}px`;
        widget.style.height = `${sizes[id].h}px`;
        
        // Update resize button text
        const resizeBtn = widget.querySelector('.resize-btn');
        const sizePresets = {
          mediaPlayer: [
            { w: 320, h: 400 },
            { w: 400, h: 500 },
            { w: 480, h: 600 },
            { w: 560, h: 700 },
            { w: 640, h: 800 }
          ],
          default: [
            { w: 240, h: 180 },
            { w: 320, h: 240 },
            { w: 400, h: 320 },
            { w: 480, h: 400 },
            { w: 560, h: 480 }
          ]
        };
        
        const presetSizes = sizePresets[id] || sizePresets.default;
        const currentSize = sizes[id];
        
        // Find the closest size using the same logic as resizeWidget
        let closestIndex = 0;
        let minDiff = Infinity;
        
        for (let i = 0; i < presetSizes.length; i++) {
          const diff = Math.abs(currentSize.w - presetSizes[i].w) + Math.abs(currentSize.h - presetSizes[i].h);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
        
        const sizeLabels = ['S', 'N', 'M', 'L', 'H'];
        resizeBtn.textContent = sizeLabels[closestIndex];
        resizeBtn.setAttribute('title', `Size: ${['Small', 'Normal', 'Medium', 'Large', 'Huge'][closestIndex]}`);
      }
    });
  });
}

// Matrix Background Logic
const matrixCanvas = document.getElementById('matrixBackground');
const matrixCtx = matrixCanvas.getContext('2d');

// Set canvas size
function resizeMatrixCanvas() {
  matrixCanvas.width = window.innerWidth;
  matrixCanvas.height = window.innerHeight;
}

// Initialize matrix canvas
resizeMatrixCanvas();
window.addEventListener('resize', resizeMatrixCanvas);

// Matrix characters
const matrixChars = '01';
const matrixFontSize = 16;
let matrixColumns = Math.floor(matrixCanvas.width / matrixFontSize);
let matrixDrops = Array(matrixColumns).fill(1);

// Draw matrix effect
function drawMatrix() {
  const theme = document.documentElement.getAttribute('data-theme') || 'matrix';
  const themeColors = {
    matrix: '#00ff00',
    cyberpunk: '#ff00ff',
    retro: '#ffb000',
    hacker: '#00ffff',
    neon: '#9d00ff'
  };
  
  matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  
  matrixCtx.fillStyle = themeColors[theme] || '#00ff00';
  matrixCtx.font = matrixFontSize + 'px Share Tech Mono';
  
  for (let i = 0; i < matrixDrops.length; i++) {
    const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
    matrixCtx.fillText(text, i * matrixFontSize, matrixDrops[i] * matrixFontSize);
    
    if (matrixDrops[i] * matrixFontSize > matrixCanvas.height && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }
    matrixDrops[i]++;
  }
}

let matrixInterval = null;

// Function to start matrix animation
function startMatrix() {
  if (!matrixInterval) {
    matrixCanvas.classList.add('visible');
    matrixInterval = setInterval(drawMatrix, 50);
  }
}

// Function to stop matrix animation
function stopMatrix() {
  if (matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
    matrixCanvas.classList.remove('visible');
  }
}

// Check online status and update matrix
function updateMatrixStatus() {
  if (navigator.onLine) {
    startMatrix();
  } else {
    stopMatrix();
  }
}

// Listen for online/offline events
window.addEventListener('online', updateMatrixStatus);
window.addEventListener('offline', updateMatrixStatus);

// Initial check
updateMatrixStatus();

// Add this function to handle file paths
async function getFileFromPath(path) {
  try {
    const response = await fetch(path);
    const blob = await response.blob();
    return new File([blob], path.split('/').pop(), { type: blob.type });
  } catch (error) {
    console.error('Error getting file:', error);
    return null;
  }
}

// Update savePlaylistData function
async function savePlaylistData() {
  const playlistData = {
    files: mediaFiles.map(file => ({
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      size: file.size,
      path: file.path || file.webkitRelativePath || file.name // Save the file path
    })),
    currentTrackIndex: currentTrackIndex,
    isPlaying: isPlaying
  };
  
  try {
    await chrome.storage.local.set({ playlistData });
  } catch (error) {
    console.error('Error saving playlist:', error);
  }
}

// Update restorePlaylistData function
async function restorePlaylistData() {
  try {
    const result = await chrome.storage.local.get('playlistData');
    const playlistData = result.playlistData;
    
    if (playlistData && playlistData.files.length > 0) {
      // Clear existing data
      mediaUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
      mediaUrls = [];
      mediaFiles = [];
      
      // Try to restore files from paths
      for (const fileData of playlistData.files) {
        try {
          const file = await getFileFromPath(fileData.path);
          if (file) {
            mediaFiles.push(file);
            mediaUrls.push(URL.createObjectURL(file));
          }
        } catch (error) {
          console.error('Error restoring file:', error);
        }
      }
      
      // Restore the playlist display
      currentTrackIndex = playlistData.currentTrackIndex;
      updatePlaylist();
      
      // Update the media name display
      if (currentTrackIndex >= 0 && currentTrackIndex < mediaFiles.length) {
        selectedMediaName.textContent = `${mediaFiles[currentTrackIndex].name} (${currentTrackIndex + 1} of ${mediaFiles.length})`;
      }
    }
  } catch (error) {
    console.error('Error restoring playlist:', error);
  }
}

// Update file selection handlers to save paths
mediaFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    // Clean up existing URLs
    mediaUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    mediaUrls = [];
    mediaFiles = [file];
    mediaUrls[0] = URL.createObjectURL(file);
    currentTrackIndex = 0;
    await playTrack(0);
    await savePlaylistData();
  }
});

folderInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'));
  if (files.length > 0) {
    // Clean up existing URLs
    mediaUrls.forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    mediaUrls = [];
    mediaFiles = files;
    // Create URLs for all files
    mediaFiles.forEach((file, index) => {
      mediaUrls[index] = URL.createObjectURL(file);
    });
    currentTrackIndex = 0;
    await playTrack(0);
    await savePlaylistData();
  }
});

// Notes Widget Logic
const notesListEl = document.getElementById('notesList');
const notesInput = document.getElementById('notesInput');
const addNoteBtn = document.getElementById('addNoteBtn');

function saveNotes(notes) {
  chrome.storage.local.set({ 'hackerNotes': notes });
}

function loadNotes() {
  return new Promise((resolve) => {
    chrome.storage.local.get('hackerNotes', (result) => {
      resolve(result.hackerNotes || []);
    });
  });
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function renderNotes() {
  const notes = await loadNotes();
  notesListEl.innerHTML = '';
  notes.forEach((note, idx) => {
    const div = document.createElement('div');
    div.className = 'note-item';
    
    const timestamp = document.createElement('div');
    timestamp.className = 'note-timestamp';
    timestamp.textContent = formatTimestamp(note.timestamp);
    
    const content = document.createElement('div');
    content.className = 'note-content';
    content.textContent = note.content;
    
    const controls = document.createElement('div');
    controls.className = 'note-controls';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.setAttribute('role', 'button');
    deleteBtn.setAttribute('tabindex', '0');
    deleteBtn.setAttribute('aria-label', 'Delete note');
    deleteBtn.textContent = 'DELETE';
    deleteBtn.onclick = async () => {
      const currentNotes = await loadNotes();
      currentNotes.splice(idx, 1);
      await saveNotes(currentNotes);
      renderNotes();
    };
    deleteBtn.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        deleteBtn.click();
      }
    };
    
    controls.appendChild(deleteBtn);
    div.appendChild(timestamp);
    div.appendChild(content);
    div.appendChild(controls);
    notesListEl.appendChild(div);
  });
}

addNoteBtn.addEventListener('click', async () => {
  const content = notesInput.value.trim();
  if (!content) return;
  const notes = await loadNotes();
  notes.unshift({
    content,
    timestamp: Date.now()
  });
  await saveNotes(notes);
  notesInput.value = '';
  renderNotes();
});

notesInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    addNoteBtn.click();
  }
});

// Initialize notes
renderNotes();

// AI Tools functionality
function initializeAITools() {
  const aiTools = document.querySelectorAll('.ai-tool');
  
  aiTools.forEach(tool => {
    tool.addEventListener('click', () => {
      const toolName = tool.dataset.tool;
      const toolUrl = getToolUrl(toolName);
      if (toolUrl) {
        window.open(toolUrl, '_blank');
      }
    });
  });
}

function getToolUrl(toolName) {
  const urls = {
    chatgpt: 'https://chat.openai.com',
    grok: 'https://grok.x.ai',
    blackbox: 'https://www.blackbox.ai',
    perplexity: 'https://www.perplexity.ai',
    gemini: 'https://gemini.google.com',
    copilot: 'https://copilot.microsoft.com',
    claude: 'https://claude.ai',
    metaai: 'https://ai.meta.com'
  };
  return urls[toolName];
}

// Initialize AI tools when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeAITools();
});

// Function to toggle AI tools visibility
function toggleAITools(show) {
  const aiToolsContainer = document.getElementById('aiToolsContainer');
  if (show) {
    aiToolsContainer.style.display = 'flex';
  } else {
    aiToolsContainer.style.display = 'none';
  }
}

// Clipboard Widget Logic
const clipboardList = document.querySelector('.clipboard-list');
const clearClipboardBtn = document.getElementById('clearClipboard');

// Save clipboard items to storage
function saveClipboardItems(items) {
  chrome.storage.local.set({ clipboardItems: items });
}

// Load clipboard items from storage
function loadClipboardItems() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['clipboardItems'], (result) => {
      resolve(result.clipboardItems || []);
    });
  });
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Create clipboard item element
function createClipboardItem(content, timestamp) {
  const item = document.createElement('div');
  item.className = 'clipboard-item';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'clipboard-content';
  contentDiv.textContent = content;
  
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'clipboard-timestamp';
  timestampDiv.textContent = formatTimestamp(timestamp);
  
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'clipboard-controls';
  
  const copyBtn = document.createElement('button');
  copyBtn.className = 'clipboard-button';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(content);
  });
  
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'clipboard-button delete';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async () => {
    const items = await loadClipboardItems();
    const updatedItems = items.filter(item => item.timestamp !== timestamp);
    saveClipboardItems(updatedItems);
    renderClipboardItems(updatedItems);
  });
  
  controlsDiv.appendChild(copyBtn);
  controlsDiv.appendChild(deleteBtn);
  
  item.appendChild(contentDiv);
  item.appendChild(timestampDiv);
  item.appendChild(controlsDiv);
  
  return item;
}

// Render clipboard items
function renderClipboardItems(items) {
  clipboardList.innerHTML = '';
  items.forEach(item => {
    const itemElement = createClipboardItem(item.content, item.timestamp);
    clipboardList.appendChild(itemElement);
  });
}

// Add new clipboard item
async function addClipboardItem(content) {
  if (!content.trim()) return;
  
  const items = await loadClipboardItems();
  const newItem = {
    content,
    timestamp: Date.now()
  };
  
  // Add new item at the beginning
  items.unshift(newItem);
  
  // Keep only the last 50 items
  if (items.length > 50) {
    items.pop();
  }
  
  saveClipboardItems(items);
  renderClipboardItems(items);
}

// Clear all clipboard items
clearClipboardBtn.addEventListener('click', async () => {
  saveClipboardItems([]);
  renderClipboardItems([]);
});

// Listen for clipboard changes
document.addEventListener('copy', async (e) => {
  const selectedText = window.getSelection().toString();
  if (selectedText) {
    await addClipboardItem(selectedText);
  }
});

// Initialize clipboard widget
async function initializeClipboardWidget() {
  const items = await loadClipboardItems();
  renderClipboardItems(items);
}

// Add clipboard widget initialization to the main initialization
document.addEventListener('DOMContentLoaded', async () => {
  await initializeWidgets();
  await initializeClipboardWidget();
});

// Function to get history suggestions
async function getHistorySuggestions(query) {
  return new Promise((resolve) => {
    chrome.history.search({
      text: query,
      maxResults: 5,
      startTime: 0
    }, (results) => {
      resolve(results.map(item => ({
        title: item.title,
        url: item.url
      })));
    });
  });
}

// Function to show suggestions
async function showSuggestions(query) {
  if (!query) {
    searchSuggestions.style.display = 'none';
    return;
  }

  const suggestions = await getHistorySuggestions(query);
  searchSuggestions.innerHTML = '';
  
  if (suggestions.length > 0) {
    suggestions.forEach(suggestion => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerHTML = `
        <div class="suggestion-title">${suggestion.title}</div>
        <div class="suggestion-url">${suggestion.url}</div>
      `;
      div.addEventListener('click', () => {
        window.location.href = suggestion.url;
      });
      searchSuggestions.appendChild(div);
    });
    searchSuggestions.style.display = 'block';
  } else {
    searchSuggestions.style.display = 'none';
  }
}

// Add input event listener for suggestions
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  showSuggestions(query);
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!searchForm.contains(e.target)) {
    searchSuggestions.style.display = 'none';
  }
}); 