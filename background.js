import mongodb from './services/mongodb.js';

let debuggeeTabId = null;

// Function to attach debugger to a tab
async function attachDebugger(tabId) {
  try {
    // Attach debugger with all required capabilities
    await chrome.debugger.attach({ tabId }, "1.3");
    debuggeeTabId = tabId;

    // Enable all required debugging features
    await Promise.all([
      chrome.debugger.sendCommand({ tabId }, "Debugger.enable"),
      chrome.debugger.sendCommand({ tabId }, "Network.enable"),
      chrome.debugger.sendCommand({ tabId }, "Page.enable"),
      chrome.debugger.sendCommand({ tabId }, "Runtime.enable"),
      chrome.debugger.sendCommand({ tabId }, "DOM.enable"),
      chrome.debugger.sendCommand({ tabId }, "Security.enable")
    ]);

    // Set up request interception
    await chrome.debugger.sendCommand({ tabId }, "Network.setRequestInterception", {
      patterns: [{ urlPattern: "*" }]
    });

    // Start debugging session
    await chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", {
      expression: `console.log("[CupidBotOFM.ai] Started debugging this browser")`
    });

    // Notify that debugging is active
    chrome.tabs.sendMessage(tabId, { type: "DEBUG_STARTED" });
  } catch (error) {
    console.error("Debugger attachment failed:", error);
  }
}

// Auto-start debugging when extension loads
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "https://chat.reddit.com" }, async (tab) => {
      await attachDebugger(tab.id);
    });
  }
});

// Reattach debugger when navigating to chat.reddit.com
chrome.webNavigation.onCommitted.addListener(async (details) => {
  if (details.url.includes("chat.reddit.com")) {
    await attachDebugger(details.tabId);
  }
});

// Handle debugger events
chrome.debugger.onEvent.addListener((debuggeeId, method, params) => {
  if (!debuggeeId.tabId) return;

  switch (method) {
    case "Network.requestIntercepted":
      handleInterceptedRequest(debuggeeId.tabId, params);
      break;
    case "Network.responseReceived":
      handleResponse(debuggeeId.tabId, params);
      break;
  }
});

// Handle detachment
chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId === debuggeeTabId) {
    debuggeeTabId = null;
  }
});

async function handleInterceptedRequest(tabId, params) {
  try {
    // Continue the request but monitor it
    await chrome.debugger.sendCommand(
      { tabId },
      "Network.continueInterceptedRequest",
      { interceptionId: params.interceptionId }
    );
  } catch (error) {
    console.error("Error handling intercepted request:", error);
  }
}

async function handleResponse(tabId, params) {
  // Monitor responses for chat messages and other relevant data
  if (params.response.url.includes("chat.reddit.com")) {
    // Process chat data
  }
}

// Store bot configuration
const defaultConfig = {
  isActive: false,
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
};

// Initialize storage with default config
chrome.storage.local.get("botConfig", (result) => {
  if (!result.botConfig) {
    chrome.storage.local.set({ botConfig: defaultConfig });
  }
});