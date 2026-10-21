const wrapper = document.getElementById('quick-menu-wrapper');
const viewQuickMenu = document.getElementById('view-quickmenu');
const viewSettings = document.getElementById('view-settings');

const quickItems = Array.from(document.querySelectorAll('#menu-items .menu-item'));
const settingsTabs = Array.from(document.querySelectorAll('.set-tab'));
let optionRows = [];

let currentView = 'quickmenu';
let quickIndex = 0;
let tabIndex = 3; // default Graphics (matching exact tabs)
let optionIndex = 0;
let currentBindCat = 'general';
let audioCtx = null;
let masterSfxVolume = 1.0;

function updateSfxVolumeFromSetting(val) {
    if (!val || val === 'OFF' || val === '0%') {
        masterSfxVolume = 0;
    } else {
        const num = parseInt(val);
        masterSfxVolume = isNaN(num) ? 1.0 : (num / 100.0);
    }
}

function updateBarVisual(row, val) {
    if (!row || !val) return;
    const ticks = row.querySelectorAll('.bar-ticks span');
    if (ticks.length > 0) {
        let percent = 0;
        if (val !== 'OFF') {
            const num = parseInt(val);
            percent = isNaN(num) ? 50 : num;
        }
        const activeCount = Math.round((percent / 100) * ticks.length);
        ticks.forEach((tick, idx) => {
            if (idx < activeCount) {
                tick.style.background = '#ffffff';
                tick.style.opacity = '1';
            } else {
                tick.style.background = 'rgba(255, 255, 255, 0.2)';
                tick.style.opacity = '0.35';
            }
        });
    }

    const solidBar = row.querySelector('.bar-solid');
    if (solidBar) {
        if (val === 'OFF') {
            solidBar.style.width = '0%';
        } else {
            solidBar.style.width = '100%';
        }
    }
}

function getResourceName() {
    return (typeof GetParentResourceName === 'function') ? GetParentResourceName() : 'np-quickmenu';
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playHoverSound() {
    if (masterSfxVolume <= 0) return;
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(760, audioCtx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.08 * masterSfxVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.035);
    } catch (e) {}
}

function playSelectSound() {
    if (masterSfxVolume <= 0) return;
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, audioCtx.currentTime + 0.07);
        gain.gain.setValueAtTime(0.12 * masterSfxVolume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.07);
    } catch (e) {}
}

function setView(view) {
    currentView = view;
    if (view === 'quickmenu') {
        viewQuickMenu.classList.add('active-view');
        viewSettings.classList.remove('active-view');
    } else if (view === 'settings') {
        viewQuickMenu.classList.remove('active-view');
        viewSettings.classList.add('active-view');
        setTab(tabIndex, false);
    }
}

function setQuickActive(index, playSound = true) {
    if (index < 0) index = quickItems.length - 1;
    if (index >= quickItems.length) index = 0;
    if (quickIndex !== index && playSound) playHoverSound();

    quickIndex = index;
    quickItems.forEach((el, idx) => {
        el.classList.toggle('active', idx === quickIndex);
    });
}

const keybindsData = {
    general: [
        { action: 'Pause', primary: 'P', secondary: '' },
        { action: 'Radar Zoom / Multiplayer Information', primary: 'Z', secondary: '' },
        { action: 'Cycle Camera', primary: 'V', secondary: '' },
        { action: 'Toggle Special Ability', primary: 'Caps', secondary: '' },
        { action: 'Character Selector', primary: 'L Alt', secondary: '' },
        { action: 'Switch to Michael', primary: 'F5', secondary: '' },
        { action: 'Switch to Franklin', primary: 'F6', secondary: '' },
        { action: 'Switch to Trevor', primary: 'F7', secondary: '' },
        { action: 'Switch to GTA Online', primary: 'F8', secondary: '' },
        { action: 'Interaction Menu', primary: 'M', secondary: '' },
        { action: 'Start / Stop Recording', primary: 'F1', secondary: '' },
        { action: 'Start / Stop Action Replay Recording', primary: 'F2', secondary: '' },
        { action: 'Cancel Recording', primary: 'F3', secondary: '' },
        { action: 'Rockstar Games Overlay', primary: 'Home', secondary: '' },
        { action: 'Context Action', primary: 'E', secondary: '' }
    ],
    movement: [
        { action: 'Move Forward', primary: 'W', secondary: 'Up' },
        { action: 'Move Back', primary: 'S', secondary: 'Down' },
        { action: 'Move Left', primary: 'A', secondary: 'Left' },
        { action: 'Move Right', primary: 'D', secondary: 'Right' },
        { action: 'Jump / Climb', primary: 'Space', secondary: '' },
        { action: 'Sprint', primary: 'L Shift', secondary: '' },
        { action: 'Crouch / Stealth Mode', primary: 'L Ctrl', secondary: '' }
    ],
    combat: [
        { action: 'Aim Weapon', primary: 'RMB', secondary: '' },
        { action: 'Fire / Attack', primary: 'LMB', secondary: '' },
        { action: 'Reload', primary: 'R', secondary: '' },
        { action: 'Take Cover', primary: 'Q', secondary: '' },
        { action: 'Weapon Wheel / Radio', primary: 'Tab', secondary: '' },
        { action: 'Melee Attack', primary: 'R', secondary: '' },
        { action: 'Melee Dodge / Kick', primary: 'Space', secondary: '' }
    ],
    weapons: [
        { action: 'Select Unarmed', primary: '1', secondary: '' },
        { action: 'Select Melee', primary: '2', secondary: '' },
        { action: 'Select Shotgun', primary: '3', secondary: '' },
        { action: 'Select Heavy Weapon', primary: '4', secondary: '' },
        { action: 'Select Special / Throwable', primary: '5', secondary: '' },
        { action: 'Select Handgun', primary: '6', secondary: '' },
        { action: 'Select Submachine Gun', primary: '7', secondary: '' },
        { action: 'Select Assault Rifle', primary: '8', secondary: '' },
        { action: 'Select Sniper Rifle', primary: '9', secondary: '' }
    ],
    vehicle_gen: [
        { action: 'Enter / Exit Vehicle', primary: 'F', secondary: '' },
        { action: 'Accelerate', primary: 'W', secondary: 'Up' },
        { action: 'Brake / Reverse', primary: 'S', secondary: 'Down' },
        { action: 'Steer Left', primary: 'A', secondary: 'Left' },
        { action: 'Steer Right', primary: 'D', secondary: 'Right' },
        { action: 'Handbrake', primary: 'Space', secondary: '' },
        { action: 'Horn', primary: 'E', secondary: '' },
        { action: 'Headlights', primary: 'H', secondary: '' },
        { action: 'Next Radio Station', primary: '.', secondary: 'Wheel Up' },
        { action: 'Previous Radio Station', primary: ',', secondary: 'Wheel Down' },
        { action: 'Cinematic Camera', primary: 'R', secondary: '' }
    ],
    cars_bikes: [
        { action: 'Look Behind', primary: 'C', secondary: '' },
        { action: 'Duck In Vehicle', primary: 'X', secondary: '' },
        { action: 'Drive-By Aim', primary: 'RMB', secondary: '' },
        { action: 'Drive-By Fire', primary: 'LMB', secondary: '' },
        { action: 'Bicycle Sprint / Bunny Hop', primary: 'Caps', secondary: 'Space' }
    ],
    aircraft: [
        { action: 'Pitch Up', primary: 'Num 5', secondary: '' },
        { action: 'Pitch Down', primary: 'Num 8', secondary: '' },
        { action: 'Roll Left', primary: 'Num 4', secondary: '' },
        { action: 'Roll Right', primary: 'Num 6', secondary: '' },
        { action: 'Yaw Left / Rudder', primary: 'Q', secondary: '' },
        { action: 'Yaw Right / Rudder', primary: 'E', secondary: '' },
        { action: 'Throttle Up', primary: 'W', secondary: '' },
        { action: 'Throttle Down', primary: 'S', secondary: '' }
    ],
    submersibles: [
        { action: 'Pitch Up', primary: 'Num 5', secondary: '' },
        { action: 'Pitch Down', primary: 'Num 8', secondary: '' },
        { action: 'Ascend Submarine', primary: 'L Shift', secondary: '' },
        { action: 'Descend Submarine', primary: 'L Ctrl', secondary: '' },
        { action: 'Toggle Headlights', primary: 'H', secondary: '' }
    ],
    parachute: [
        { action: 'Deploy Parachute', primary: 'Space', secondary: 'LMB' },
        { action: 'Parachute Steer Left', primary: 'A', secondary: '' },
        { action: 'Parachute Steer Right', primary: 'D', secondary: '' },
        { action: 'Precision Landing Flare', primary: 'L Shift + L Ctrl', secondary: '' },
        { action: 'Detach Parachute', primary: 'F', secondary: '' }
    ],
    cellphone: [
        { action: 'Open Cellphone', primary: 'Up', secondary: 'M' },
        { action: 'Phone Navigate Up', primary: 'Up', secondary: '' },
        { action: 'Phone Navigate Down', primary: 'Down', secondary: '' },
        { action: 'Phone Navigate Left', primary: 'Left', secondary: '' },
        { action: 'Phone Navigate Right', primary: 'Right', secondary: '' },
        { action: 'Phone Select / Enter', primary: 'Enter', secondary: '' },
        { action: 'Phone Cancel / Back', primary: 'Backspace', secondary: 'Esc' }
    ],
    gta_online: [
        { action: 'Drop Weapon', primary: 'F9', secondary: '' },
        { action: 'Drop Ammo', primary: 'F10', secondary: '' },
        { action: 'Voice Chat Push To Talk', primary: 'N', secondary: '' },
        { action: 'Point At Target / Finger Point', primary: 'B', secondary: '' }
    ],
    gta_online_veh: [
        { action: 'Vehicle Door Control', primary: 'K', secondary: '' },
        { action: 'Vehicle Seatbelt Fasten', primary: 'B', secondary: '' },
        { action: 'Vehicle Cruise Control', primary: 'Y', secondary: '' }
    ],
    fivem: [
        { action: 'Open Chat', primary: 'T', secondary: '' },
        { action: 'VoIP Proximity Voice', primary: 'N', secondary: '' },
        { action: 'Radio Push To Talk', primary: 'Caps', secondary: '' },
        { action: 'Open Inventory', primary: 'Tab', secondary: '' },
        { action: 'Target / Eye Interaction', primary: 'L Alt', secondary: '' },
        { action: 'Cycle Voice Range', primary: 'F11', secondary: '' },
        { action: 'Scoreboard / Player List', primary: 'U', secondary: '' }
    ],
    restore: [
        { action: 'Restore All Default Keybinds', primary: 'Enter', secondary: '' }
    ]
};

function renderKeybinds(catKey) {
    const tableBody = document.getElementById('binds-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    const binds = keybindsData[catKey] || keybindsData['general'];
    binds.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'bind-table-row' + (idx === 0 ? ' active-bind' : '');
        row.innerHTML = `
            <div class="td-action">${item.action}</div>
            <div class="td-primary">${item.primary ? `<span class="table-keycap">${item.primary}</span>` : ''}</div>
            <div class="td-secondary">${item.secondary ? `<span class="table-keycap">${item.secondary}</span>` : ''}</div>
        `;
        row.addEventListener('mouseenter', () => {
            document.querySelectorAll('.bind-table-row').forEach(r => r.classList.remove('active-bind'));
            row.classList.add('active-bind');
        });
        tableBody.appendChild(row);
    });
}

function updateOptionRows() {
    optionRows = Array.from(document.querySelectorAll('.tab-page.active-page .option-row:not(.disabled-opt)'));
    if (optionRows.length > 0) {
        if (optionIndex >= optionRows.length) optionIndex = 0;
        setOptionActive(optionIndex, false);
    }
}

function setTab(index, playSound = true) {
    if (settingsTabs.length === 0) return;
    if (index < 0) index = settingsTabs.length - 1;
    if (index >= settingsTabs.length) index = 0;
    if (tabIndex !== index && playSound) playHoverSound();

    tabIndex = index;
    settingsTabs.forEach((tab, idx) => {
        tab.classList.toggle('active', idx === tabIndex);
    });

    const targetTab = settingsTabs[tabIndex].getAttribute('data-tab');
    document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active-page'));

    const pageMap = {
        'game': 'page-game',
        'audio': 'page-audio',
        'display': 'page-display',
        'graphics': 'page-graphics',
        'voice': 'page-voice',
        'mouse': 'page-mouse',
        'keybinds': 'page-keybinds'
    };

    const targetPageId = pageMap[targetTab] || 'page-graphics';
    const page = document.getElementById(targetPageId);
    if (page) page.classList.add('active-page');

    if (targetTab === 'keybinds') {
        renderKeybinds(currentBindCat);
    }

    optionIndex = 0;
    updateOptionRows();
}

function updatePreview(row) {
    const activePage = document.querySelector('.tab-page.active-page');
    if (!activePage) return;
    const titleEl = activePage.querySelector('.preview-title');
    const descEl = activePage.querySelector('.preview-description');
    const label = row.getAttribute('data-title') || row.querySelector('.opt-label')?.textContent || 'SETTING';
    const desc = row.getAttribute('data-desc') || 'Adjust setting configuration.';
    if (titleEl) titleEl.textContent = label;
    if (descEl) descEl.textContent = desc;
}

function setOptionActive(index, playSound = true) {
    if (optionRows.length === 0) return;
    if (index < 0) index = optionRows.length - 1;
    if (index >= optionRows.length) index = 0;
    if (optionIndex !== index && playSound) playHoverSound();

    optionIndex = index;
    optionRows.forEach((row, idx) => {
        const isActive = (idx === optionIndex);
        row.classList.toggle('active-opt', isActive);
        if (isActive) updatePreview(row);
    });
}

let initialSettings = {};
let hasUnsavedChanges = false;

function checkUnsavedChanges() {
    let changed = false;
    const allOptions = document.querySelectorAll('.option-row[data-key]');
    allOptions.forEach(row => {
        const k = row.getAttribute('data-key');
        const valEl = row.querySelector('.opt-val');
        if (k && valEl) {
            const cur = valEl.textContent.trim();
            if (initialSettings[k] !== undefined && initialSettings[k] !== cur) {
                changed = true;
            }
        }
    });

    hasUnsavedChanges = changed;
    const btn = document.getElementById('apply-settings-btn');
    const divider = document.getElementById('apply-divider');
    if (btn) btn.classList.toggle('hidden', !hasUnsavedChanges);
    if (divider) divider.classList.toggle('hidden', !hasUnsavedChanges);
}

function captureInitialSettings() {
    initialSettings = {};
    const allOptions = document.querySelectorAll('.option-row[data-key]');
    allOptions.forEach(row => {
        const k = row.getAttribute('data-key');
        const valEl = row.querySelector('.opt-val');
        if (k && valEl) {
            initialSettings[k] = valEl.textContent.trim();
        }
    });
    hasUnsavedChanges = false;
    const btn = document.getElementById('apply-settings-btn');
    const divider = document.getElementById('apply-divider');
    if (btn) btn.classList.add('hidden');
    if (divider) divider.classList.add('hidden');
}

function cycleOptionValue(row, direction = 1) {
    const action = row.getAttribute('data-action');
    if (action) {
        triggerQuickAction(action);
        return;
    }

    const valuesStr = row.getAttribute('data-values');
    if (!valuesStr) return;
    const values = valuesStr.split(',').map(s => s.trim());
    if (values.length <= 1) return;

    const valEl = row.querySelector('.opt-val');
    if (!valEl) return;
    const currentVal = valEl.textContent.trim();
    let currentIdx = values.indexOf(currentVal);
    if (currentIdx === -1) currentIdx = 0;

    let nextIdx = currentIdx + direction;
    if (nextIdx >= values.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = values.length - 1;

    const newVal = values[nextIdx];
    valEl.textContent = newVal;
    updateBarVisual(row, newVal);

    const key = row.getAttribute('data-key');
    if (key === 'sfx_vol') {
        updateSfxVolumeFromSetting(newVal);
    }

    playSelectSound();
    checkUnsavedChanges();

    if (key) {
        const res = getResourceName();
        fetch('https://' + res + '/save_setting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, value: newVal })
        }).catch(() => {});
    }
}

function closeMenu() {
    wrapper.classList.remove('visible');
    const res = getResourceName();
    fetch('https://' + res + '/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    }).catch(() => {});
}

function triggerQuickAction(action) {
    playSelectSound();
    if (action === 'settings') {
        setView('settings');
        return;
    }

    wrapper.classList.remove('visible');
    const res = getResourceName();
    fetch('https://' + res + '/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action })
    }).catch(() => {});
}

// Quick menu clicks
quickItems.forEach((item, idx) => {
    item.addEventListener('mouseenter', () => setQuickActive(idx));
    item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = item.getAttribute('data-action');
        triggerQuickAction(action);
    });
});

// Settings top tab clicks
settingsTabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => setTab(idx));
});

document.getElementById('prev-tab')?.addEventListener('click', () => setTab(tabIndex - 1));
document.getElementById('next-tab')?.addEventListener('click', () => setTab(tabIndex + 1));

// Bind Categories click listener
document.addEventListener('click', (e) => {
    const bindCat = e.target.closest('.bind-cat-item');
    if (bindCat) {
        document.querySelectorAll('.bind-cat-item').forEach(c => c.classList.remove('active'));
        bindCat.classList.add('active');
        const catKey = bindCat.getAttribute('data-bindcat');
        currentBindCat = catKey;
        playHoverSound();
        renderKeybinds(catKey);
    }
});

// Option row interactions and click delegation
document.addEventListener('click', (e) => {
    const prevBtn = e.target.closest('.btn-prev');
    const nextBtn = e.target.closest('.btn-next');
    const row = e.target.closest('.option-row:not(.disabled-opt)');

    if (prevBtn && row) {
        e.stopPropagation();
        cycleOptionValue(row, -1);
        return;
    }
    if (nextBtn && row) {
        e.stopPropagation();
        cycleOptionValue(row, 1);
        return;
    }
    if (row) {
        const idx = optionRows.indexOf(row);
        if (idx !== -1) setOptionActive(idx);
        cycleOptionValue(row, 1);
    }
});

document.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.option-row:not(.disabled-opt)');
    if (row && optionRows.includes(row)) {
        const idx = optionRows.indexOf(row);
        if (idx !== -1 && idx !== optionIndex) {
            setOptionActive(idx);
        }
    }
});

function applyAllSettings() {
    if (!hasUnsavedChanges) return;
    playSelectSound();
    const btn = document.getElementById('apply-settings-btn');
    if (btn) {
        btn.classList.add('apply-flash');
        setTimeout(() => btn.classList.remove('apply-flash'), 400);
    }

    const allOptions = document.querySelectorAll('.option-row[data-key]');
    const settingsObj = {};
    allOptions.forEach(row => {
        const k = row.getAttribute('data-key');
        const valEl = row.querySelector('.opt-val');
        if (k && valEl) {
            const v = valEl.textContent.trim();
            settingsObj[k] = v;
            initialSettings[k] = v;
        }
    });

    hasUnsavedChanges = false;
    setTimeout(() => {
        const btn = document.getElementById('apply-settings-btn');
        const divider = document.getElementById('apply-divider');
        if (btn) btn.classList.add('hidden');
        if (divider) divider.classList.add('hidden');
    }, 450);

    const res = getResourceName();
    fetch('https://' + res + '/apply_all_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsObj })
    }).catch(() => {});
}

// Apply settings button click
document.getElementById('apply-settings-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    applyAllSettings();
});

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
    if (!wrapper.classList.contains('visible')) return;

    if (currentView === 'quickmenu') {
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            setQuickActive(quickIndex - 1);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            setQuickActive(quickIndex + 1);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const action = quickItems[quickIndex].getAttribute('data-action');
            triggerQuickAction(action);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
        }
    } else if (currentView === 'settings') {
        if (e.code === 'Space' || e.key === ' ') {
            if (hasUnsavedChanges) {
                e.preventDefault();
                applyAllSettings();
            }
        } else if (e.key === 'q' || e.key === 'Q') {
            e.preventDefault();
            setTab(tabIndex - 1);
        } else if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            setTab(tabIndex + 1);
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            setOptionActive(optionIndex - 1);
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            e.preventDefault();
            setOptionActive(optionIndex + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            if (optionRows[optionIndex]) cycleOptionValue(optionRows[optionIndex], -1);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'Enter') {
            e.preventDefault();
            if (optionRows[optionIndex]) cycleOptionValue(optionRows[optionIndex], 1);
        } else if (e.key === 'Escape' || e.key === 'Backspace') {
            e.preventDefault();
            playSelectSound();
            setView('quickmenu');
        }
    }
});

function detectHardware(resX, resY) {
    let gpuName = null;
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const unmasked = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (unmasked) {
                    const m = unmasked.match(/(NVIDIA\s+GeForce\s+[^,()]+|NVIDIA\s+RTX\s+[^,()]+|NVIDIA\s+GTX\s+[^,()]+|AMD\s+Radeon\s+[^,()]+|Radeon\s+[^,()]+|Intel\s+[^,()]+|GeForce\s+[^,()]+)/i);
                    if (m) {
                        gpuName = m[0].trim().toUpperCase();
                    } else {
                        gpuName = unmasked.replace(/ANGLE\s*\(/i, '').replace(/,.*$/, '').trim().toUpperCase();
                    }
                }
            }
        }
    } catch (e) {
        console.error('GPU detection error:', e);
    }

    let totalVram = 24;
    let displayName = gpuName || 'NVIDIA GEFORCE RTX 4090';

    if (gpuName) {
        if (/4090|3090|7900/i.test(gpuName)) totalVram = 24;
        else if (/4080|7900\s*XT/i.test(gpuName)) totalVram = 16;
        else if (/4070|3080|6800/i.test(gpuName)) totalVram = 12;
        else if (/4060|3070|3060|6700/i.test(gpuName)) totalVram = 8;
        else if (/2060|1660|1060/i.test(gpuName)) totalVram = 6;
        else if (/1050|1650/i.test(gpuName)) totalVram = 4;
    }

    const usedVram = (totalVram * 0.413).toFixed(2);
    const percent = 41;

    const usedEl = document.getElementById('vram-used-text');
    const totalEl = document.getElementById('vram-total-text');
    const barEl = document.getElementById('vram-bar-fill');
    const adapterEl = document.getElementById('output-adapter-val');
    if (usedEl) usedEl.textContent = `${usedVram} GB`;
    if (totalEl) totalEl.textContent = `${totalVram} GB`;
    if (barEl) barEl.style.width = `${percent}%`;
    if (adapterEl) adapterEl.textContent = displayName;

    const width = resX || window.screen.width || 3840;
    const height = resY || window.screen.height || 2160;
    const resString = `${width}X${height}`;
    const resRow = document.querySelector('[data-key="resolution"] .opt-val');
    if (resRow) resRow.textContent = resString;
}

// NUI Messages
window.addEventListener('message', (e) => {
    const data = e.data;
    if (!data) return;

    if (data.action === 'set_sfx_volume') {
        masterSfxVolume = typeof data.volume === 'number' ? data.volume : 1.0;
    } else if (data.action === 'open') {
        detectHardware(data.resX, data.resY);
        if (data.settings) {
            for (const [k, v] of Object.entries(data.settings)) {
                const optEl = document.querySelector(`.option-row[data-key="${k}"] .opt-val`);
                const row = document.querySelector(`.option-row[data-key="${k}"]`);
                if (optEl && v) {
                    optEl.textContent = v;
                    if (row) updateBarVisual(row, v);
                }
            }
            if (data.settings.sfx_vol) {
                updateSfxVolumeFromSetting(data.settings.sfx_vol);
            }
        }
        captureInitialSettings();
        wrapper.classList.add('visible');
        setView('quickmenu');
        setQuickActive(0, false);
    } else if (data.action === 'close') {
        wrapper.classList.remove('visible');
    }
});

// Initial hardware check
setTimeout(detectHardware, 100);