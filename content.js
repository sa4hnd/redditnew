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
        detectLanguage: true
      }
    };

    this.init();
  }

  async init() {
    await this.loadConfig();
    this.setupUI();
    this.setupEventListeners();
    this.startChatMonitoring();
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
        <div class="city-settings">
          <label>City</label>
          <div class="timezone">America/New_York timezone now ${this.getCurrentTime()}</div>
          <div class="toggles">
            <label class="toggle">
              <span>Match his location</span>
              <input type="checkbox" ${this.config.settings.matchLocation ? 'checked' : ''}>
            </label>
            <label class="toggle">
              <span>Random city</span>
              <input type="checkbox" ${this.config.settings.randomCity ? 'checked' : ''}>
            </label>
          </div>
        </div>

        <!-- All other fields from path.md -->
        <div class="name-field">...</div>
        <div class="age-field">...</div>
        <div class="gender-field">...</div>
        <div class="chat-style-field">...</div>
        <div class="model-info-field">...</div>
        <div class="cta-info-field">...</div>
        <div class="time-settings">...</div>
        <div class="language-settings">...</div>
      </div>
    `;
  }

  // Create other sections...

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
}

// Initialize the bot
new ChatBot(); 