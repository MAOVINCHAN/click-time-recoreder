/**
 * 自定义 confirm 弹窗
 * @param {string} title - 弹窗标题
 * @param {string} message - 弹窗消息内容
 * @param {object} options - 可选配置项
 * @param {string} options.confirmText - 确认按钮文字 (默认: '确定')
 * @param {string} options.cancelText - 取消按钮文字 (默认: '取消')
 * @param {string} options.confirmColor - 确认按钮颜色 (默认: '#1890ff')
 * @param {string} options.cancelColor - 取消按钮颜色 (默认: '#f5f5f5')
 */
function $confirm(
    title,
    message,
    options = {}
) {
    return new Promise((resolve, reject) => {
        // 获取DOM元素
        const overlay = document.getElementById("customConfirmOverlay");
        const titleEl = document.getElementById("confirmTitle");
        const messageEl = document.getElementById("confirmMessage");
        const okBtn = document.getElementById("confirmOkBtn");
        const cancelBtn = document.getElementById("confirmCancelBtn");

        // 设置默认选项
        const {
            confirmText = "确定",
            cancelText = "取消",
            confirmColor = "#1890ff",
            cancelColor = "#f5f5f5",
        } = options;

        // 设置弹窗内容
        titleEl.textContent = title;
        messageEl.textContent = message;
        okBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        // 设置按钮颜色
        okBtn.style.backgroundColor = confirmColor;
        cancelBtn.style.backgroundColor = cancelColor;

        // 显示弹窗
        overlay.style.display = "flex";

        // 确认按钮点击事件
        const handleConfirm = () => {
            overlay.style.display = "none";
            // 移除事件监听
            okBtn.removeEventListener("click", handleConfirm);
            cancelBtn.removeEventListener("click", handleCancel);
            resolve(true);
        };

        // 取消按钮点击事件
        const handleCancel = () => {
            overlay.style.display = "none";
            // 移除事件监听
            okBtn.removeEventListener("click", handleConfirm);
            cancelBtn.removeEventListener("click", handleCancel);
            reject(false);
        };

        // 添加事件监听
        okBtn.addEventListener("click", handleConfirm);
        cancelBtn.addEventListener("click", handleCancel);

        // 点击遮罩层关闭弹窗（可选）
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                handleCancel();
            }
        });
    });
}


window.$message = {
    /**
     * 显示消息
     * @param {string} content - 消息内容
     * @param {string} type - 消息类型 (success/warning/error)
     * @param {number} duration - 显示时长(毫秒)，默认3000
     */
    show: function (content, type, duration = 3000) {
        const container = document.getElementById('message-container');
        const message = document.createElement('div');
        const icons = {
            success: '✓',
            warning: '⚠',
            error: '✕'
        };
        message.className = `message message-${type}`;
        message.innerHTML = `
                        <span class="message-icon">${icons[type]}</span>
                        <span class="message-content">${content}</span>
                    `;

        container.appendChild(message);

        // 自动消失
        setTimeout(() => {
            message.classList.add('fade-out');
            setTimeout(() => {
                message.remove();
            }, 300);
        }, duration);
    },

    /**
     * 成功消息
     * @param {string} content - 消息内容
     * @param {number} duration - 显示时长(毫秒)，默认3000
     */
    success: function (content, duration = 3000) {
        this.show(content, 'success', duration);
    },

    /**
     * 警告消息
     * @param {string} content - 消息内容
     * @param {number} duration - 显示时长(毫秒)，默认3000
     */
    warning: function (content, duration = 3000) {
        this.show(content, 'warning', duration);
    },

    /**
     * 错误消息
     * @param {string} content - 消息内容
     * @param {number} duration - 显示时长(毫秒)，默认3000
     */
    error: function (content, duration = 3000) {
        this.show(content, 'error', duration);
    }
};