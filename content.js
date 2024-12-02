// Content script that runs on chat.reddit.com
class ChatBot {
  constructor() {
    this.config = {
      isActive: false,
      photos: {
        main: { day: [], night: [] },
        sexy: { day: [], night: [] },
        sad: { day: [], night: [] }
      },
      ctas: [],
      settings: {
        city: "",
        name: "",
        age: "",
        gender: "female",
        chatStyle: "youthful",
        modelInfo: "You study psychology at a local college and recently broke up with your ex because he was too controlling.",
        ctaInfo: "Your page is $5 a month. You post full nude videos.",
        daytimeSetting: "You are trying out different outfits at home and doing homework.",
        nighttimeSetting: "You finished your homework. You are now bored and lonely cleaning your bedroom.",
        matchLocation: true,
        randomCity: false,
        declineMeetups: true,
        detectLanguage: true,
        acceptMessageRequests: {
          enabled: true,
          minDaily: 2,
          maxDaily: 8,
          responseInterval: { min: 3, max: 15 }
        }
      }
    };

    this.init();
  }

  async init() {
    await this.loadConfig();
    this.setupUI();
    this.setupEventListeners();
    this.setupPhotoHandlers();
    this.startChatMonitoring();

    // Listen for debugger status
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "DEBUG_STARTED") {
        this.handleDebuggerStarted();
      }
    });
  }

  setupUI() {
    // Main sections as per path.md
    const sections = {
      chatting: this.createChattingSection(),
      photos: this.createPhotosSection(),
      massMessages: this.createMassMessagesSection(),
      rotatingCTAs: this.createRotatingCTAsSection(),
      settings: this.createSettingsSection(),
      analytics: this.createAnalyticsSection()
    };

    // Create main UI container
    const container = document.createElement('div');
    container.id = 'cupidbot-container';
    container.innerHTML = `
      <div class="header">
        <div class="title">CupidBotOFM.ai</div>
        <div class="status">
          <span class="conversations">101 conversations left</span>
          <button class="get-more">Get more</button>
        </div>
        <div class="master-switch">
          <button id="power-btn"></button>
        </div>
      </div>

      <div class="navigation">
        ${Object.keys(sections).map(section => `
          <button class="nav-btn" data-section="${section}">
            ${section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        `).join('')}
      </div>

      <div class="sections">
        ${Object.values(sections).join('')}
      </div>
    `;

    document.body.appendChild(container);
  }

  createChattingSection() {
    return `
      <div class="section chatting">
        <div class="chat-header">
          <div class="chat-status">
            <span class="status-indicator ${this.config.isActive ? 'active' : ''}"></span>
            <span class="status-text">${this.config.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div class="chat-stats">
            <div class="stat">
              <span class="stat-label">Messages Today:</span>
              <span class="stat-value">0/100</span>
            </div>
            <div class="stat">
              <span class="stat-label">Response Rate:</span>
              <span class="stat-value">0%</span>
            </div>
          </div>
        </div>

        <div class="chat-settings">
          <!-- City Settings -->
          <div class="setting-group">
            <label>City <span class="info-icon">ℹ️</span></label>
            <input type="text" id="city" placeholder="Enter city" value="${this.config.settings.city}">
            <div class="timezone">America/New_York timezone now ${this.getCurrentTime()}</div>
            <div class="toggles">
              <label class="toggle">
                <span>Match his location</span>
                <input type="checkbox" id="matchLocation" ${this.config.settings.matchLocation ? 'checked' : ''}>
              </label>
              <label class="toggle">
                <span>Random city</span>
                <input type="checkbox" id="randomCity" ${this.config.settings.randomCity ? 'checked' : ''}>
              </label>
            </div>
          </div>

          <!-- Message Settings -->
          <div class="setting-group">
            <label>Message Requests</label>
            <div class="message-settings">
              <div class="setting-row">
                <span>Accept requests</span>
                <input type="checkbox" id="acceptRequests" ${this.config.settings.acceptMessageRequests.enabled ? 'checked' : ''}>
              </div>
              <div class="setting-row">
                <span>Daily limits</span>
                <div class="limit-inputs">
                  <input type="number" id="minDaily" value="${this.config.settings.acceptMessageRequests.minDaily}" min="0" max="100">
                  <span>to</span>
                  <input type="number" id="maxDaily" value="${this.config.settings.acceptMessageRequests.maxDaily}" min="0" max="100">
                </div>
              </div>
              <div class="setting-row">
                <span>Response interval (minutes)</span>
                <div class="limit-inputs">
                  <input type="number" id="minInterval" value="${this.config.settings.acceptMessageRequests.responseInterval.min}" min="1" max="60">
                  <span>to</span>
                  <input type="number" id="maxInterval" value="${this.config.settings.acceptMessageRequests.responseInterval.max}" min="1" max="60">
                </div>
              </div>
            </div>
          </div>

          <!-- Character Settings -->
          <div class="setting-group">
            <label>Character Profile</label>
            <div class="character-settings">
              <input type="text" id="name" placeholder="Name" value="${this.config.settings.name}">
              <input type="number" id="age" placeholder="Age" value="${this.config.settings.age}">
              <div class="gender-select">
                <button class="${this.config.settings.gender === 'female' ? 'active' : ''}" data-gender="female">Female</button>
                <button class="${this.config.settings.gender === 'male' ? 'active' : ''}" data-gender="male">Male</button>
              </div>
            </div>
          </div>

          <!-- Behavior Settings -->
          <div class="setting-group">
            <label>Chat Behavior</label>
            <div class="behavior-settings">
              <div class="chat-style">
                <button class="${this.config.settings.chatStyle === 'youthful' ? 'active' : ''}" data-style="youthful">Youthful</button>
                <button class="${this.config.settings.chatStyle === 'mature' ? 'active' : ''}" data-style="mature">Mature</button>
              </div>
              <textarea id="modelInfo" placeholder="Model info...">${this.config.settings.modelInfo}</textarea>
              <div class="char-count">0/200</div>
              <textarea id="ctaInfo" placeholder="CTA info...">${this.config.settings.ctaInfo}</textarea>
              <div class="char-count">0/200</div>
            </div>
          </div>

          <!-- Time Settings -->
          <div class="setting-group">
            <label>Time-based Responses</label>
            <div class="time-settings">
              <div class="daytime">
                <label>Daytime (6:00 - 18:00)</label>
                <textarea id="daySetting">${this.config.settings.daytimeSetting}</textarea>
              </div>
              <div class="nighttime">
                <label>Nighttime (18:00 - 6:00)</label>
                <textarea id="nightSetting">${this.config.settings.nighttimeSetting}</textarea>
              </div>
            </div>
          </div>

          <!-- Advanced Settings -->
          <div class="setting-group">
            <label>Advanced Settings</label>
            <div class="advanced-settings">
              <label class="toggle">
                <span>Strongly decline meetups</span>
                <input type="checkbox" id="declineMeetups" ${this.config.settings.declineMeetups ? 'checked' : ''}>
              </label>
              <label class="toggle">
                <span>Detect language</span>
                <input type="checkbox" id="detectLanguage" ${this.config.settings.detectLanguage ? 'checked' : ''}>
              </label>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createPhotosSection() {
    return `
      <div class="section photos">
        <!-- Warning Message -->
        <div class="warning-message">
          <h3>⚠️ For optimal conversion rates, upload more photos in the same outfit:</h3>
          <ul>
            <li>3 day and 3 night main photos</li>
            <li>1 day and 1 night sexy photos</li>
            <li>1 day and 1 night sad photos</li>
          </ul>
        </div>

        <!-- Photo Upload -->
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

        <!-- Photos Grid -->
        <div class="photos-grid" id="photosGrid"></div>
      </div>
    `;
  }

  setupEventListeners() {
    // Handle all user interactions
    document.getElementById('power-btn').addEventListener('click', () => {
      this.toggleBot();
    });

    // Add other event listeners...
  }

  startChatMonitoring() {
    // Monitor chat messages and handle responses
    const chatObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('chat-message')) {
            this.handleNewMessage(node);
          }
        });
      });
    });

    // Start observing chat container
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatObserver.observe(chatContainer, { childList: true, subtree: true });
    }
  }

  async handleNewMessage(messageNode) {
    if (!this.config.isActive) return;

    const messageText = messageNode.textContent;
    // Process message according to settings
    // Generate response based on time of day, model info, etc.
  }

  // Other required methods...

  setupPhotoHandlers() {
    const uploadBox = document.getElementById('uploadBox');
    const photoInput = document.getElementById('photoInput');

    if (uploadBox && photoInput) {
      uploadBox.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));
    }
  }

  async handlePhotoUpload(event) {
    const files = event.target.files;
    if (!files.length) return;

    const category = document.getElementById('photoCategory').value;
    const lighting = document.getElementById('photoLighting').value;
    const outfitDay = document.getElementById('outfitDay').value;

    for (const file of files) {
      try {
        const photoData = await this.processPhoto(file, category, lighting, outfitDay);
        await this.savePhoto(photoData);
        this.updatePhotosGrid();
      } catch (error) {
        console.error('Error processing photo:', error);
      }
    }
  }

  async processPhoto(file, category, lighting, outfitDay) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          dataUrl: e.target.result,
          category,
          lighting,
          outfitDay,
          timestamp: Date.now()
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async savePhoto(photoData) {
    // Save to local storage
    const { photos = [] } = await chrome.storage.local.get('photos');
    photos.push(photoData);
    await chrome.storage.local.set({ photos });

    // Update config
    const categoryKey = photoData.category.toLowerCase();
    const lightingKey = photoData.lighting === 'daytime' ? 'day' : 'night';
    
    if (this.config.photos[categoryKey]?.[lightingKey]) {
      this.config.photos[categoryKey][lightingKey].push(photoData);
    }
  }

  async updatePhotosGrid() {
    const grid = document.getElementById('photosGrid');
    if (!grid) return;

    const { photos = [] } = await chrome.storage.local.get('photos');
    
    grid.innerHTML = photos.map(photo => `
      <div class="photo-item" data-id="${photo.timestamp}">
        <img src="${photo.dataUrl}" alt="">
        <div class="photo-overlay">
          <div class="photo-info">
            ${photo.category} - ${photo.lighting}
            <br>
            Outfit Day ${photo.outfitDay}
          </div>
          <div class="photo-actions">
            <button class="delete-photo" onclick="deletePhoto(${photo.timestamp})">Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async deletePhoto(timestamp) {
    const { photos = [] } = await chrome.storage.local.get('photos');
    const updatedPhotos = photos.filter(p => p.timestamp !== timestamp);
    await chrome.storage.local.set({ photos: updatedPhotos });
    this.updatePhotosGrid();
  }

  handleDebuggerStarted() {
    // Show debugging status
    const debugStatus = document.createElement('div');
    debugStatus.className = 'debug-status';
    debugStatus.textContent = 'CupidBotOFM.ai is debugging this browser';
    document.body.appendChild(debugStatus);

    // Start monitoring chat
    this.startChatAutomation();
  }

  startChatAutomation() {
    // Monitor chat messages
    const chatObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('chat-message')) {
            this.handleIncomingMessage(node);
          }
        });
      });
    });

    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatObserver.observe(chatContainer, { childList: true, subtree: true });
    }
  }

  async handleIncomingMessage(messageNode) {
    if (!this.config.isActive) return;

    // Extract message data
    const messageData = this.parseMessage(messageNode);
    if (!messageData) return;

    // Check if we should respond
    if (!this.shouldRespond(messageData)) return;

    // Generate and send response
    try {
      const response = await this.generateResponse(messageData);
      await this.sendResponse(response);
      this.updateStats();
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  parseMessage(messageNode) {
    try {
      const text = messageNode.querySelector('.message-text')?.textContent;
      const sender = messageNode.querySelector('.sender-name')?.textContent;
      const timestamp = messageNode.querySelector('.timestamp')?.getAttribute('data-timestamp');
      const isIncoming = messageNode.classList.contains('incoming');

      if (!text || !sender || !isIncoming) return null;

      return {
        text,
        sender,
        timestamp: timestamp ? new Date(parseInt(timestamp)) : new Date(),
        isFirstMessage: this.isFirstMessage(sender)
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return null;
    }
  }

  shouldRespond(messageData) {
    // Check daily message limits
    if (this.hasReachedDailyLimit()) return false;

    // Check response interval
    if (!this.isWithinResponseInterval()) return false;

    // Check language if enabled
    if (this.config.settings.detectLanguage && !this.isValidLanguage(messageData.text)) {
      return false;
    }

    return true;
  }

  async generateResponse(messageData) {
    // Get current time to determine day/night setting
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour < 18;
    const setting = isDaytime ? this.config.settings.daytimeSetting : this.config.settings.nighttimeSetting;

    // Build context for response
    const context = {
      isFirstMessage: messageData.isFirstMessage,
      timeOfDay: isDaytime ? 'day' : 'night',
      modelInfo: this.config.settings.modelInfo,
      ctaInfo: this.config.settings.ctaInfo,
      currentSetting: setting,
      chatStyle: this.config.settings.chatStyle,
      declineMeetups: this.config.settings.declineMeetups
    };

    // Analyze message intent
    const intent = await this.analyzeMessageIntent(messageData.text);

    // Generate appropriate response
    let response;
    switch (intent) {
      case 'greeting':
        response = this.generateGreeting(context);
        break;
      case 'meetup_request':
        response = this.generateMeetupDecline(context);
        break;
      case 'personal_question':
        response = this.generatePersonalResponse(context);
        break;
      case 'cta_opportunity':
        response = this.generateCTA(context);
        break;
      default:
        response = this.generateGenericResponse(context);
    }

    return response;
  }

  async analyzeMessageIntent(text) {
    // Simple intent detection - can be enhanced with AI
    const lowerText = text.toLowerCase();
    
    if (lowerText.match(/meet|hangout|coffee|drinks|dinner/)) {
      return 'meetup_request';
    }
    
    if (lowerText.match(/hi|hey|hello|sup/)) {
      return 'greeting';
    }
    
    if (lowerText.match(/what|where|when|how|why|who/)) {
      return 'personal_question';
    }
    
    if (lowerText.match(/snap|onlyfans|premium|private|pics|photos/)) {
      return 'cta_opportunity';
    }
    
    return 'general';
  }

  generateGreeting(context) {
    const greetings = {
      youthful: [
        "Heyyy! 💕",
        "Hiiii there! ✨",
        "Hey cutie! 🙈"
      ],
      mature: [
        "Hi there! 😊",
        "Hello! How are you? 💋",
        "Hey! Nice to meet you 😘"
      ]
    };

    const style = context.chatStyle;
    const greetingList = greetings[style];
    return greetingList[Math.floor(Math.random() * greetingList.length)];
  }

  generateMeetupDecline(context) {
    const declines = [
      "Sorry, I don't do meetups! But we can definitely get to know each other better online 😘",
      "I prefer keeping things online for now, hope you understand! 💕",
      "I don't meet in person, but I'd love to chat more here! 🙈"
    ];
    
    return declines[Math.floor(Math.random() * declines.length)];
  }

  generateCTA(context) {
    return context.ctaInfo;
  }

  async sendResponse(response) {
    // Find chat input and send button
    const chatInput = document.querySelector('.chat-input');
    const sendButton = document.querySelector('.send-button');

    if (!chatInput || !sendButton) {
      throw new Error('Chat input elements not found');
    }

    // Type message
    chatInput.value = response;
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Add random delay to seem more natural
    await this.randomDelay(1000, 3000);

    // Send message
    sendButton.click();
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  updateStats() {
    // Update message counts and response rates
    const stats = {
      messagesTotal: (this.stats?.messagesTotal || 0) + 1,
      responsesTotal: (this.stats?.responsesTotal || 0) + 1,
      dailyMessages: (this.stats?.dailyMessages || 0) + 1
    };

    this.stats = stats;
    this.updateStatsDisplay();
  }

  updateStatsDisplay() {
    const messageCount = document.querySelector('.stat-value');
    if (messageCount) {
      messageCount.textContent = `${this.stats.dailyMessages}/100`;
    }

    const responseRate = document.querySelector('.stat-value:last-child');
    if (responseRate) {
      const rate = Math.round((this.stats.responsesTotal / this.stats.messagesTotal) * 100);
      responseRate.textContent = `${rate}%`;
    }
  }
}

// Initialize the bot
new ChatBot(); 