// YouTube API Key Management
let apiKey = localStorage.getItem('youtubeApiKey') || '';

// Load API key from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    if (apiKey) {
        document.getElementById('apiKey').value = apiKey;
    }
    
    // Initialize duration button listeners
    setupDurationButtons();
    // Initialize API key toggle button
    const toggleBtn = document.getElementById('toggleApiKey');
    const apiInput = document.getElementById('apiKey');
    if (toggleBtn && apiInput) {
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Re-query the input in case it was replaced
            let input = document.getElementById('apiKey');
            if (!input) return;

            const isPassword = input.getAttribute('type') === 'password' || input.type === 'password';

            if (isPassword) {
                // show
                try {
                    input.type = 'text';
                    input.setAttribute('type', 'text');
                } catch (err) {
                    // Some browsers may block dynamic type changes; fallback to replacing the element
                    const replacement = document.createElement('input');
                    replacement.type = 'text';
                    replacement.id = input.id;
                    replacement.className = input.className;
                    replacement.placeholder = input.placeholder;
                    replacement.value = input.value;
                    input.parentNode.replaceChild(replacement, input);
                }
                toggleBtn.textContent = 'Hide';
            } else {
                // hide
                try {
                    input.type = 'password';
                    input.setAttribute('type', 'password');
                } catch (err) {
                    // Fallback: replace input with password-type element
                    const replacement = document.createElement('input');
                    replacement.type = 'password';
                    replacement.id = input.id;
                    replacement.className = input.className;
                    replacement.placeholder = input.placeholder;
                    replacement.value = input.value;
                    input.parentNode.replaceChild(replacement, input);
                }
                toggleBtn.textContent = 'Show';
            }
        });
    }
});

// Save API Key
document.getElementById('saveApiKey').addEventListener('click', () => {
    const keyInput = document.getElementById('apiKey');
    apiKey = keyInput.value.trim();
    
    if (!apiKey) {
        alert('Please enter an API key');
        return;
    }
    
    localStorage.setItem('youtubeApiKey', apiKey);
    alert('API key saved successfully!');
});

// Session message helpers
function showSessionMessage(message, type = 'warning') {
    let container = document.getElementById('sessionMessage');
    if (!container) {
        const stats = document.getElementById('sessionStats');
        container = document.createElement('div');
        container.id = 'sessionMessage';
        container.style.marginTop = '12px';
        stats.parentNode.insertBefore(container, stats.nextSibling);
    }

    container.className = type === 'warning' ? 'warning' : 'note';
    container.textContent = message;
}

function clearSessionMessage() {
    const container = document.getElementById('sessionMessage');
    if (container) container.remove();
}

// Duration Button Management
function setupDurationButtons() {
    const durationButtons = document.querySelectorAll('.duration-btn');
    const durationInput = document.getElementById('watchDuration');
    const durationInfo = document.getElementById('durationInfo');
    
    const durationInfo_map = {
        '30': '30 sec = Minimal footprint, counts as view only',
        '120': '2 min = Balanced signal, moderate algorithm impact',
        '180': '3 min = Strong signal, clear diversity indicator',
        '300': '5 min = Extreme signal, heavy algorithm pollution'
    };
    
    durationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            durationButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked button
            btn.classList.add('active');
            
            const duration = btn.getAttribute('data-duration');
            durationInput.value = duration;
            durationInfo.textContent = durationInfo_map[duration];
        });
    });
    
    // Update info when input changes manually
    durationInput.addEventListener('change', () => {
        const value = durationInput.value;
        durationButtons.forEach(b => b.classList.remove('active'));
        
        const matchingBtn = document.querySelector(`.duration-btn[data-duration="${value}"]`);
        if (matchingBtn) {
            matchingBtn.classList.add('active');
            durationInfo.textContent = durationInfo_map[value];
        } else {
            durationInfo.textContent = `Custom: ${value} sec = Manual algorithm strategy`;
        }
    });
}

// Mode Selection
let currentMode = 'topics';
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.getAttribute('data-mode');
        
        // Show/hide topics section based on mode
        if (currentMode === 'topics') {
            document.getElementById('topicsSection').style.display = 'block';
        } else if (currentMode === 'garth') {
            document.getElementById('topicsSection').style.display = 'block';
            const desc = document.getElementById('garthModeDesc');
            desc.style.display = 'block';
        } else {
            document.getElementById('topicsSection').style.display = 'none';
            document.getElementById('garthModeDesc').style.display = 'none';
        }
    });
});

// Wheel Toggle Button
document.getElementById('toggleWheel').addEventListener('click', () => {
    const wheelSection = document.getElementById('wheelSection');
    if (wheelSection) {
        const isVisible = wheelSection.style.display !== 'none';
        wheelSection.style.display = isVisible ? 'none' : 'block';
        document.getElementById('toggleWheel').textContent = isVisible ? 'Random Generator' : 'Hide Generator';
    }
});

// Topics Management
let topics = [];

document.getElementById('addTopic').addEventListener('click', () => {
    const input = document.getElementById('topicInput');
    const topic = input.value.trim();
    
    if (topic && !topics.includes(topic)) {
        topics.push(topic);
        updateTopicsList();
        input.value = '';
    }
});

document.getElementById('topicInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('addTopic').click();
    }
});

function updateTopicsList() {
    const topicsList = document.getElementById('topicsList');
    topicsList.innerHTML = topics.map((topic, index) => `
        <div class="topic-tag">
            ${topic}
            <button onclick="removeTopic(${index})">X</button>
        </div>
    `).join('');
}

function removeTopic(index) {
    topics.splice(index, 1);
    updateTopicsList();
}

// Preset Topics
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-topic');
        if (!topics.includes(topic)) {
            topics.push(topic);
            updateTopicsList();
        }
    });
});

// Session Management
let isSessionActive = false;
let sessionQueue = [];
let currentVideoIndex = 0;

document.getElementById('startSession').addEventListener('click', startSession);
document.getElementById('stopSession').addEventListener('click', stopSession);

async function startSession() {
    // Refresh API key from input (in case user typed but didn't click Save)
    apiKey = document.getElementById('apiKey').value.trim();

    // Validate API key before starting
    if (!apiKey) {
        document.getElementById('sessionStatus').textContent = 'Missing API Key';
        showSessionMessage('You must provide a valid YouTube Data API v3 key before starting a session. Click "How to get an API key?" for instructions.');
        return;
    }

    if (currentMode === 'topics' && topics.length === 0) {
        alert('Please add at least one topic!');
        return;
    }
    
    isSessionActive = true;
    document.getElementById('startSession').disabled = true;
    document.getElementById('stopSession').disabled = false;
    document.getElementById('sessionStatus').textContent = 'Starting...';
    
    const videoCount = parseInt(document.getElementById('videoCount').value) || 5;
    const watchDuration = parseInt(document.getElementById('watchDuration').value) || 30;
    const stealthMode = document.getElementById('stealthMode').checked;
    const autoSkip = document.getElementById('autoSkip').checked;
    const openInNewTab = document.getElementById('openInNewTab').checked;
    
    sessionQueue = [];
    currentVideoIndex = 0;
    document.getElementById('videoQueue').innerHTML = '';
    
    try {
        // Generate search queries based on mode
        let searchQueries = [];
        
        if (currentMode === 'topics') {
            searchQueries = topics;
        } else if (currentMode === 'random') {
            searchQueries = generateRandomQueries(videoCount);
        } else if (currentMode === 'hybrid') {
            searchQueries = [...topics, ...generateRandomQueries(Math.ceil(videoCount / 2))];
        } else if (currentMode === 'garth') {
            searchQueries = generateGarthQueries(videoCount);
        }
        
        document.getElementById('sessionStatus').textContent = 'Fetching videos...';
        clearSessionMessage();
        // Search for videos - use simpler approach with direct YouTube search
        for (const query of searchQueries) {
            if (!isSessionActive) break;
            
            try {
                const videos = await searchYouTubeAPI(query, videoCount);
                sessionQueue.push(...videos.slice(0, videoCount - sessionQueue.length));
                
                if (sessionQueue.length >= videoCount) break;
            } catch (error) {
                console.warn(`Error searching for "${query}":`, error);
                // Continue with other queries
            }
        }
        
        if (sessionQueue.length === 0) {
            throw new Error('No videos found. Check your API key and internet connection.');
        }
        
        document.getElementById('videosQueued').textContent = sessionQueue.length;
        document.getElementById('sessionStatus').textContent = `Playing (1/${sessionQueue.length})`;
        
        // Play videos sequentially
        playNextVideo(watchDuration, stealthMode, openInNewTab, autoSkip);
        
    } catch (error) {
        console.error('Session error:', error);
        document.getElementById('sessionStatus').textContent = 'Error';
        showSessionMessage('Session error: ' + (error && error.message ? error.message : String(error)), 'warning');
        stopSession();
    }
}

function playNextVideo(watchDuration, stealthMode, openInNewTab, autoSkip) {
    if (!isSessionActive || currentVideoIndex >= sessionQueue.length) {
        if (isSessionActive) {
            document.getElementById('sessionStatus').textContent = 'Complete!';
            stopSession();
        }
        return;
    }
    
    const video = sessionQueue[currentVideoIndex];
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    
    // Update status
    document.getElementById('sessionStatus').textContent = `Playing (${currentVideoIndex + 1}/${sessionQueue.length})`;
    
    // Show video in popup for stealth mode
    if (stealthMode) {
        showVideoPopup(video);
        
        // Play in hidden iframe with realistic watch pattern
        const watchPattern = generateRealisticWatchPattern(watchDuration);
        const totalWatchTime = watchPattern.reduce((sum, seg) => sum + seg.duration, 0);
        
        playVideoInIframeWithPattern(video.id, watchPattern, () => {
            closeVideoPopup();
            currentVideoIndex++;
            playNextVideo(watchDuration, stealthMode, openInNewTab, autoSkip);
        });
    } else {
        // Open in tab
        if (openInNewTab) {
            showVideoPopup(video);
            window.open(videoUrl, '_blank');
        } else {
            showVideoPopup(video);
            window.location.href = videoUrl;
        }
        
        // If opening in new tab, show the video in queue and wait
        addVideoToQueue(video);
        
        // Schedule next video with slight randomness
        const randomFactor = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
        const adjustedDuration = watchDuration * randomFactor * 1000;
        
        setTimeout(() => {
            currentVideoIndex++;
            playNextVideo(watchDuration, stealthMode, openInNewTab, autoSkip);
        }, adjustedDuration);
    }
    
    addVideoToQueue(video);
}

function showVideoPopup(video) {
    const popup = document.getElementById('videoPopup');
    const popupTitle = document.getElementById('popupTitle');
    const popupVideo = document.getElementById('popupVideo');
    
    popupTitle.textContent = `Now Playing: ${video.title}`;
    popupVideo.src = `https://www.youtube.com/embed/${video.id}?autoplay=1`;
    popup.style.display = 'block';
}

function closeVideoPopup() {
    const popup = document.getElementById('videoPopup');
    popup.style.display = 'none';
}

function stopSession() {
    isSessionActive = false;
    document.getElementById('startSession').disabled = false;
    document.getElementById('stopSession').disabled = true;
    if (document.getElementById('sessionStatus').textContent !== 'Complete!') {
        document.getElementById('sessionStatus').textContent = 'Stopped';
    }
}

async function searchYouTubeAPI(query, maxResults = 5) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}&regionCode=US`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            // Try to extract a useful error message from the API
            let errMsg = `API error: ${response.status}`;
            try {
                const errJson = await response.json();
                if (errJson && errJson.error && errJson.error.message) {
                    errMsg = errJson.error.message + ` (status ${response.status})`;
                }
            } catch (e) {
                // ignore JSON parse errors
            }

            if (response.status === 403) {
                errMsg = errMsg + ' — possible invalid key or quota exceeded.';
            }

            throw new Error(errMsg);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'YouTube API error');
        }
        
        if (!data.items || data.items.length === 0) {
            return [];
        }
        
        return data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.default.url
        }));
    } catch (error) {
        console.error('YouTube API search error:', error);
        throw error;
    }
}

function playVideoInIframe(videoId, duration, onComplete) {
    const container = document.getElementById('stealthContainer');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`;
    iframe.width = '0';
    iframe.height = '0';
    iframe.style.display = 'none';
    iframe.style.border = 'none';
    container.appendChild(iframe);
    
    setTimeout(() => {
        iframe.remove();
        if (onComplete) onComplete();
    }, duration * 1000);
}

function addVideoToQueue(video) {
    const queue = document.getElementById('videoQueue');
    const existingItems = queue.querySelectorAll('.video-item').length;
    
    // Only show last 10 items
    if (existingItems >= 10) {
        queue.lastChild.remove();
    }
    
    const item = document.createElement('div');
    item.className = 'video-item';
    item.innerHTML = `
        <span class="video-title">${video.title.substring(0, 50)}...</span>
        <span style="color: var(--text-secondary); font-size: 0.85em;">${new Date().toLocaleTimeString()}</span>
    `;
    queue.insertBefore(item, queue.firstChild);
}

function generateRandomQueries(count) {
    const randomTopics = [
        'random viral video', 'interesting facts', 'trending',
        'funny videos', 'educational content', 'music',
        'nature documentary', 'technology news', 'gaming',
        'cooking tutorial', 'fitness', 'art', 'comedy',
        'animals', 'space', 'history', 'science',
        'motivation', 'ASMR', 'travel', 'cars'
    ];
    
    const queries = [];
    for (let i = 0; i < count; i++) {
        const topic = randomTopics[Math.floor(Math.random() * randomTopics.length)];
        // Add randomness to query
        queries.push(`${topic} ${Math.floor(Math.random() * 100)}`);
    }
    return queries;
}

function generateGarthQueries(count) {
    const garthTopics = [
        'supernatural occurrences', 'monstrous afflictions', 'armed doctors',
        'pseudo philosophy', 'horror anthology', 'dark comedy',
        'strange phenomena', 'unexplained events', 'paranormal',
        'creepy atmosphere', 'horror fiction', 'weird',
        'obscure horror', 'low budget horror', 'cult films',
        'mysterious', 'unsettling', 'eerie', 'ominous', 'dread'
    ];
    
    const queries = [];
    for (let i = 0; i < count; i++) {
        const topic = garthTopics[Math.floor(Math.random() * garthTopics.length)];
        queries.push(topic);
    }
    return queries;
}

// ===== SPINNING WHEEL RANDOMIZER =====
const wheelAdjectives = ['peaceful', 'serene', 'gentle', 'quiet', 'soft', 'smooth', 'light', 'delicate', 'tender', 'soothing', 'calm', 'relaxed', 'dreamy', 'slow', 'subtle', 'muted', 'mellow', 'warm', 'cozy', 'comfortable', 'pleasant', 'nice', 'lovely', 'beautiful', 'pretty', 'cute', 'sweet', 'kind', 'caring', 'loving', 'mild', 'whispered', 'silent', 'hushed', 'tranquil', 'ethereal', 'misty', 'hazy', 'soft-spoken', 'fragile', 'fleeting', 'ephemeral', 'timeless', 'eternal', 'infinite', 'boundless', 'weird', 'odd', 'surreal', 'unsettling', 'bizarre', 'cryptic', 'eerie', 'obscure', 'abstract', 'mysterious', 'chaotic', 'hypnotic', 'trippy', 'sinister', 'uncanny', 'quirky', 'esoteric', 'arcane', 'nebulous', 'random', 'wacky', 'funky', 'zany', 'goofy', 'silly', 'absurd', 'creepy', 'groovy', 'gnarly', 'sick', 'dope', 'crazy', 'insane', 'wild', 'mad', 'bonkers', 'loopy', 'unhinged', 'twisted', 'warped', 'bent', 'skewed', 'sideways', 'backwards'];

const wheelNouns = ['clouds', 'rocks', 'gardens', 'coffee', 'books', 'mirrors', 'shadows', 'memories', 'moments', 'thoughts', 'feelings', 'echoes', 'whispers', 'melodies', 'rhythms', 'patterns', 'silhouettes', 'conversations', 'stories', 'dreams', 'journeys', 'paths', 'doors', 'windows', 'bridges', 'staircases', 'hallways', 'rooms', 'spaces', 'places', 'colors', 'shapes', 'forms', 'dances', 'movements', 'voices', 'sounds', 'music', 'silence', 'hours', 'days', 'seasons', 'stars', 'moonlight', 'sunlight', 'rain', 'snow', 'wind', 'breeze', 'mist', 'fog', 'steam', 'waves', 'streams', 'rivers', 'oceans', 'deserts', 'forests', 'mountains', 'valleys', 'caves', 'tunnels', 'theaters', 'libraries', 'museums', 'festivals', 'ceremonies', 'rituals', 'traditions', 'cycles', 'vibrations', 'harmonies', 'hymns', 'chants', 'bells', 'candles', 'lanterns', 'embers', 'flames', 'light', 'darkness', 'dusk', 'dawn', 'twilight', 'midnight', 'noon', 'morning', 'evening', 'night', 'creatures', 'phenomena', 'events', 'compilations', 'footage', 'artifacts', 'mysteries', 'anomalies', 'specimens', 'synergies', 'entities', 'glitches', 'coincidences', 'frequencies', 'dimensions', 'realms', 'videos', 'clips', 'streams', 'movies', 'shows', 'cats', 'dogs', 'birds', 'bugs', 'machines', 'inventions', 'gadgets', 'contraptions', 'tutorials', 'fails', 'stunts', 'tricks', 'pranks', 'challenges', 'experiments', 'tests', 'reviews', 'breakdowns', 'history', 'conspiracy', 'art', 'dance', 'cooking', 'painting', 'building', 'crafting', 'fixing', 'destroying', 'grasshoppers', 'skin cells', 'pencils', 'socks', 'lightbulbs', 'staplers', 'door handles', 'rubber ducks', 'shoelaces', 'paperclips', 'thumb tacks', 'lint', 'dust bunnies', 'bottle caps', 'twist ties', 'buttons', 'safety pins', 'clothespins', 'nails', 'screws', 'bolts', 'washers', 'hinges', 'doorknobs', 'coat hangers', 'wire hangers', 'paperweights', 'bookmarks', 'bookends', 'tape dispensers', 'sticky notes', 'envelopes', 'file folders', 'binders', 'index cards', 'post-its', 'desk lamps', 'calculators', 'rulers', 'erasers', 'pencil sharpeners', 'scissors', 'hole punches', 'staplers', 'tape', 'glue sticks', 'markers', 'crayons', 'colored pencils', 'paintbrushes', 'sponges', 'dish cloths', 'dishwashing gloves', 'cleaning supplies', 'mops', 'brooms', 'dustpans', 'trash bins', 'recycling bins', 'toilet paper', 'paper towels', 'napkins', 'tissues', 'hand towels', 'bath towels', 'washcloths', 'shower curtains', 'shower rings', 'drain plugs', 'soap dishes', 'toothbrush holders', 'toothpicks', 'q-tips', 'bobby pins', 'hair clips', 'rubber bands', 'hair ties', 'headbands', 'hats', 'scarves', 'mittens', 'gloves', 'socks', 'slippers', 'shoes', 'laces', 'insoles', 'shoe trees', 'shoe horns', 'shoe polish', 'belts', 'buckles', 'suspenders', 'ties', 'bow ties', 'cufflinks', 'buttons', 'zippers', 'snaps', 'hooks', 'eyes', 'clasps', 'fasteners', 'velcro', 'mesh', 'felt', 'foam', 'padding', 'stuffing', 'cotton', 'wool', 'silk', 'linen', 'nylon', 'polyester', 'spandex', 'elastic', 'ribbing', 'piping', 'trim', 'lace', 'ribbons', 'bows'];


const wheelVerbs = ['floating', 'drifting', 'gliding', 'sliding', 'swaying', 'rocking', 'cradling', 'hugging', 'embracing', 'caressing', 'stroking', 'touching', 'whispering', 'singing', 'humming', 'breathing', 'sleeping', 'resting', 'relaxing', 'meditating', 'stretching', 'moving gently', 'flowing', 'swirling', 'twirling', 'spinning slowly', 'melting', 'blending', 'merging', 'mixing', 'brewing', 'simmering', 'steaming', 'pouring', 'dripping', 'falling', 'settling', 'nestling', 'curling', 'folding', 'unfolding', 'opening', 'closing', 'reflecting', 'resonating', 'echoing', 'vibrating', 'pulsing', 'waving', 'rippling', 'shimmering', 'glimmering', 'twinkling', 'fading', 'emerging', 'appearing', 'dissolving', 'lingering', 'hovering', 'ascending', 'descending', 'wandering', 'journeying', 'destroying', 'exploding', 'freezing', 'burning', 'crashing', 'shattering', 'imploding', 'disappearing', 'transforming', 'morphing', 'evolving', 'glitching', 'warping', 'bending', 'twisting', 'stretching', 'bouncing', 'flying', 'levitating', 'ejecting', 'launching', 'catapulting', 'obliterating', 'annihilating', 'eaten by', 'attacked by', 'chased by', 'hunted by', 'assaulted by', 'crushed by', 'buried by', 'swallowed by', 'consumed by', 'screaming at', 'yelling at', 'punching', 'kicking', 'smashing', 'bashing', 'crushing', 'pounding', 'slapping', 'stabbing', 'cutting', 'slicing', 'dicing', 'mincing', 'shredding', 'grinding', 'pulverizing', 'vaporizing'];

let wheelState = {
    adjective: 0,
    noun: 0,
    verb: 0,
    spinning: false
};

function initializeWheelUI() {
    const wheelSection = document.createElement('div');
    wheelSection.id = 'wheelSection';
    wheelSection.style.display = 'block';
    wheelSection.style.background = 'rgba(26, 26, 26, 0.6)';
    wheelSection.style.border = '2px solid rgba(255, 0, 255, 0.3)';
    wheelSection.style.borderRadius = '8px';
    wheelSection.style.padding = '20px';
    wheelSection.style.margin = '20px 0';
    wheelSection.style.backdropFilter = 'blur(5px)';
    wheelSection.innerHTML = `
        <h3 style="text-align: center; color: var(--accent-magenta); margin: 20px 0 10px; font-family: 'Tilt Neon', cursive;">Random Query Generator</h3>
        <div style="display: flex; justify-content: space-around; align-items: center; gap: 20px; margin: 20px auto; flex-wrap: wrap;">
            <div class="wheel-container">
                <div class="wheel" id="wheelAdj">
                    ${wheelAdjectives.map((w, i) => `<div class="wheel-segment" style="transform: rotateZ(${(i * 360/wheelAdjectives.length)}deg);">${w}</div>`).join('')}
                </div>
            </div>
            <div class="wheel-container">
                <div class="wheel" id="wheelNoun">
                    ${wheelNouns.map((w, i) => `<div class="wheel-segment" style="transform: rotateZ(${(i * 360/wheelNouns.length)}deg);">${w}</div>`).join('')}
                </div>
            </div>
            <div class="wheel-container">
                <div class="wheel" id="wheelVerb">
                    ${wheelVerbs.map((w, i) => `<div class="wheel-segment" style="transform: rotateZ(${(i * 360/wheelVerbs.length)}deg);">${w}</div>`).join('')}
                </div>
            </div>
        </div>
        <div style="text-align: center; margin: 20px 0;">
            <button id="spinAllWheels" class="btn" style="padding: 12px 30px; font-size: 1em; margin: 0 5px;">SPIN</button>
            <button id="generateFromWheel" class="btn" style="padding: 12px 30px; font-size: 1em; margin: 0 5px; background: linear-gradient(135deg, var(--accent-magenta), #ff1493);">USE QUERY</button>
        </div>
        <div id="wheelQuery" style="text-align: center; color: var(--accent-magenta); font-family: 'Space Mono', monospace; font-size: 1.2em; margin: 15px 0;">___ ___ ___</div>
    `;
    
    const settingsSection = document.querySelector('.settings-section');
    if (settingsSection) {
        settingsSection.parentNode.insertBefore(wheelSection, settingsSection);
        document.getElementById('spinAllWheels').addEventListener('click', spinWheels);
        document.getElementById('generateFromWheel').addEventListener('click', addWheelQueryToTopics);
    } else {
        console.warn('Settings section not found');
    }
}

function spinWheels() {
    if (wheelState.spinning) return;
    wheelState.spinning = true;
    
    const spinButton = document.getElementById('spinAllWheels');
    spinButton.disabled = true;
    spinButton.textContent = 'SPINNING...';
    
    // Spin each wheel
    const spins = 15; // 15 spins per wheel
    const wheels = ['wheelAdj', 'wheelNoun', 'wheelVerb'];
    const maxItems = [wheelAdjectives.length, wheelNouns.length, wheelVerbs.length];
    
    let completedSpins = 0;
    
    wheels.forEach((wheelId, index) => {
        const wheel = document.getElementById(wheelId);
        let currentSpin = 0;
        
        const spinInterval = setInterval(() => {
            currentSpin++;
            const angle = (currentSpin * 30) % 360;
            wheel.style.transform = `rotateZ(${angle}deg)`;
            
            if (currentSpin >= spins) {
                clearInterval(spinInterval);
                
                // Final random position
                const finalSpin = Math.floor(Math.random() * (maxItems[index] * 4));
                const finalAngle = finalSpin * (360 / maxItems[index]);
                wheel.style.transform = `rotateZ(${finalAngle}deg)`;
                
                // Store the selected index
                wheelState[['adjective', 'noun', 'verb'][index]] = finalSpin % maxItems[index];
                
                completedSpins++;
                if (completedSpins === 3) {
                    updateWheelQuery();
                    spinButton.disabled = false;
                    spinButton.textContent = 'SPIN AGAIN';
                    wheelState.spinning = false;
                }
            }
        }, 50);
    });
}

function updateWheelQuery() {
    const adj = wheelAdjectives[wheelState.adjective];
    const noun = wheelNouns[wheelState.noun];
    const verb = wheelVerbs[wheelState.verb];
    
    // Randomly choose format
    const format = Math.floor(Math.random() * 5);
    let query;
    
    switch(format) {
        case 0: // adjective noun (no verb)
            query = `${adj} ${noun}`;
            break;
        case 1: // adjective verb noun
            query = `${adj} ${verb} ${noun}`;
            break;
        case 2: // adjective noun verb
            query = `${adj} ${noun} ${verb}`;
            break;
        case 3: // verb adjective noun
            query = `${verb} ${adj} ${noun}`;
            break;
        case 4: // noun adjective verb
            query = `${noun} ${adj} ${verb}`;
            break;
    }
    
    document.getElementById('wheelQuery').textContent = query;
}

function addWheelQueryToTopics() {
    const adj = wheelAdjectives[wheelState.adjective];
    const noun = wheelNouns[wheelState.noun];
    const verb = wheelVerbs[wheelState.verb];
    
    // Randomly choose format
    const format = Math.floor(Math.random() * 5);
    let query;
    
    switch(format) {
        case 0: // adjective noun (no verb)
            query = `${adj} ${noun}`;
            break;
        case 1: // adjective verb noun
            query = `${adj} ${verb} ${noun}`;
            break;
        case 2: // adjective noun verb
            query = `${adj} ${noun} ${verb}`;
            break;
        case 3: // verb adjective noun
            query = `${verb} ${adj} ${noun}`;
            break;
        case 4: // noun adjective verb
            query = `${noun} ${adj} ${verb}`;
            break;
    }
    
    if (!topics.includes(query)) {
        topics.push(query);
        updateTopicsList();
        
        // Flash feedback
        const wheelQuery = document.getElementById('wheelQuery');
        const originalColor = wheelQuery.style.color;
        wheelQuery.style.color = '#00ff00';
        setTimeout(() => {
            wheelQuery.style.color = originalColor;
        }, 300);
    }
}

// ===== REALISTIC WATCH PATTERNS =====
function generateRealisticWatchPattern(baseDuration) {
    const segments = [];
    let elapsed = 0;
    const targetDuration = baseDuration * 1000; // Convert to ms
    
    while (elapsed < targetDuration) {
        // Vary watch duration slightly (±20%)
        const variance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        const segmentDuration = Math.min((targetDuration * 0.3) * variance, targetDuration - elapsed);
        
        segments.push({
            type: 'watch',
            duration: segmentDuration
        });
        elapsed += segmentDuration;
        
        // Random chance of pause/distraction (30%)
        if (Math.random() < 0.3 && elapsed < targetDuration) {
            const pauseDuration = (2 + Math.random() * 5) * 1000; // 2-7 seconds
            segments.push({
                type: 'pause',
                duration: pauseDuration
            });
            elapsed += pauseDuration;
        }
    }
    
    return segments;
}

function playVideoInIframeWithPattern(videoId, segments, onComplete) {
    const container = document.getElementById('stealthContainer');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0`;
    iframe.width = '0';
    iframe.height = '0';
    iframe.style.display = 'none';
    iframe.style.border = 'none';
    container.appendChild(iframe);
    
    let totalTime = 0;
    
    segments.forEach((segment, index) => {
        setTimeout(() => {
            // Segment logic could include seeking, pausing, etc if iframe allowed it
            // For now, we simulate with timing variations
            console.log(`Segment ${index}: ${segment.type} for ${Math.round(segment.duration/1000)}s`);
        }, totalTime);
        
        totalTime += segment.duration;
    });
    
    setTimeout(() => {
        iframe.remove();
        if (onComplete) onComplete();
    }, totalTime);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initialize wheel UI when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWheelUI);
} else {
    initializeWheelUI();
}

