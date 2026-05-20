/**
 * 主应用程序 - 协调各个组件的交互
 */
class FunctionPlotterApp {
    constructor() {
        this.plotEngine = null;
        this.functionCounter = 0;
        this.currentFunctions = new Map();
        
        this.init();
    }

    /**
     * 初始化应用程序
     */
    init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApplication());
        } else {
            this.setupApplication();
        }
    }

    /**
     * 设置应用程序
     */
    setupApplication() {
        // 初始化绘图引擎
        const canvas = document.getElementById('plotCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        this.plotEngine = new PlotEngine(canvas);
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 初始绘制
        this.plotEngine.redraw();
        
        // 设置状态
        this.updateStatus('就绪 - 请输入函数开始绘制');
        
        console.log('Function Plotter App initialized successfully');
    }

    /**
     * 绑定所有事件监听器
     */
    bindEventListeners() {
        // 函数输入相关
        const functionInput = document.getElementById('functionInput');
        const addFunctionBtn = document.getElementById('addFunction');
        
        if (functionInput && addFunctionBtn) {
            // 回车键添加函数
            functionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addFunction();
                }
            });
            
            // 实时验证输入
            functionInput.addEventListener('input', (e) => {
                this.validateInput(e.target.value);
            });
            
            // 添加函数按钮
            addFunctionBtn.addEventListener('click', () => {
                this.addFunction();
            });
        }

        // 模板按钮
        const templateButtons = document.querySelectorAll('.template-btn');
        templateButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const template = e.target.getAttribute('data-template');
                this.useTemplate(template);
            });
        });

        // 坐标系控制
        const xMinInput = document.getElementById('xMin');
        const xMaxInput = document.getElementById('xMax');
        const yMinInput = document.getElementById('yMin');
        const yMaxInput = document.getElementById('yMax');
        
        [xMinInput, xMaxInput, yMinInput, yMaxInput].forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    this.updateViewRange();
                });
            }
        });

        // 网格显示控制
        const showGridCheckbox = document.getElementById('showGrid');
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', (e) => {
                this.plotEngine.setGridVisible(e.target.checked);
                this.plotEngine.redraw();
            });
        }

        // 重置视图按钮
        const resetViewBtn = document.getElementById('resetView');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetView();
            });
        }

        // 清除所有函数按钮
        const clearAllBtn = document.getElementById('clearAll');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllFunctions();
            });
        }

        // 窗口大小变化时重新绘制
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.plotEngine.setupHighDPI();
                this.plotEngine.redraw();
            }, 100);
        });
    }

    /**
     * 验证用户输入
     */
    validateInput(expression) {
        const errorElement = document.getElementById('errorMessage');
        if (!errorElement) return;

        if (!expression.trim()) {
            this.hideError();
            return;
        }

        const preprocessed = MathParser.preprocessExpression(expression);
        const validation = MathParser.validate(preprocessed);
        
        if (validation.valid) {
            this.hideError();
        } else {
            this.showError(validation.message);
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    /**
     * 隐藏错误信息
     */
    hideError() {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    /**
     * 添加函数
     */
    addFunction() {
        const functionInput = document.getElementById('functionInput');
        if (!functionInput) return;

        const expression = functionInput.value.trim();
        if (!expression) {
            this.showError('请输入函数表达式');
            return;
        }

        try {
            // 预处理表达式
            const preprocessed = MathParser.preprocessExpression(expression);
            
            // 解析函数
            const parser = new MathParser();
            const func = parser.parse(preprocessed);
            
            // 生成唯一ID
            const id = `func_${++this.functionCounter}`;
            
            // 添加到绘图引擎
            this.plotEngine.addFunction(id, expression, func);
            
            // 添加到函数列表显示
            this.addFunctionToList(id, expression);
            
            // 重新绘制
            this.plotEngine.redraw();
            
            // 清空输入框
            functionInput.value = '';
            this.hideError();
            
            this.updateStatus(`成功添加函数：y = ${expression}`);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * 使用模板
     */
    useTemplate(template) {
        const functionInput = document.getElementById('functionInput');
        if (functionInput) {
            functionInput.value = template;
            functionInput.focus();
            this.validateInput(template);
        }
    }

    /**
     * 添加函数到列表显示
     */
    addFunctionToList(id, expression) {
        const functionList = document.getElementById('functionList');
        if (!functionList) return;

        // 如果是第一个函数，移除提示文字
        const noFunctionsMsg = functionList.querySelector('.no-functions');
        if (noFunctionsMsg) {
            noFunctionsMsg.remove();
        }

        // 获取函数颜色
        const functionData = this.plotEngine.getFunctions().get(id);
        const color = functionData ? functionData.color : '#3182ce';
        
        // 创建函数项
        const functionItem = document.createElement('div');
        functionItem.className = 'function-item';
        functionItem.setAttribute('data-id', id);
        
        // 根据颜色添加对应的CSS类
        const colorClass = this.getColorClass(color);
        functionItem.classList.add(colorClass);
        
        functionItem.innerHTML = `
            <div class="function-info">
                <span>y = ${this.formatExpression(expression)}</span>
            </div>
            <div class="function-controls">
                <button class="toggle-btn" onclick="app.toggleFunction('${id}')" title="显示/隐藏">👁</button>
                <input type="color" class="color-picker" id="color_${id}" value="${color}" 
                       onchange="app.changeFunctionColor('${id}', this.value)" title="选择颜色">
                <button class="delete-btn" onclick="app.removeFunction('${id}')" title="删除">🗑</button>
            </div>
        `;
        
        functionList.appendChild(functionItem);
    }

    /**
     * 获取颜色对应的CSS类
     */
    getColorClass(color) {
        const colorMap = {
            '#3182ce': 'color-blue',
            '#e53e3e': 'color-red',
            '#38a169': 'color-green',
            '#dd6b20': 'color-orange',
            '#805ad5': 'color-purple'
        };
        return colorMap[color] || 'color-blue';
    }

    /**
     * 格式化表达式显示
     */
    formatExpression(expression) {
        return expression
            .replace(/\*/g, '×')
            .replace(/\^2/g, '²')
            .replace(/\^3/g, '³')
            .replace(/abs\(/g, '|')
            .replace(/sqrt\(/g, '√');
    }

    /**
     * 切换函数显示/隐藏
     */
    toggleFunction(id) {
        this.plotEngine.toggleFunction(id);
        
        const functionItem = document.querySelector(`[data-id="${id}"]`);
        const toggleBtn = functionItem?.querySelector('.toggle-btn');
        
        if (toggleBtn) {
            const functionData = this.plotEngine.getFunctions().get(id);
            if (functionData?.visible) {
                toggleBtn.classList.remove('hidden');
                toggleBtn.textContent = '👁';
                toggleBtn.title = '隐藏';
            } else {
                toggleBtn.classList.add('hidden');
                toggleBtn.textContent = '👁‍🗨';
                toggleBtn.title = '显示';
            }
        }
        
        this.plotEngine.redraw();
    }

    /**
     * 更改函数颜色
     */
    changeFunctionColor(id, color) {
        this.plotEngine.updateFunctionColor(id, color);
        this.plotEngine.redraw();
        
        this.updateStatus('函数颜色已更新');
    }

    /**
     * 移除函数
     */
    removeFunction(id) {
        // 从绘图引擎移除
        this.plotEngine.removeFunction(id);
        
        // 从列表移除
        const functionItem = document.querySelector(`[data-id="${id}"]`);
        if (functionItem) {
            functionItem.remove();
        }
        
        // 如果没有函数了，显示提示信息
        const functionList = document.getElementById('functionList');
        if (functionList && functionList.children.length === 0) {
            const noFunctionsMsg = document.createElement('p');
            noFunctionsMsg.className = 'no-functions';
            noFunctionsMsg.textContent = '暂无函数，请添加函数开始绘制';
            functionList.appendChild(noFunctionsMsg);
        }
        
        this.plotEngine.redraw();
        this.updateStatus('函数已删除');
    }

    /**
     * 更新视图范围
     */
    updateViewRange() {
        const xMin = parseFloat(document.getElementById('xMin')?.value) || -10;
        const xMax = parseFloat(document.getElementById('xMax')?.value) || 10;
        const yMin = parseFloat(document.getElementById('yMin')?.value) || -10;
        const yMax = parseFloat(document.getElementById('yMax')?.value) || 10;
        
        // 验证范围
        if (xMin >= xMax) {
            this.showError('X轴最小值必须小于最大值');
            return;
        }
        if (yMin >= yMax) {
            this.showError('Y轴最小值必须小于最大值');
            return;
        }
        
        this.plotEngine.setViewRange(xMin, xMax, yMin, yMax);
        this.plotEngine.redraw();
        this.hideError();
    }

    /**
     * 重置视图
     */
    resetView() {
        this.plotEngine.resetView();
        this.plotEngine.redraw();
        
        // 更新输入框
        document.getElementById('xMin').value = -10;
        document.getElementById('xMax').value = 10;
        document.getElementById('yMin').value = -10;
        document.getElementById('yMax').value = 10;
        
        this.updateStatus('视图已重置');
    }

    /**
     * 清除所有函数
     */
    clearAllFunctions() {
        if (this.plotEngine.getFunctions().size === 0) {
            this.updateStatus('没有需要清除的函数');
            return;
        }
        
        // 确认对话框
        if (confirm('确定要清除所有函数吗？')) {
            this.plotEngine.clearAllFunctions();
            
            // 清除函数列表显示
            const functionList = document.getElementById('functionList');
            if (functionList) {
                functionList.innerHTML = '<p class="no-functions">暂无函数，请添加函数开始绘制</p>';
            }
            
            this.plotEngine.redraw();
            this.updateStatus('所有函数已清除');
        }
    }

    /**
     * 更新状态信息
     */
    updateStatus(message) {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.textContent = message;
        }
        
        // 3秒后恢复默认状态
        setTimeout(() => {
            if (statusElement && statusElement.textContent === message) {
                statusElement.textContent = '就绪 - 请输入函数开始绘制';
            }
        }, 3000);
    }

    /**
     * 导出图像
     */
    exportImage() {
        try {
            const dataUrl = this.plotEngine.exportAsImage();
            const link = document.createElement('a');
            link.download = `function-plot-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            this.updateStatus('图像已导出');
        } catch (error) {
            this.showError('导出失败：' + error.message);
        }
    }

    /**
     * 获取应用程序状态
     */
    getAppState() {
        return {
            functions: Array.from(this.plotEngine.getFunctions().entries()),
            viewRange: {
                xMin: this.plotEngine.xMin,
                xMax: this.plotEngine.xMax,
                yMin: this.plotEngine.yMin,
                yMax: this.plotEngine.yMax
            },
            showGrid: this.plotEngine.showGrid
        };
    }
}

// 创建全局应用程序实例
let app;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app = new FunctionPlotterApp();
});

// 添加一些快捷键支持
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'r': // Ctrl+R 重置视图
                e.preventDefault();
                if (app) app.resetView();
                break;
            case 'd': // Ctrl+D 清除所有
                e.preventDefault();
                if (app) app.clearAllFunctions();
                break;
            case 's': // Ctrl+S 导出图像
                e.preventDefault();
                if (app) app.exportImage();
                break;
        }
    }
});

// 防止页面意外关闭时丢失数据
window.addEventListener('beforeunload', (e) => {
    if (app && app.plotEngine.getFunctions().size > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// 导出到全局以便调试
window.app = app;