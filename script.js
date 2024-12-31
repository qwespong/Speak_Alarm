let alarms = [];
let activeAlarm = null;

// Load alarms from localStorage if available
function loadAlarms() {
    const savedAlarms = localStorage.getItem('alarms');
    if (savedAlarms) {
        alarms = JSON.parse(savedAlarms);
        updateAlarmsList();
    }
}

// Save alarms to localStorage
function saveAlarms() {
    localStorage.setItem('alarms', JSON.stringify(alarms));
}

// Update clock
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('clock').textContent = timeString;
    checkAlarms(now);
}

// Check if any alarms should trigger
function checkAlarms(now) {
    const currentTime = now.toTimeString().slice(0, 5);
    alarms.forEach(alarm => {
        if (alarm.time === currentTime && alarm.enabled && !alarm.triggered) {
            triggerAlarm(alarm);
        }
    });
}

// Trigger alarm
async function triggerAlarm(alarm) {
    alarm.triggered = true;
    activeAlarm = alarm;
    
    // Play sound
    const alarmAudio = document.getElementById('alarmAudio');
    alarmAudio.src = `sounds/${alarm.sound}.mp3`;
    alarmAudio.loop = true;
    
    try {
        // Reset audio state
        alarmAudio.currentTime = 0;
        
        // Play audio
        await alarmAudio.play();
        
        // Show notification
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('Alarm', {
                    body: alarm.purpose || 'Alarm!',
                });
            }
        }

        // Show confirmation dialog
        const snoozeOrDismiss = confirm(`Alarm: ${alarm.purpose || 'Time!'}\n\nClick OK to snooze (5 minutes) or Cancel to dismiss`);
        
        // Stop audio before handling user choice
        alarmAudio.pause();
        alarmAudio.currentTime = 0;

        if (snoozeOrDismiss) {
            snoozeAlarm(alarm);
        } else {
            dismissAlarm(alarm);
        }
        
    } catch (error) {
        console.error('Error playing alarm sound:', error);
        // Still show the alarm even if sound fails
        const snoozeOrDismiss = confirm(`Alarm: ${alarm.purpose || 'Time!'}\n\nClick OK to snooze (5 minutes) or Cancel to dismiss`);
        if (snoozeOrDismiss) {
            snoozeAlarm(alarm);
        } else {
            dismissAlarm(alarm);
        }
    }
}

// Snooze alarm
function snoozeAlarm(alarm) {
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
    alarm.time = snoozeTime.toTimeString().slice(0, 5);
    alarm.triggered = false;
    updateAlarmsList();
    saveAlarms();
}

// Dismiss alarm
function dismissAlarm(alarm) {
    alarm.triggered = false;
    alarm.enabled = false;
    updateAlarmsList();
    saveAlarms();
}

// Modal functions
function openAlarmModal() {
    document.getElementById('alarmModal').style.display = 'block';
}

function closeAlarmModal() {
    document.getElementById('alarmModal').style.display = 'none';
    document.getElementById('alarmForm').reset();
}

// Handle alarm form submission
document.getElementById('alarmForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const time = document.getElementById('alarmTime').value;
    const purpose = document.getElementById('alarmPurpose').value;
    const sound = document.getElementById('alarmSound').value;

    alarms.push({
        time,
        purpose,
        sound,
        enabled: true,
        triggered: false
    });

    updateAlarmsList();
    saveAlarms();
    closeAlarmModal();
});

// Update alarms list in UI
function updateAlarmsList() {
    const alarmsList = document.getElementById('alarmsList');
    alarmsList.innerHTML = '';

    alarms.forEach((alarm, index) => {
        const alarmDiv = document.createElement('div');
        alarmDiv.className = `alarm-item ${alarm.enabled ? '' : 'disabled'}`;
        
        const alarmContent = `
            <div class="alarm-info">
                <div class="alarm-time">${alarm.time}</div>
                <div class="alarm-purpose">${alarm.purpose || 'No description'}</div>
            </div>
            <div class="alarm-controls">
                <button onclick="toggleAlarm(${index})" class="button">
                    ${alarm.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onclick="deleteAlarm(${index})" class="button">Delete</button>
            </div>
        `;
        
        alarmDiv.innerHTML = alarmContent;
        alarmsList.appendChild(alarmDiv);
    });
}

// Toggle alarm enabled/disabled
function toggleAlarm(index) {
    alarms[index].enabled = !alarms[index].enabled;
    updateAlarmsList();
    saveAlarms();
}

// Delete alarm
function deleteAlarm(index) {
    if (confirm('Are you sure you want to delete this alarm?')) {
        alarms.splice(index, 1);
        updateAlarmsList();
        saveAlarms();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('alarmModal');
    if (event.target === modal) {
        closeAlarmModal();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAlarms();
    setInterval(updateClock, 1000);
    updateClock();
    
    // Request notification permission
    if ('Notification' in window) {
        Notification.requestPermission();
    }

    // Check if sound files are accessible
    const sounds = ['beep', 'chime', 'bell'];
    sounds.forEach(sound => {
        const audio = new Audio();
        audio.src = `sounds/${sound}.mp3`;
        
        audio.onerror = () => {
            console.error(`Error loading sound file: ${sound}.mp3`);
            document.querySelector('.development-notice').innerHTML += 
                `<br>Warning: Could not load ${sound}.mp3. Make sure sound files are in the 'sounds' folder.`;
        };
    });
});