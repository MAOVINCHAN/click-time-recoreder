// 常量
window.__FIELDS__ = 'FIELDS';
window.__ENABLES__ = 'ENABLES';
window.__DAY__ = 'DAY';
window.__TABLE_DATA__ = 'TABLE_DATA';

// 工具函数
function saveData(key, data, callback = function () { }) {
  const obj = {};
  obj[key] = data;
  chrome.storage.local.set(obj, callback);
}
function saveObjData(obj, callback = function () { }) {
  chrome.storage.local.set(obj, callback);
}
function loadData(key) {
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
/**
 * 
 * @param {String || Date} dateTime 要格式化的时间
 * @returns 
 */
function formatDateTime(dateTime) {
  const dateTimeStr = new Date(dateTime).toLocaleString();
  const [datePart, timePart] = dateTimeStr.split(' ');

  const [year, month, day] = datePart.split('/');
  const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

  if (!timePart) return formattedDate;

  const [hour, minute, second] = timePart.split(':');
  const formattedTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;

  return `${formattedDate} ${formattedTime}`;
}

/**
 * 
 * @param {String || Date} oldDate 以前的日期
 * @param {number} daysThreshold 天数
 * @returns 在daysThreshold天内，返回false，超过daysThreshold天，返回true
 */
function dateIsOldThan(oldDate, daysThreshold) {
  const now = new Date();
  const dateObj = new Date(oldDate);
  const diffTime = Math.abs(now - dateObj);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 计算相差的整天数
  return diffDays > daysThreshold;
}


document.addEventListener('click', async (event) => {
  const el = event.target;
  try {
    const enables = await loadData(__ENABLES__);
    if (!enables?.length) return;
    if (!enables.includes(location.origin)) return;
    console.log('当前页面已开启插件支持！' , el)

    const fields = await loadData(__FIELDS__);
    if (!fields?.length) return;

    const target = el.textContent;

    if (fields.includes(target)) {
      const date = new Date();
      const dateString = date.toLocaleDateString();
      const id = new Date(dateString).getTime(); // 以当前日期的时间戳作为id

      // 判断本地是否存在id相同的数据
      let tableData = await loadData(__TABLE_DATA__) || [];

      if(!Array.isArray(tableData)) tableData = [];

      // 过滤超过保存天数的数据
      if (tableData?.length) {
        const saveDays = await loadData(__DAY__);
        if (saveDays) {
          tableData = tableData.filter(row => {
            return !dateIsOldThan(row.date, saveDays);
          })
        }
      }

      const existRow = tableData.find(t => t.id == id);  // 同一天

      if (existRow) {
        existRow[target] = formatDateTime(date);
      } else {
        const dateTime = formatDateTime(date);
        const newRow = {
          id,
          date: dateTime.split(' ')[0],
          origin: location.origin,
          [target]: dateTime,
        }
        tableData.unshift(newRow);
      }

      saveData(__TABLE_DATA__, tableData);
    }
  } catch (error) {
  }
}, true);