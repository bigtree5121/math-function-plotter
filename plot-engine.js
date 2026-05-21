/**
 * 绘图引擎 - 负责坐标系和函数曲线的绘制
 */
class PlotEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.functions = new Map(); // 存储函数列表
        this.colors = ['#3182ce', '#e53e3e', '#38a169', '#dd6b20', '#805ad5'];
        this.colorIndex = 0;
        
        // 默认视图范围
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        
        // 设置高DPI支持
        this.setupHighDPI();
        
        // 绑定鼠标事件
        this.setupMouseEvents();
        
        this.showGrid = true;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
    }

    /**
     * 设置高DPI支持
     */
    setupHighDPI() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // 获取画布尺寸，如果还未渲染则使用默认值
        let canvasWidth = rect.width || this.canvas.width || 800;
        let canvasHeight = rect.height || this.canvas.height || 600;
        
        // 设置画布的实际尺寸
        this.canvas.width = canvasWidth * dpr;
        this.canvas.height = canvasHeight * dpr;
        
        // 缩放上下文以匹配设备像素比
        this.ctx.scale(dpr, dpr);
        
        // 设置CSS尺寸
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        // 存储绘图区域尺寸（使用CSS尺寸，因为上下文已被缩放）
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        console.log('高DPI设置完成:', 'dpr=' + dpr, '实际像素=' + this.canvas.width + 'x' + this.canvas.height, 'CSS尺寸=' + this.width + 'x' + this.height);
    }

    /**
     * 设置鼠标事件
     */
    setupMouseEvents() {
        // 鼠标移动显示坐标
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const worldCoord = this.screenToWorld(x, y);
            this.updateCoordinateDisplay(worldCoord.x, worldCoord.y);
            
            if (this.isDragging) {
                const dx = x - this.lastMousePos.x;
                const dy = y - this.lastMousePos.y;
                this.pan(dx, dy);
                this.lastMousePos = { x, y };
                this.redraw();
            }
        });

        // 鼠标按下开始拖拽
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.lastMousePos = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.canvas.style.cursor = 'grabbing';
        });

        // 鼠标释放停止拖拽
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'crosshair';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'crosshair';
        });

        // 鼠标滚轮缩放
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldPos = this.screenToWorld(mouseX, mouseY);
            
            const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
            this.zoom(zoomFactor, worldPos.x, worldPos.y);
            this.redraw();
        });
    }

    /**
     * 屏幕坐标转世界坐标
     */
    screenToWorld(screenX, screenY) {
        const x = this.xMin + (screenX / this.width) * (this.xMax - this.xMin);
        const y = this.yMax - (screenY / this.height) * (this.yMax - this.yMin);
        return { x, y };
    }

    /**
     * 世界坐标转屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        const x = ((worldX - this.xMin) / (this.xMax - this.xMin)) * this.width;
        const y = ((this.yMax - worldY) / (this.yMax - this.yMin)) * this.height;
        return { x, y };
    }

    /**
     * 平移视图
     */
    pan(dx, dy) {
        const worldDx = (dx / this.width) * (this.xMax - this.xMin);
        const worldDy = -(dy / this.height) * (this.yMax - this.yMin);
        
        this.xMin -= worldDx;
        this.xMax -= worldDx;
        this.yMin -= worldDy;
        this.yMax -= worldDy;
    }

    /**
     * 缩放视图
     */
    zoom(factor, centerX, centerY) {
        const newXRange = (this.xMax - this.xMin) * factor;
        const newYRange = (this.yMax - this.yMin) * factor;
        
        const xCenter = centerX || (this.xMin + this.xMax) / 2;
        const yCenter = centerY || (this.yMin + this.yMax) / 2;
        
        this.xMin = xCenter - newXRange / 2;
        this.xMax = xCenter + newXRange / 2;
        this.yMin = yCenter - newYRange / 2;
        this.yMax = yCenter + newYRange / 2;
    }

    /**
     * 设置视图范围
     */
    setViewRange(xMin, xMax, yMin, yMax) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
    }

    /**
     * 重置视图到默认状态
     */
    resetView() {
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
    }

    /**
     * 清空画布
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * 绘制网格
     */
    drawGrid() {
        if (!this.showGrid) return;
        
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 0.5;
        this.ctx.globalAlpha = 0.6;
        
        // 计算网格间隔
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        
        // 动态调整网格密度
        let xStep = Math.pow(10, Math.floor(Math.log10(xRange)) - 1);
        let yStep = Math.pow(10, Math.floor(Math.log10(yRange)) - 1);
        
        if (xRange / xStep > 50) xStep *= 5;
        else if (xRange / xStep > 20) xStep *= 2;
        
        if (yRange / yStep > 50) yStep *= 5;
        else if (yRange / yStep > 20) yStep *= 2;
        
        // 绘制垂直网格线
        const startX = Math.ceil(this.xMin / xStep) * xStep;
        for (let x = startX; x <= this.xMax; x += xStep) {
            const screenPos = this.worldToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(screenPos.x, 0);
            this.ctx.lineTo(screenPos.x, this.height);
            this.ctx.stroke();
        }
        
        // 绘制水平网格线
        const startY = Math.ceil(this.yMin / yStep) * yStep;
        for (let y = startY; y <= this.yMax; y += yStep) {
            const screenPos = this.worldToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenPos.y);
            this.ctx.lineTo(this.width, screenPos.y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }

    /**
     * 绘制坐标轴
     */
    drawAxes() {
        this.ctx.strokeStyle = '#4a5568';
        this.ctx.lineWidth = 2;
        
        // X轴
        if (this.yMin <= 0 && this.yMax >= 0) {
            const y0 = this.worldToScreen(0, 0).y;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y0);
            this.ctx.lineTo(this.width, y0);
            this.ctx.stroke();
        }
        
        // Y轴
        if (this.xMin <= 0 && this.xMax >= 0) {
            const x0 = this.worldToScreen(0, 0).x;
            this.ctx.beginPath();
            this.ctx.moveTo(x0, 0);
            this.ctx.lineTo(x0, this.height);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制坐标轴标签
     */
    drawLabels() {
        this.ctx.fillStyle = '#4a5568';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        
        // 计算标签间隔
        const xRange = this.xMax - this.xMin;
        const yRange = this.yMax - this.yMin;
        
        let xStep = Math.pow(10, Math.floor(Math.log10(xRange)) - 1);
        let yStep = Math.pow(10, Math.floor(Math.log10(yRange)) - 1);
        
        if (xRange / xStep > 20) xStep *= 5;
        else if (xRange / xStep > 10) xStep *= 2;
        
        if (yRange / yStep > 20) yStep *= 5;
        else if (yRange / yStep > 10) yStep *= 2;
        
        // X轴标签
        if (this.yMin <= 0 && this.yMax >= 0) {
            const y0 = this.worldToScreen(0, 0).y;
            const startX = Math.ceil(this.xMin / xStep) * xStep;
            
            for (let x = startX; x <= this.xMax; x += xStep) {
                if (Math.abs(x) < 1e-10) continue; // 跳过原点
                const screenPos = this.worldToScreen(x, 0);
                this.ctx.fillText(x.toFixed(1), screenPos.x, y0 + 5);
            }
        }
        
        // Y轴标签
        if (this.xMin <= 0 && this.xMax >= 0) {
            const x0 = this.worldToScreen(0, 0).x;
            const startY = Math.ceil(this.yMin / yStep) * yStep;
            
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            
            for (let y = startY; y <= this.yMax; y += yStep) {
                if (Math.abs(y) < 1e-10) continue; // 跳过原点
                const screenPos = this.worldToScreen(0, y);
                this.ctx.fillText(y.toFixed(1), x0 - 5, screenPos.y);
            }
        }
        
        // 原点标签
        if (this.xMin <= 0 && this.xMax >= 0 && this.yMin <= 0 && this.yMax >= 0) {
            const origin = this.worldToScreen(0, 0);
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('O', origin.x - 5, origin.y + 5);
        }
    }

    /**
     * 添加函数
     */
    addFunction(id, expression, func) {
        const color = this.colors[this.colorIndex % this.colors.length];
        this.colorIndex++;
        
        this.functions.set(id, {
            expression: expression,
            func: func,
            color: color,
            visible: true
        });
    }

    /**
     * 移除函数
     */
    removeFunction(id) {
        this.functions.delete(id);
    }

    /**
     * 切换函数可见性
     */
    toggleFunction(id) {
        if (this.functions.has(id)) {
            const func = this.functions.get(id);
            func.visible = !func.visible;
        }
    }

    /**
     * 清除所有函数
     */
    clearAllFunctions() {
        this.functions.clear();
        this.colorIndex = 0;
    }

    /**
     * 绘制函数曲线
     */
    drawFunction(functionData) {
        if (!functionData.visible) return;
        
        console.log('绘制函数:', functionData.expression);
        console.log('视图范围:', this.xMin, this.xMax, this.yMin, this.yMax);
        console.log('画布尺寸:', this.width, this.height);
        
        // 确保上下文状态正确
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = functionData.color;
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        // 测试：绘制一条对角线
        this.ctx.beginPath();
        this.ctx.moveTo(10, 10);
        this.ctx.lineTo(100, 100);
        this.ctx.stroke();
        console.log('测试线已绘制');
        
        const step = (this.xMax - this.xMin) / (this.width * 2); // 高精度采样
        let isDrawing = false;
        let prevY = null;
        let pointCount = 0;
        let startX = null;
        let startY = null;
        
        console.log('开始绘制函数曲线');
        
        for (let x = this.xMin; x <= this.xMax; x += step) {
            try {
                const y = functionData.func(x);
                
                // 调试：每隔100个点输出一次
                if (pointCount % 100 === 0) {
                    console.log(`点 (${x.toFixed(2)}, ${y})`);
                }
                pointCount++;
                
                // 检查是否为有效数值
                if (isNaN(y) || !isFinite(y)) {
                    console.log(`无效值: x=${x}, y=${y}`);
                    if (isDrawing) {
                        this.ctx.stroke();
                        isDrawing = false;
                    }
                    prevY = null;
                    continue;
                }
                
                // 检查是否在显示范围内（考虑10%的边界）
                const margin = (this.yMax - this.yMin) * 0.1;
                if (y < this.yMin - margin || y > this.yMax + margin) {
                    console.log(`超出范围: x=${x}, y=${y} (范围: ${this.yMin}-${this.yMax})`);
                    if (isDrawing) {
                        this.ctx.stroke();
                        isDrawing = false;
                    }
                    prevY = null;
                    continue;
                }
                
                // 检测X轴交点（y=0）
                if (prevY !== null && prevY * y < 0) {
                    const root = this.bisection(functionData.func, x - step, x);
                    if (root !== null) {
                        this.drawAxisIntersection(root, 0, 'x');
                    }
                }
                
                const screenPos = this.worldToScreen(x, y);
                console.log(`屏幕坐标: (${screenPos.x.toFixed(2)}, ${screenPos.y.toFixed(2)})`);
                
                if (!isDrawing) {
                    // 开始新路径
                    this.ctx.beginPath();
                    this.ctx.moveTo(screenPos.x, screenPos.y);
                    startX = x;
                    startY = y;
                    isDrawing = true;
                    console.log(`开始新路径: (${startX}, ${startY})`);
                } else {
                    this.ctx.lineTo(screenPos.x, screenPos.y);
                }
                
                prevY = y;
                
            } catch (error) {
                console.log('绘制错误:', error);
                if (isDrawing) {
                    this.ctx.stroke();
                    isDrawing = false;
                }
                prevY = null;
            }
        }
        
        if (isDrawing) {
            this.ctx.stroke();
            console.log('完成路径绘制，共绘制', pointCount, '个点');
        } else {
            console.log('没有绘制任何点');
        }
        
        // 检测Y轴交点（x=0）
        if (this.xMin <= 0 && this.xMax >= 0) {
            try {
                const y = functionData.func(0);
                if (isFinite(y) && y >= this.yMin && y <= this.yMax) {
                    this.drawAxisIntersection(0, y, 'y');
                }
            } catch {}
        }
    }

    /**
     * 绘制坐标轴交点标记
     */
    drawAxisIntersection(x, y, axis) {
        const screenPos = this.worldToScreen(x, y);
        
        // 绘制交点标记
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1a202c';
        this.ctx.fill();
        this.ctx.strokeStyle = '#48bb78';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#48bb78';
        this.ctx.fill();
        
        // 绘制坐标标签
        const label = axis === 'x' ? `(${x.toFixed(2)}, 0)` : `(0, ${y.toFixed(2)})`;
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        
        let labelX = screenPos.x + 10;
        let labelY = screenPos.y - 6;
        
        if (axis === 'y') {
            labelX = screenPos.x + 10;
            labelY = screenPos.y - 6;
        }
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText(label, labelX, labelY);
        this.ctx.fillStyle = '#48bb78';
        this.ctx.fillText(label, labelX, labelY);
    }

    /**
     * 绘制所有函数
     */
    drawAllFunctions() {
        this.functions.forEach((functionData) => {
            this.drawFunction(functionData);
        });
    }

    /**
     * 完整重绘
     */
    redraw() {
        this.clear();
        this.drawGrid();
        this.drawAxes();
        this.drawLabels();
        this.drawAllFunctions();
        this.drawIntersectionPoints();
    }

    /**
     * 更新坐标显示
     */
    updateCoordinateDisplay(x, y) {
        const coordinateInfo = document.getElementById('coordinateInfo');
        if (coordinateInfo) {
            coordinateInfo.textContent = `坐标：(${x.toFixed(3)}, ${y.toFixed(3)})`;
        }
    }

    /**
     * 设置网格显示
     */
    setGridVisible(visible) {
        this.showGrid = visible;
    }

    /**
     * 获取函数列表
     */
    getFunctions() {
        return this.functions;
    }

    /**
     * 更新函数颜色
     */
    updateFunctionColor(id, color) {
        if (this.functions.has(id)) {
            const func = this.functions.get(id);
            func.color = color;
        }
    }

    /**
     * 导出为图像
     */
    exportAsImage() {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * 计算两个函数的交点
     * @returns {Array} 交点数组，每个元素包含 {x, y}
     */
    findIntersectionPoints() {
        const intersections = [];
        const funcs = Array.from(this.functions.values()).filter(f => f.visible);
        
        if (funcs.length < 2) return intersections;
        
        for (let i = 0; i < funcs.length; i++) {
            for (let j = i + 1; j < funcs.length; j++) {
                const f1 = funcs[i];
                const f2 = funcs[j];
                
                const diff = (x) => {
                    try {
                        return f1.func(x) - f2.func(x);
                    } catch {
                        return NaN;
                    }
                };
                
                const step = (this.xMax - this.xMin) / 200;
                let x = this.xMin;
                
                while (x < this.xMax) {
                    try {
                        const y1 = f1.func(x);
                        const y2 = f2.func(x);
                        const y1Next = f1.func(x + step);
                        const y2Next = f2.func(x + step);
                        
                        if (isFinite(y1) && isFinite(y2)) {
                            const diff1 = y1 - y2;
                            const diff2 = y1Next - y2Next;

                            if (Math.abs(diff1) < 0.01 && isFinite(y1)) {
                                const root = this.bisection(diff, x, x + step);
                                if (root !== null) {
                                    try {
                                        const y = f1.func(root);
                                        if (isFinite(y)) {
                                            intersections.push({ x: root, y: y });
                                        }
                                    } catch {}
                                }
                            }

                            if (diff1 * diff2 < 0) {
                                const root = this.bisection(diff, x, x + step);
                                if (root !== null) {
                                    try {
                                        const y = f1.func(root);
                                        if (isFinite(y)) {
                                            intersections.push({ x: root, y: y });
                                        }
                                    } catch {}
                                }
                            }
                        }
                    } catch {}
                    x += step;
                }
            }
        }
        
        return this.removeDuplicateIntersections(intersections);
    }

    /**
     * 二分法求根
     */
    bisection(f, a, b, tolerance = 1e-6, maxIterations = 50) {
        let fa = f(a);
        let fb = f(b);
        
        if (fa * fb > 0) return null;
        
        for (let i = 0; i < maxIterations; i++) {
            const mid = (a + b) / 2;
            const fmid = f(mid);
            
            if (Math.abs(fmid) < tolerance) return mid;
            
            if (fa * fmid < 0) {
                b = mid;
                fb = fmid;
            } else {
                a = mid;
                fa = fmid;
            }
        }
        
        return (a + b) / 2;
    }

    /**
     * 去除重复的交点
     */
    removeDuplicateIntersections(intersections) {
        const filtered = [];
        const minDist = 0.1;
        
        for (const pt of intersections) {
            let isDuplicate = false;
            for (const existing of filtered) {
                const dist = Math.sqrt(Math.pow(pt.x - existing.x, 2) + Math.pow(pt.y - existing.y, 2));
                if (dist < minDist) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                filtered.push(pt);
            }
        }
        
        return filtered;
    }

    /**
     * 绘制交点标记
     */
    drawIntersectionPoints() {
        const intersections = this.findIntersectionPoints();
        
        for (const pt of intersections) {
            const screenPos = this.worldToScreen(pt.x, pt.y);
            
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = '#1a202c';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffd700';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fill();
            
            const label = `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`;
            this.ctx.font = 'bold 11px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillStyle = '#1a202c';
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(label, screenPos.x + 12, screenPos.y - 8);
            this.ctx.fillText(label, screenPos + 12, screenPos.y - 8);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(label, screenPos.x + 12, screenPos.y - 8);
        }
    }

    /**
     * 获取交点列表
     */
    getIntersectionPoints() {
        return this.findIntersectionPoints();
    }
}

// 导出到全局
window.PlotEngine = PlotEngine;