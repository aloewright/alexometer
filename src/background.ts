// Open the side panel when the toolbar action is clicked.
chrome.sidePanel
  ?.setPanelBehavior?.({ openPanelOnActionClick: true })
  .catch(() => {
    /* not supported in older browsers */
  })

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#505055" })
  chrome.action.setBadgeTextColor({ color: "#f1f1f1" })
})

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-panel") return
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.windowId) return
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId })
  } catch (err) {
    console.warn("[alexometer] sidePanel.open failed", err)
  }
})

export {}
