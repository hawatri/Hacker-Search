// Search logic
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const tags = document.querySelectorAll('.tag');

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
  if (searchEngines[first]) {
    return {
      engine: first,
      query: parts.slice(1).join(' ')
    };
  }
  return {
    engine: selectedEngine,
    query: input.trim()
  };
}

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const input = searchInput.value.trim();
  if (!input) return;
  const { engine, query } = parseInput(input);
  if (!query) return;
  const url = searchEngines[engine](query);
  window.location.href = url;
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
    isDragging = true;
    const rect = dragElement.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
      // Save position when dragging ends
      saveWidgetPosition(dragElement);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let left = e.clientX - offsetX;
    let top = e.clientY - offsetY;
    const maxLeft = window.innerWidth - dragElement.offsetWidth;
    const maxTop = window.innerHeight - dragElement.offsetHeight;
    if (left < 0) left = 0;
    if (top < 0) top = 0;
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;
    dragElement.style.left = left + 'px';
    dragElement.style.top = top + 'px';
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
  'mediaController',
  'musicPlayer'
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
    chrome.storage.local.get(['widgetPositions', 'widgetStates'], (result) => {
      const positions = result.widgetPositions || {};
      const states = result.widgetStates || {};
      
      widgets.forEach(id => {
        const widget = document.getElementById(id);
        // Restore position
        if (positions[id]) {
          widget.style.left = positions[id].left;
          widget.style.top = positions[id].top;
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

  // Small delay to ensure smooth transition
  await new Promise(resolve => setTimeout(resolve, 50));

  // Show widgets with fade-in effect
  widgets.forEach(id => {
    const widget = document.getElementById(id);
    widget.classList.remove('loading');
    widget.style.visibility = 'visible';
    widget.style.opacity = '1';
  });
}

// Focus management
function ensureSearchFocus() {
  // Direct DOM manipulation to ensure focus
  searchInput.style.display = 'none';
  searchInput.offsetHeight; // Force reflow
  searchInput.style.display = '';
  searchInput.focus();
  searchInput.select();
}

// Initialize on page load
window.addEventListener('load', () => {
  initializeWidgets();
  restoreSelectedEngine();
  restoreClockState();
  loadSettings();
  setInterval(updateClocks, 1000);
  updateClocks();
  
  // Immediate focus attempt
  ensureSearchFocus();

  // Multiple delayed focus attempts
  [100, 500, 1000, 2000].forEach(delay => {
    setTimeout(ensureSearchFocus, delay);
  });

  // Handle visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      ensureSearchFocus();
    }
  });

  // Handle window focus
  window.addEventListener('focus', ensureSearchFocus);

  // Handle any click on the page
  document.addEventListener('click', (e) => {
    if (e.target !== searchInput) {
      ensureSearchFocus();
    }
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
    weatherLocation: weatherLocation.value.trim()
  };
  
  chrome.storage.local.set({ settings }, () => {
    currentTimezone = settings.timezone;
    updateClocks();
    if (settings.weatherLocation) {
      fetchWeather(settings.weatherLocation);
    }
  });
}

// Function to load settings
function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
      const settings = result.settings;
      
      // Set timezone
      if (settings.timezone) {
        timezoneSelect.value = settings.timezone;
        currentTimezone = settings.timezone;
      }
      
      // Set weather location
      if (settings.weatherLocation) {
        weatherLocation.value = settings.weatherLocation;
        fetchWeather(settings.weatherLocation);
      }
      
      updateClocks();
    }
  });
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

// Media Controller Logic
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');

playBtn.addEventListener('click', () => {
  audioPlayer.play();
});
pauseBtn.addEventListener('click', () => {
  audioPlayer.pause();
});
stopBtn.addEventListener('click', () => {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
});

// Resize logic
function resizeWidget(widget) {
  const currentWidth = widget.offsetWidth;
  const currentHeight = widget.offsetHeight;
  // Cycle sizes: small, medium, large
  const sizes = [
    { w: 240, h: 180 },
    { w: 320, h: 240 },
    { w: 400, h: 320 }
  ];
  let nextSizeIndex = 0;
  for (let i = 0; i < sizes.length; i++) {
    if (Math.abs(currentWidth - sizes[i].w) < 10 && Math.abs(currentHeight - sizes[i].h) < 10) {
      nextSizeIndex = (i + 1) % sizes.length;
      break;
    }
  }
  widget.style.width = sizes[nextSizeIndex].w + 'px';
  widget.style.height = sizes[nextSizeIndex].h + 'px';
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
  matrixCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  
  matrixCtx.fillStyle = '#00ff00';
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