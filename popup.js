// State management
let currentSection = 'chatting';
let botConfig = null;

// Load bot configuration
async function loadConfig() {
  const result = await chrome.storage.local.get('botConfig');
  botConfig = result.botConfig;
  updateUI();
}

// Update UI based on current state
function updateUI() {
  // Update navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === currentSection);
  });

  // Update section content
  const sectionsContainer = document.getElementById('sections');
  sectionsContainer.innerHTML = getSectionContent(currentSection);

  // Initialize section-specific handlers
  initSectionHandlers(currentSection);
}

// Get content for each section
function getSectionContent(section) {
  switch (section) {
    case 'chatting':
      return `
        <div class="chatting-section">
          <div class="city-settings">
            <label>City</label>
            <select id="city">
              <option value="new-york">New York</option>
              <!-- Add more cities -->
            </select>
            <div class="timezone">America/New_York timezone now ${getCurrentTime()}</div>
          </div>
          
          <div class="user-settings">
            <input type="text" id="name" placeholder="Name" value="${botConfig?.name || ''}">
            <input type="number" id="age" placeholder="Age" value="${botConfig?.age || ''}">
            <div class="gender-select">
              <button class="${botConfig?.gender === 'female' ? 'active' : ''}" data-gender="female">Female</button>
              <button class="${botConfig?.gender === 'male' ? 'active' : ''}" data-gender="male">Male</button>
            </div>
          </div>
          
          <!-- Add more sections as per requirements -->
        </div>
      `;
    case 'photos':
      return `
        <div class="photos-section">
          <div class="warning-message">
            <h3>⚠️ For optimal conversion rates, upload more photos in the same outfit:</h3>
            <ul>
              <li>3 day and 3 night main photos</li>
              <li>1 day and 1 night sexy photos</li>
              <li>1 day and 1 night sad photos</li>
            </ul>
          </div>

          <div class="photo-upload">
            <div class="upload-box" id="uploadBox">
              <input type="file" id="photoInput" accept="image/*" multiple hidden>
              <button class="upload-btn">Upload Photos</button>
            </div>

            <div class="photo-categories">
              <select id="photoCategory">
                <option value="main">Main</option>
                <option value="sexy">Sexy</option>
                <option value="sad">Sad</option>
                <option value="pose">Pose</option>
                <option value="story">Story</option>
              </select>

              <select id="photoLighting">
                <option value="daytime">Daytime</option>
                <option value="nighttime">Nighttime</option>
                <option value="either">Either</option>
              </select>

              <select id="outfitDay">
                <option value="1">Outfit Day 1</option>
                <option value="2">Outfit Day 2</option>
                <option value="3">Outfit Day 3</option>
                <option value="4">Outfit Day 4</option>
                <option value="5">Outfit Day 5</option>
              </select>
            </div>
          </div>

          <div class="photos-grid" id="photosGrid">
            <!-- Photos will be displayed here -->
          </div>
        </div>
      `;
    case 'rotating-ctas':
      return `
        <div class="rotating-ctas-section">
          <div class="cta-controls">
            <label class="toggle-container">
              <input type="checkbox" id="randomCTAs" ${botConfig?.randomCTAs ? 'checked' : ''}>
              <span class="toggle-label">Choose CTAs Randomly</span>
            </label>
            
            <button id="addCTABtn" class="add-cta-btn">
              <span class="icon">+</span> Add CTA
            </button>
          </div>

          <div class="cta-list" id="ctaList">
            ${renderCTAList()}
          </div>

          <div id="ctaForm" class="cta-form hidden">
            <input type="text" id="ctaPlatform" placeholder="Platform (e.g., Social Media)">
            <input type="url" id="ctaURL" placeholder="URL">
            <div class="form-buttons">
              <button id="saveCTABtn" class="save-btn">Save</button>
              <button id="cancelCTABtn" class="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      `;
    case 'settings':
      return `
        <div class="settings-section">
          <div class="settings-group">
            <label class="toggle-container">
              <input type="checkbox" id="imageBlocker" ${botConfig?.imageBlocker ? 'checked' : ''}>
              <span class="toggle-label">Image Blocker</span>
            </label>

            <label class="toggle-container">
              <input type="checkbox" id="refreshAfterCrash" ${botConfig?.refreshAfterCrash ? 'checked' : ''}>
              <span class="toggle-label">Refresh After Crash</span>
            </label>

            <label class="toggle-container">
              <input type="checkbox" id="runInBackground" ${botConfig?.runInBackground ? 'checked' : ''}>
              <span class="toggle-label">Run in Background</span>
            </label>

            <label class="toggle-container">
              <input type="checkbox" id="blurMedia" ${botConfig?.blurMedia ? 'checked' : ''}>
              <span class="toggle-label">Blur Media</span>
            </label>
          </div>

          <div class="settings-group">
            <label class="setting-label">
              Refresh Interval (minutes)
              <input type="number" id="refreshInterval" value="${botConfig?.refreshInterval || 60}" min="1" max="1440">
            </label>
          </div>
        </div>
      `;
    // Add other section contents
  }
}

// Initialize event handlers
function initEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSection = btn.dataset.section;
      updateUI();
    });
  });

  // Master switch
  document.getElementById('masterSwitch').addEventListener('click', async () => {
    botConfig.isActive = !botConfig.isActive;
    await chrome.storage.local.set({ botConfig });
    updateUI();
  });
}

// Helper functions
function getCurrentTime() {
  return new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric',
    minute: '2-digit',
    hour12: true 
  });
}

// Initialize popup
async function init() {
  await loadConfigFromDB();
  await loadConfig();
  initEventListeners();
  updateUI();
}

// Add this to initSectionHandlers function
function initSectionHandlers(section) {
  if (section === 'photos') {
    const uploadBox = document.getElementById('uploadBox');
    const photoInput = document.getElementById('photoInput');

    uploadBox.addEventListener('click', () => {
      photoInput.click();
    });

    photoInput.addEventListener('change', handlePhotoUpload);
  }

  if (section === 'rotating-ctas') {
    const addCTABtn = document.getElementById('addCTABtn');
    const ctaForm = document.getElementById('ctaForm');
    const saveCTABtn = document.getElementById('saveCTABtn');
    const cancelCTABtn = document.getElementById('cancelCTABtn');
    const randomCTAsToggle = document.getElementById('randomCTAs');

    addCTABtn?.addEventListener('click', () => {
      ctaForm.classList.remove('hidden');
    });

    saveCTABtn?.addEventListener('click', saveCTA);
    cancelCTABtn?.addEventListener('click', () => {
      ctaForm.classList.add('hidden');
    });

    randomCTAsToggle?.addEventListener('change', async (e) => {
      botConfig.randomCTAs = e.target.checked;
      await chrome.storage.local.set({ botConfig });
    });

    // Load existing CTAs
    updateCTAList();
  }

  if (section === 'settings') {
    const settingsInputs = [
      'imageBlocker',
      'refreshAfterCrash',
      'runInBackground',
      'blurMedia',
      'refreshInterval'
    ];

    settingsInputs.forEach(setting => {
      const input = document.getElementById(setting);
      if (!input) return;

      input.addEventListener('change', async (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        botConfig[setting] = value;
        await chrome.storage.local.set({ botConfig });
      });
    });
  }
}

// Add these new functions
async function handlePhotoUpload(event) {
  const files = event.target.files;
  if (!files.length) return;

  const category = document.getElementById('photoCategory').value;
  const lighting = document.getElementById('photoLighting').value;
  const outfitDay = document.getElementById('outfitDay').value;

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = {
        dataUrl: e.target.result,
        category,
        lighting,
        outfitDay,
        timestamp: Date.now()
      };

      // Save to MongoDB
      chrome.runtime.sendMessage({
        type: 'SAVE_PHOTO',
        data: photoData
      });

      // Store in local storage
      const { photos = [] } = await chrome.storage.local.get('photos');
      photos.push(photoData);
      await chrome.storage.local.set({ photos });

      // Update photos grid
      updatePhotosGrid();
    };
    reader.readAsDataURL(file);
  }
}

async function updatePhotosGrid() {
  const grid = document.getElementById('photosGrid');
  const { photos = [] } = await chrome.storage.local.get('photos');

  grid.innerHTML = photos.map(photo => `
    <div class="photo-item">
      <img src="${photo.dataUrl}" alt="">
      <div class="photo-overlay">
        ${photo.category} - ${photo.lighting}
      </div>
    </div>
  `).join('');
}

// Add these helper functions for CTA management
function renderCTAList() {
  const ctas = botConfig?.ctas || [];
  if (ctas.length === 0) {
    return '<div class="empty-state">No CTAs added yet</div>';
  }

  return ctas.map((cta, index) => `
    <div class="cta-item" data-index="${index}">
      <div class="cta-info">
        <div class="cta-platform">${cta.platform}</div>
        <div class="cta-url">${cta.url}</div>
      </div>
      <div class="cta-actions">
        <button class="edit-cta-btn" onclick="editCTA(${index})">Edit</button>
        <button class="delete-cta-btn" onclick="deleteCTA(${index})">Delete</button>
      </div>
    </div>
  `).join('');
}

async function saveCTA() {
  const platform = document.getElementById('ctaPlatform').value;
  const url = document.getElementById('ctaURL').value;

  if (!platform || !url) return;

  const cta = { platform, url };
  botConfig.ctas = botConfig.ctas || [];
  botConfig.ctas.push(cta);

  await chrome.storage.local.set({ botConfig });
  updateCTAList();

  // Reset form
  document.getElementById('ctaPlatform').value = '';
  document.getElementById('ctaURL').value = '';
  document.getElementById('ctaForm').classList.add('hidden');
}

async function deleteCTA(index) {
  botConfig.ctas.splice(index, 1);
  await chrome.storage.local.set({ botConfig });
  updateCTAList();
}

async function editCTA(index) {
  const cta = botConfig.ctas[index];
  document.getElementById('ctaPlatform').value = cta.platform;
  document.getElementById('ctaURL').value = cta.url;
  document.getElementById('ctaForm').classList.remove('hidden');
  
  // Remove old CTA
  await deleteCTA(index);
}

function updateCTAList() {
  const ctaList = document.getElementById('ctaList');
  if (ctaList) {
    ctaList.innerHTML = renderCTAList();
  }
}

async function loadConfigFromDB() {
  try {
    const response = await fetch(chrome.runtime.getURL('services/mongodb.js'));
    const { default: mongodb } = await import(response.url);
    const config = await mongodb.getConfig('default');
    if (config) {
      botConfig = config;
      chrome.storage.local.set({ botConfig });
    }
  } catch (error) {
    console.error('Error loading config from DB:', error);
  }
}

init(); 