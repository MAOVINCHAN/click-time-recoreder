const windowInfo = {};

/**
 * local本地保存的参数：
 * ENABLES: ['网站的origin1', '网站的origin2', ...]； 判断当前网站是否需要开启插件功能
 * FIELDS: ['文本1', '文本2', ...']；用户点击这些文本，需要被记录
 * DAY: 1-30；数据保存的范围
 * TABLE_DATA: [{id: "xxx", origin: 'xxx', date: 'xxx', ...}]
 */

const __FIELDS__ = 'FIELDS';
const __ENABLES__ = 'ENABLES';
const __DAY__ = 'DAY';
const __TABLE_DATA__ = 'TABLE_DATA';

function saveData(key, data, callback = function () { }) {
    const obj = {};
    obj[key] = data;
    chrome.storage.local.set(obj, callback);
}

function saveObjData(obj, callback = function () { }) {
    chrome.storage.local.set(obj, callback);
}

function loadData(key, callback) {
    chrome.storage.local.get([key], function (result) {
        if (callback) callback(result[key]);
    });
}
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

// 数据为空时，渲染空提示
async function initNoRecodes() {
    const recodesTab = document.getElementById('records-tab');
    let tableContainer = document.querySelector('.records-table-container');
    if (tableContainer) tableContainer.remove();
    recodesTab.innerHTML = recodesTab.innerHTML += `
        <div class="no-records" id="no-records">
            <div class="no-records-icon">📭</div>
            <h3>暂无记录数据</h3>
            <p>1. 配置要监听的字段</p>
            <p>2. 去允许运行的网页点击配置的文本</p>
        </div>
    `
}

// const mockData = [
//     {
//         "date": "2025-07-25",
//         "id": 1753372800001,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-26",
//         "id": 1753372800002,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-27",
//         "id": 1753372800003,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-24",
//         "id": 1753372800004,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-23",
//         "id": 1753372800005,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-22",
//         "id": 1753372800006,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-21",
//         "id": 1753372800007,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-20",
//         "id": 1753372800008,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-19",
//         "id": 1753372800009,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-18",
//         "id": 1753372800010,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
//     {
//         "date": "2025-07-17",
//         "id": 1753372800011,
//         "origin": "https://www.baidu.com",
//         "民生榜": "2025-07-25 14:45:17",
//         "热搜榜": "2025-07-25 14:45:17"
//     },
// ]

let paginationState = {
    currentPage: 1,
    pageSize: 5,
    totalRecords: 0
};

async function goToPage(page) {
    const totalPages = Math.ceil(paginationState.totalRecords / paginationState.pageSize);
    if (page < 1 || page > totalPages) return;

    paginationState.currentPage = page;

    // 容器
    let tableContainer = document.getElementById('records-table-container');
    tableContainer.innerHTML = '';

    // 表格数据
    const dataAll = await loadDataSync(__TABLE_DATA__) || [];
    const startIndex = (paginationState.currentPage - 1) * paginationState.pageSize;
    const endIndex = Math.min(startIndex + paginationState.pageSize, dataAll.length);
    const tableData = dataAll.slice(startIndex, endIndex);

    // 表格字段
    const _fields = await loadDataSync(__FIELDS__);
    const fields = fillFields(_fields);

    // 生成表格
    renderTable(tableContainer, tableData, fields);

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(paginationState.totalRecords / paginationState.pageSize);

    // 更新分页信息
    const start = (paginationState.currentPage - 1) * paginationState.pageSize + 1;
    const end = Math.min(paginationState.currentPage * paginationState.pageSize, paginationState.totalRecords);
    document.getElementById('pagination-info').textContent = `${start}-${end} / 共${paginationState.totalRecords}条`;

    // 更新分页按钮状态
    document.querySelector('.first-page').disabled = paginationState.currentPage === 1;
    document.querySelector('.prev-page').disabled = paginationState.currentPage === 1;
    document.querySelector('.next-page').disabled = paginationState.currentPage === totalPages || totalPages === 0;
    document.querySelector('.last-page').disabled = paginationState.currentPage === totalPages || totalPages === 0;

    // 更新页码按钮
    const pageNumbersContainer = document.getElementById('page-numbers');
    pageNumbersContainer.innerHTML = '';

    // 只显示最多5个页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(1, paginationState.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 调整如果接近开始或结束
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === paginationState.currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => goToPage(i));
        pageNumbersContainer.appendChild(pageBtn);
    }
}

function initPagination(recodesTab) {
    let paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        paginationContainer.innerHTML = ''
    } else {
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        paginationContainer.id = 'pagination-container';
    }

    paginationContainer.innerHTML = `
        <div class="pagination-info" id="pagination-info">显示 0-0 / 共 0 条</div>
        <div class="pagination-controls">
          <button class="pagination-btn first-page" title="第一页">«</button>
          <button class="pagination-btn prev-page" title="上一页">‹</button>
          <div class="page-numbers" id="page-numbers"></div>
          <button class="pagination-btn next-page" title="下一页">›</button>
          <button class="pagination-btn last-page" title="最后一页">»</button>
        </div>
        <div class="page-size-selector">
          <span>每页显示：</span>
          <select id="page-size-select" disabled>
            <option value="5" selected>5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
    `
    paginationContainer.querySelector('.first-page').addEventListener('click', () => goToPage(1));
    paginationContainer.querySelector('.prev-page').addEventListener('click', () => goToPage(paginationState.currentPage - 1));
    paginationContainer.querySelector('.next-page').addEventListener('click', () => goToPage(paginationState.currentPage + 1));
    paginationContainer.querySelector('.last-page').addEventListener('click', () => goToPage(Math.ceil(paginationState.totalRecords / paginationState.pageSize)));
    recodesTab.appendChild(paginationContainer);
    updatePagination();
}

function removePagination() {
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
        paginationContainer.remove();
    }
}


// 生成表格行
function renderTr(item, fields) {
    const tr = document.createElement('tr');
    tr.setAttribute("data-id", item.id);
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const td = document.createElement('td');
        if (field === '__date__') {
            td.textContent = item['date'];
        } else if (field == "__origin__") {
            td.textContent = item['origin'];
        } else if (field == '__operation__') {
            const button = document.createElement('button');
            button.className = "action-btn delete"
            button.setAttribute("data-id", item.id);
            button.textContent = "删除";
            button.addEventListener('click', deleteRow(item['date'], item.id, fields))
            td.appendChild(button);
        } else {
            td.textContent = item[field] || '--';
        }
        td.title = td.textContent;
        tr.appendChild(td);
    }
    return tr;
}

function renderTable(tableContainer, tableData, fields) {
    const table = document.createElement('table');
    table.className = 'records-table';
    table.id = "records-table";

    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    tr.id = "table-headers";
    // 生成表头
    for (let i = 0; i < fields.length; i++) {
        const th = document.createElement('th');
        const field = fields[i];
        if (field == '__date__') {
            th.textContent = '日期';
        } else if (field == '__origin__') {
            th.textContent = '源';
        } else if (field == '__operation__') {
            th.textContent = '操作';
        } else {
            th.textContent = field;
        }
        th.title = th.textContent;
        tr.appendChild(th);
    }
    thead.appendChild(tr);

    // 生成表体
    const tbody = document.createElement('tbody');
    tbody.id = "records-body";
    for (let i = 0; i < tableData.length; i++) {
        const item = tableData[i];
        const tr = renderTr(item, fields);
        tbody.appendChild(tr);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

function fillFields(local_saved_fields = []) {
    return ['__date__', ...local_saved_fields, '__origin__', "__operation__"];
}

// 加载数据，并渲染表格
async function initRecodes() {
    try {
        const dataAll = await loadDataSync(__TABLE_DATA__) || [];
        const startIndex = (paginationState.currentPage - 1) * paginationState.pageSize;
        const endIndex = Math.min(startIndex + paginationState.pageSize, dataAll.length);
        const tableData = dataAll.slice(startIndex, endIndex);

        const _fields = await loadDataSync(__FIELDS__);
        let tableContainer = document.getElementById('records-table-container');
        const noRecodes = document.getElementById("no-records");
        if (!dataAll?.length || !_fields?.length) {
            if(tableContainer) tableContainer.innerHTML = '';
            if(!noRecodes) initNoRecodes();
            removePagination();
            return;
        };
        paginationState.totalRecords = dataAll.length;

        const fields = fillFields(_fields);
        const recodesTab = document.getElementById('records-tab');

        // 生成容器
        if (tableContainer) {
            tableContainer.innerHTML = '';
        } else {
            tableContainer = document.createElement('div');
            tableContainer.className = 'records-table-container';
            tableContainer.id = 'records-table-container';
        }

        // 生成表格
        renderTable(tableContainer, tableData, fields);

        // 去除无记录界面
        if (noRecodes) noRecodes.remove();

        recodesTab.appendChild(tableContainer);
        // 生成分页器
        initPagination(recodesTab);
    } catch (err) {
        console.log(err);
    }
}


// 删除单行记录
function deleteRow(rowDate, rowId, fields) {
    return async () => {
        try {
            const sure = await $confirm("删除提示", `是否确认删除日期为【${rowDate}】的记录？`);
            if (!sure) return;

            let tableData = await loadDataSync(__TABLE_DATA__) || [];
            if (!tableData?.length) return;

            const index = tableData.findIndex(item => item.id == rowId);

            tableData.splice(index, 1);

            // 先更新数据
            saveData(__TABLE_DATA__, tableData || []);

            $message.success(`成功删除【${rowDate}】的记录`);

            // 更新分页器
            const total = tableData.length;
            paginationState.totalRecords = total;
            if(total % paginationState.pageSize == 0) {
                paginationState.currentPage = paginationState.currentPage - 1 <= 0 ? 1 : paginationState.currentPage - 1;
            }

            // 再更新页面
            if (!tableData?.length) { // 没有数据，提示空
                initNoRecodes();

                removePagination();
                return;
            }

            // 将元素从表格中移除
            const table = document.getElementById('records-table');
            if(!table) return;
            const rowEl = table.querySelector(`[data-id="${rowId}"]`)
            rowEl && rowEl.remove();
            if(total % paginationState.pageSize == 0) {
                goToPage(paginationState.currentPage); // 这里的page已经减1了
            }else {
                // 需要将下一页第一行的数据往前推
                const index = paginationState.currentPage * paginationState.pageSize - 1;
                const item = tableData[index];
                const tr = renderTr(item, fields);
                table.appendChild(tr);
            }
        } catch (err) {
            console.log(err);
        }
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const fieldsContainer = document.getElementById('fields-container');
    const addBtn = document.getElementById('add-btn');
    const countElement = document.getElementById('count');
    const saveDaysInput = document.getElementById('save-days');
    const saveBtn = document.getElementById('save-btn');
    const originUrl = document.getElementById('origin-url');
    const originToggle = document.getElementById('origin-toggle');
    const originStatus = document.querySelector('.origin-status');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');


    let fieldCount = 0;
    let nextId = 1;
    let lastFieldElement = null;

    // 显示当前origin
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0]) {
            const currentUrl = tabs[0].url;
            // 非http/https开头的源禁用此插件
            if(!currentUrl.startsWith('http') && !currentUrl.startsWith('https')) {
                windowInfo.DISABLED = true;
            }

            const obj = new URL(currentUrl);
            windowInfo.URL = obj;
            originUrl.textContent = obj.origin || currentUrl;
        }
    });

    // 开关控制
    originToggle.addEventListener('change', async function () {
        if(windowInfo.DISABLED && this.checked) {
            originStatus.classList.remove('active');
            this.checked = false;
            $message.error("当前网站无法使用此插件！");
            return;
        }

        try {
            // 先查询本地数据，然后追加数据
            const data = await loadDataSync(__ENABLES__);
            const enables = data?.length ? data : [];

            if (this.checked) {
                originStatus.classList.add('active');
                enables.push(windowInfo.URL.origin)

                // 开启content.js脚本执行
                chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                    if (tabs[0]) {
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            files: ['content.js']
                        });
                    }
                });
            } else {
                originStatus.classList.remove('active');
                enables.splice(
                    enables.indexOf(windowInfo.URL.origin), 1
                )
            }

            saveData(__ENABLES__, enables);
        } catch (err) {
            originToggle.checked = false;
            originStatus.classList.remove('active');
        }
    });

    // 默认开启开关
    loadData(__ENABLES__, (enables) => {
        if (enables && enables.includes(windowInfo.URL.origin)) {
            originToggle.checked = true;
            originStatus.classList.add('active');
        } else {
            originToggle.checked = false;
            originStatus.classList.remove('active');
        }
    })

    // 初始化列表
    initRecodes();

    // 加载数据，并渲染设置的字段数据
    function initSettings() {
        loadData(__FIELDS__, (fields) => {
            if (fields?.length) {
                fieldCount = 0;
                nextId = 1;
                lastFieldElement = null;
                for (let i = 0; i < fields.length; i++) {
                    const field = fields[i];
                    addNewField();
                    document.getElementById('field-' + (i + 1)).value = field;
                }
            }
        })

        loadData(__DAY__, (day) => {
            saveDaysInput.value = day || 30;
        })
    }


    // 选项卡切换功能
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // 移除所有活动状态
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // 添加当前活动状态
            this.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');

            // 初始化数据
            if (targetTab === 'records') initRecodes();

            if (targetTab === 'settings') initSettings();
        });
    });

    // 添加新字段
    function addNewField() {
        if (fieldCount >= 5) {
            $message.warning("已达到最大字段数量（5个）");
            return;
        }

        // 移除空状态提示（如果存在）
        if (fieldCount === 0) {
            fieldsContainer.innerHTML = '';
        }

        // 上一条数据填完了才允许添加下一个字段
        if (lastFieldElement) {
            if (!lastFieldElement.querySelector('input').value) {
                $message.warning("请填写上一个字段的内容");
                return;
            }
        }

        const fieldId = nextId++;

        const fieldElement = document.createElement('div');
        fieldElement.className = 'input-group';
        fieldElement.innerHTML = `
                    <div class="field-counter">${fieldCount + 1}</div>
                    <input 
                        type="text" 
                        class="input-field" 
                        placeholder="请输入字段名称(记录该文本的点击时间)" 
                        id="field-${fieldId}"
                    >
                    <button class="delete-btn" data-id="${fieldId}">
                        ×
                    </button>
                `;
        lastFieldElement = fieldElement;
        fieldsContainer.appendChild(fieldElement);
        fieldCount++;
        updateCounter();

        // 添加删除事件
        const deleteBtn = fieldElement.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const input = document.querySelector(`#field-${id}`);

            input.parentElement.remove();
            fieldCount--;
            updateCounter();
            lastFieldElement = null;

            // 如果删除了最后一个字段，显示空状态
            if (fieldCount === 0) {
                fieldsContainer.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">📭</div>
                                <h3>暂无字段</h3>
                                <p>点击下方"添加新字段"按钮开始创建您的第一个字段</p>
                            </div>
                        `;
            }

            // 重新编号
            renumberFields();
        });
    }

    // 重新编号字段
    function renumberFields() {
        const counters = document.querySelectorAll('.field-counter');
        counters.forEach((counter, index) => {
            counter.textContent = index + 1;
        });
    }

    // 更新计数器
    function updateCounter() {
        countElement.textContent = fieldCount;

        // 达到最大数量时禁用添加按钮
        if (fieldCount >= 5) {
            addBtn.disabled = true;
        } else {
            addBtn.disabled = false;
        }
    }

    // 验证保存天数输入
    saveDaysInput.addEventListener('change', function () {
        let days = parseInt(this.value);

        if (isNaN(days)) {
            $message.error("请输入有效的天数");
            return;
        }

        if (days < 1) {
            this.value = 1;
            $message.warning("保存天数不能小于1");
        } else if (days > 30) {
            this.value = 30;
            $message.warning("保存天数不能超过30");
        }
    });

    // 保存所有设置
    saveBtn.addEventListener('click', async function () {
        // 收集所有字段值
        const fields = [];
        const inputs = document.querySelectorAll('.input-field');
        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                fields.push(input.value);
            }
        });

        // 获取保存天数
        const saveDays = parseInt(saveDaysInput.value);
        if (isNaN(saveDays) || saveDays < 1 || saveDays > 30) {
            $message.error("保存天数必须是1到30之间的数字");
            return;
        }

        try {
            // 验证是否有字段
            if (fields.length === 0) {
                const local_data = await loadDataSync(__TABLE_DATA__) || [];
                if(!local_data?.length) {
                    saveObjData({
                        [__FIELDS__]: fields,
                        [__DAY__]: saveDays
                    }, () => {
                        // 显示保存成功消息
                        $message.success(`成功保存${fields.length}个字段，保存天数为${saveDays}天`);
                    })
                    return;
                }

                $message.error("请至少添加一个字段");
                return;
            }

            // 字段全部变更后，需要清空本地的TABLE_DATA
            const local_fields = await loadDataSync(__FIELDS__);
            if(local_fields?.length) {
                if(local_fields.every(t => !fields.includes(t))) {
                    const sure = await $confirm("⚠️警告", "字段已全部变更，保存会清空【记录列表】数据，是否继续？");
                    if(sure) {
                        saveData(__TABLE_DATA__, []);
                    }
                }
            }

            // 保存数据到本地
            saveObjData({
                [__FIELDS__]: fields,
                [__DAY__]: saveDays
            }, () => {
                // 显示保存成功消息
                $message.success(`成功保存${fields.length}个字段，保存天数为${saveDays}天`);
            })
        }catch(err) {
            if(err && err.message) $message.error(err.message);
        }
    });

    // 添加按钮事件
    addBtn.addEventListener('click', addNewField);
})