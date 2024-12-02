import mongodb from './services/mongodb.js';

let debuggeeId = null;
let debuggerAttached = false;

// Function to attach debugger to a tab
async function attachDebugger(tabId) {
  if (debuggerAttached) {
    await chrome.debugger.detach({ tabId: debuggeeId });
  }

  try {
    // This will show "This site is being debugged by extension" in Chrome
    await chrome.debugger.attach({ tabId }, "1.3");
    debuggeeId = tabId;
    debuggerAttached = true;

    // Enable all required debugging domains
    await Promise.all([
      chrome.debugger.sendCommand({ tabId }, "Debugger.enable"),
      chrome.debugger.sendCommand({ tabId }, "Network.enable"),
      chrome.debugger.sendCommand({ tabId }, "DOM.enable"),
      chrome.debugger.sendCommand({ tabId }, "Runtime.enable"),
      chrome.debugger.sendCommand({ tabId }, "Page.enable"),
      chrome.debugger.sendCommand({ tabId }, "Console.enable")
    ]);

    // Set breakpoints for chat functionality
    await chrome.debugger.sendCommand({ tabId }, "Debugger.setBreakpointByUrl", {
      lineNumber: 0,
      urlRegex: ".*chat\.reddit\.com.*"
    });

    // Monitor network requests
    await chrome.debugger.sendCommand({ tabId }, "Network.setRequestInterception", {
      patterns: [{
        urlPattern: "*",
        resourceType: "XHR",
        interceptionStage: "Request"
      }]
    });

    // Execute debug script
    await chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", {
      expression: `
        console.log("%cCupidBotOFM.ai Debugger Attached", "color: #8b5cf6; font-size: 20px; font-weight: bold");
        window.__cupidBotDebugger = true;
      `
    });

  } catch (error) {
    console.error("Failed to attach debugger:", error);
    debuggerAttached = false;
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
chrome.debugger.onEvent.addListener((source, method, params) => {
  if (!source.tabId || source.tabId !== debuggeeId) return;

  switch (method) {
    case "Debugger.paused":
      handleDebuggerPaused(source.tabId, params);
      break;
    case "Network.requestIntercepted":
      handleInterceptedRequest(source.tabId, params);
      break;
    case "Network.responseReceived":
      handleNetworkResponse(source.tabId, params);
      break;
  }
});

// Handle detachment
chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId === debuggeeId) {
    debuggeeId = null;
    debuggerAttached = false;
  }
});

async function handleDebuggerPaused(tabId, params) {
  // Analyze call stack and variables
  const callFrames = params.callFrames;
  const stackTrace = await Promise.all(callFrames.map(async frame => {
    const scopeChain = await Promise.all(frame.scopeChain.map(async scope => {
      const { result } = await chrome.debugger.sendCommand(
        { tabId },
        "Runtime.getProperties",
        { objectId: scope.object.objectId }
      );
      return result;
    }));
    return { frame, scopeChain };
  }));

  // Continue execution
  await chrome.debugger.sendCommand({ tabId }, "Debugger.resume");
}

async function handleInterceptedRequest(tabId, params) {
  // Monitor and modify chat requests if needed
  const request = params.request;
  if (request.url.includes("chat.reddit.com")) {
    // Analyze and potentially modify request
  }
  
  await chrome.debugger.sendCommand(
    { tabId },
    "Network.continueInterceptedRequest",
    { interceptionId: params.interceptionId }
  );
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