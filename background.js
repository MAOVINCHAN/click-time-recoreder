const ENABLES = 'ENABLES';

function loadDataSync(key) {
  return new Promise((resolve, reject) => {
    if (!chrome) reject("chrome is null");

    const { storage } = chrome || {};
    if (!storage) reject("chrome.storage is null");

    const { local } = storage || {};
    if (!local) reject("chrome.storage.local is null");

    local.get([key], function (result) {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      resolve(result[key]);
    });
  })
}


async function checkEnable() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        if (tabs[0]) {
            const currentUrl = tabs[0].url;
            if(!currentUrl) return;
            const obj = new URL(currentUrl);
            const origin = obj.origin;
            try {
                const enables = await loadDataSync(ENABLES);

                if(enables?.length && enables.includes(origin)) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        files: ['content.js']
                    });
                }
            }catch(err) {
                console.log('err', err)
            }
        }
    });
}

// 用于用户未切换tab时自动检查是否允许运行插件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        checkEnable();
    }
});


// 用于用户切换tab时自动检查是否允许运行插件
chrome.tabs.onActivated.addListener((activeInfo) => {
    checkEnable();
})