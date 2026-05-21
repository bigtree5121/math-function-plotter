const fs = require('fs');

const mathParserCode = fs.readFileSync('math-parser.js', 'utf-8');
const evalCode = mathParserCode.replace('window.MathParser = MathParser;', 'globalThis.MathParser = MathParser;');
eval(evalCode);

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
    if (condition) {
        passed++;
        console.log(`  ✓ ${testName}`);
    } else {
        failed++;
        failures.push(testName);
        console.log(`  ✗ ${testName}`);
    }
}

function assertApprox(actual, expected, tolerance, testName) {
    const ok = Math.abs(actual - expected) < tolerance;
    if (ok) {
        passed++;
        console.log(`  ✓ ${testName} (got ${actual.toFixed(6)})`);
    } else {
        failed++;
        failures.push(testName);
        console.log(`  ✗ ${testName} (expected ~${expected}, got ${actual})`);
    }
}

function section(name) {
    console.log(`\n=== ${name} ===`);
}

section("1. 数学表达式解析器 - 基本运算");

(() => {
    const parser = new MathParser();
    const f = parser.parse('2+3');
    assertApprox(f(0), 5, 1e-6, '2+3 = 5');

    const f2 = new MathParser().parse('10-4');
    assertApprox(f2(0), 6, 1e-6, '10-4 = 6');

    const f3 = new MathParser().parse('3*7');
    assertApprox(f3(0), 21, 1e-6, '3*7 = 21');

    const f4 = new MathParser().parse('15/4');
    assertApprox(f4(0), 3.75, 1e-6, '15/4 = 3.75');

    const f5 = new MathParser().parse('2^10');
    assertApprox(f5(0), 1024, 1e-6, '2^10 = 1024');
})();

section("2. 数学表达式解析器 - 变量x");

(() => {
    const f = new MathParser().parse('x');
    assertApprox(f(5), 5, 1e-6, 'x=5时 f(x)=5');
    assertApprox(f(-3), -3, 1e-6, 'x=-3时 f(x)=-3');

    const f2 = new MathParser().parse('x^2');
    assertApprox(f2(3), 9, 1e-6, 'x=3时 x^2=9');
    assertApprox(f2(-3), 9, 1e-6, 'x=-3时 x^2=9');

    const f3 = new MathParser().parse('2*x+1');
    assertApprox(f3(3), 7, 1e-6, 'x=3时 2x+1=7');
    assertApprox(f3(-2), -3, 1e-6, 'x=-2时 2x+1=-3');
})();

section("3. 数学表达式解析器 - 一元负号");

(() => {
    const f = new MathParser().parse('-x');
    assertApprox(f(5), -5, 1e-6, '-x: x=5 => -5');
    assertApprox(f(-3), 3, 1e-6, '-x: x=-3 => 3');

    const f2 = new MathParser().parse('-x^2');
    assertApprox(f2(3), -9, 1e-6, '-x^2: x=3 => -9');
    assertApprox(f2(-3), -9, 1e-6, '-x^2: x=-3 => -9');

    const f3 = new MathParser().parse('-(x+1)');
    assertApprox(f3(2), -3, 1e-6, '-(x+1): x=2 => -3');
})();

section("4. 数学表达式解析器 - 三角函数");

(() => {
    const f = new MathParser().parse('sin(x)');
    assertApprox(f(0), 0, 1e-6, 'sin(0) = 0');
    assertApprox(f(Math.PI / 2), 1, 1e-6, 'sin(π/2) = 1');

    const f2 = new MathParser().parse('cos(x)');
    assertApprox(f2(0), 1, 1e-6, 'cos(0) = 1');
    assertApprox(f2(Math.PI), -1, 1e-6, 'cos(π) = -1');

    const f3 = new MathParser().parse('tan(x)');
    assertApprox(f3(0), 0, 1e-6, 'tan(0) = 0');
})();

section("5. 数学表达式解析器 - 预处理（隐式乘法）");

(() => {
    const expr = MathParser.preprocessExpression('2x');
    assert(expr === '2*x', '2x => 2*x');

    const expr2 = MathParser.preprocessExpression('3(x+1)');
    assert(expr2 === '3*(x+1)', '3(x+1) => 3*(x+1)');

    const expr3 = MathParser.preprocessExpression('(x+1)2');
    assert(expr3 === '(x+1)*2', '(x+1)2 => (x+1)*2');

    const f = new MathParser();
    const func = f.parse(MathParser.preprocessExpression('2x'));
    assertApprox(func(3), 6, 1e-6, '2x: x=3 => 6');
})();

section("6. 数学表达式解析器 - 验证功能");

(() => {
    const v1 = MathParser.validate('x^2');
    assert(v1.valid === true, 'x^2 是有效表达式');

    const v2 = MathParser.validate('sin(x)');
    assert(v2.valid === true, 'sin(x) 是有效表达式');

    const v3 = MathParser.validate('x+');
    assert(v3.valid === false, 'x+ 是无效表达式');

    const v4 = MathParser.validate('(x+1');
    assert(v4.valid === false, '(x+1 缺少右括号');
})();

section("7. 坐标转换 - 世界坐标↔屏幕坐标");

(() => {
    const engine = {
        xMin: -10, xMax: 10,
        yMin: -10, yMax: 10,
        width: 800, height: 600,
        worldToScreen(worldX, worldY) {
            const x = ((worldX - this.xMin) / (this.xMax - this.xMin)) * this.width;
            const y = ((this.yMax - worldY) / (this.yMax - this.yMin)) * this.height;
            return { x, y };
        },
        screenToWorld(screenX, screenY) {
            const x = this.xMin + (screenX / this.width) * (this.xMax - this.xMin);
            const y = this.yMax - (screenY / this.height) * (this.yMax - this.yMin);
            return { x, y };
        }
    };

    const origin = engine.worldToScreen(0, 0);
    assertApprox(origin.x, 400, 1e-6, '原点屏幕X = 400');
    assertApprox(origin.y, 300, 1e-6, '原点屏幕Y = 300');

    const topLeft = engine.worldToScreen(-10, 10);
    assertApprox(topLeft.x, 0, 1e-6, '左上角屏幕X = 0');
    assertApprox(topLeft.y, 0, 1e-6, '左上角屏幕Y = 0');

    const bottomRight = engine.worldToScreen(10, -10);
    assertApprox(bottomRight.x, 800, 1e-6, '右下角屏幕X = 800');
    assertApprox(bottomRight.y, 600, 1e-6, '右下角屏幕Y = 600');

    const back = engine.screenToWorld(400, 300);
    assertApprox(back.x, 0, 1e-6, '屏幕中心 => 世界原点X');
    assertApprox(back.y, 0, 1e-6, '屏幕中心 => 世界原点Y');

    const thirdQuadrant = engine.worldToScreen(-5, -5);
    assert(thirdQuadrant.x > 0 && thirdQuadrant.x < 400, '第三象限点屏幕X在左半区');
    assert(thirdQuadrant.y > 300 && thirdQuadrant.y < 600, '第三象限点屏幕Y在下半区');
})();

section("8. 第三象限函数值计算");

(() => {
    const f1 = new MathParser().parse('x');
    assertApprox(f1(-5), -5, 1e-6, 'y=x: x=-5 => y=-5 (第三象限)');
    assertApprox(f1(-3), -3, 1e-6, 'y=x: x=-3 => y=-3 (第三象限)');

    const f2 = new MathParser().parse('x^2-9');
    assertApprox(f2(-4), 7, 1e-6, 'y=x^2-9: x=-4 => y=7');
    assertApprox(f2(-2), -5, 1e-6, 'y=x^2-9: x=-2 => y=-5 (第三象限)');

    const f3 = new MathParser().parse('-0.5*x^2+4');
    assertApprox(f3(-4), -4, 1e-6, 'y=-0.5x^2+4: x=-4 => y=-4 (第三象限)');
    assertApprox(f3(4), -4, 1e-6, 'y=-0.5x^2+4: x=4 => y=-4 (第四象限)');

    const f4 = new MathParser().parse('x^3');
    assertApprox(f4(-2), -8, 1e-6, 'y=x^3: x=-2 => y=-8 (第三象限)');
    assertApprox(f4(-0.5), -0.125, 1e-6, 'y=x^3: x=-0.5 => y=-0.125 (第三象限)');
})();

section("9. 二分法求根");

(() => {
    function bisection(f, a, b, tolerance = 1e-6, maxIterations = 50) {
        let fa = f(a);
        let fb = f(b);
        if (fa * fb > 0) return null;
        for (let i = 0; i < maxIterations; i++) {
            const mid = (a + b) / 2;
            const fmid = f(mid);
            if (Math.abs(fmid) < tolerance) return mid;
            if (fa * fmid < 0) { b = mid; fb = fmid; }
            else { a = mid; fa = fmid; }
        }
        return (a + b) / 2;
    }

    const f1 = (x) => x - 2;
    const root1 = bisection(f1, 0, 5);
    assertApprox(root1, 2, 1e-4, 'y=x-2 的根 x=2');

    const f2 = (x) => x * x - 4;
    const root2 = bisection(f2, 0, 5);
    assertApprox(root2, 2, 1e-4, 'y=x^2-4 正根 x=2');
    const root2b = bisection(f2, -5, 0);
    assertApprox(root2b, -2, 1e-4, 'y=x^2-4 负根 x=-2');

    const f3 = (x) => Math.sin(x);
    const root3 = bisection(f3, 3, 4);
    assertApprox(root3, Math.PI, 1e-4, 'sin(x) 在 [3,4] 的根 x≈π');

    const f4 = (x) => x + 3;
    const root4 = bisection(f4, -5, 0);
    assertApprox(root4, -3, 1e-4, 'y=x+3 的根 x=-3 (第三象限交点)');
})();

section("10. 函数间交点检测");

(() => {
    function findIntersections(f1, f2, xMin, xMax) {
        const intersections = [];
        const step = (xMax - xMin) / 200;
        let x = xMin;
        function bisection(f, a, b, tolerance = 1e-6, maxIterations = 50) {
            let fa = f(a), fb = f(b);
            if (fa * fb > 0) return null;
            for (let i = 0; i < maxIterations; i++) {
                const mid = (a + b) / 2;
                const fmid = f(mid);
                if (Math.abs(fmid) < tolerance) return mid;
                if (fa * fmid < 0) { b = mid; fb = fmid; }
                else { a = mid; fa = fmid; }
            }
            return (a + b) / 2;
        }
        while (x < xMax) {
            try {
                const y1 = f1(x), y2 = f2(x);
                const y1Next = f1(x + step), y2Next = f2(x + step);
                if (isFinite(y1) && isFinite(y2)) {
                    const diff1 = y1 - y2;
                    const diff2 = y1Next - y2Next;
                    const diff = (t) => f1(t) - f2(t);
                    if (diff1 * diff2 < 0) {
                        const root = bisection(diff, x, x + step);
                        if (root !== null) {
                            intersections.push({ x: root, y: f1(root) });
                        }
                    }
                }
            } catch {}
            x += step;
        }
        return intersections;
    }

    const f1 = new MathParser().parse('x');
    const f2 = new MathParser().parse('-x+2');
    const ints1 = findIntersections(f1, f2, -10, 10);
    assert(ints1.length >= 1, 'y=x 与 y=-x+2 有交点');
    if (ints1.length >= 1) {
        assertApprox(ints1[0].x, 1, 0.1, '交点 x≈1');
        assertApprox(ints1[0].y, 1, 0.1, '交点 y≈1');
    }

    const f3 = new MathParser().parse('x^2');
    const f4 = new MathParser().parse('x+2');
    const ints2 = findIntersections(f3, f4, -10, 10);
    assert(ints2.length >= 2, 'y=x^2 与 y=x+2 有2个交点');

    const f5 = new MathParser().parse('sin(x)');
    const f6 = new MathParser().parse('0.5*x');
    const ints3 = findIntersections(f5, f6, -10, 10);
    assert(ints3.length >= 1, 'y=sin(x) 与 y=0.5x 有交点');
})();

section("11. 坐标轴交点检测");

(() => {
    function findXAxisIntersections(func, xMin, xMax) {
        const roots = [];
        const step = (xMax - xMin) / 500;
        let prevY = null;
        function bisection(f, a, b, tolerance = 1e-6, maxIterations = 50) {
            let fa = f(a), fb = f(b);
            if (fa * fb > 0) return null;
            for (let i = 0; i < maxIterations; i++) {
                const mid = (a + b) / 2;
                const fmid = f(mid);
                if (Math.abs(fmid) < tolerance) return mid;
                if (fa * fmid < 0) { b = mid; fb = fmid; }
                else { a = mid; fa = fmid; }
            }
            return (a + b) / 2;
        }
        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = func(x);
                if (!isFinite(y)) { prevY = null; continue; }
                if (y < -11 || y > 11) { prevY = y; continue; }
                if (prevY !== null && prevY * y < 0) {
                    const root = bisection(func, x - step, x);
                    if (root !== null) roots.push(root);
                }
                prevY = y;
            } catch { prevY = null; }
        }
        return roots;
    }

    const f1 = new MathParser().parse('x-2');
    const roots1 = findXAxisIntersections(f1, -10, 10);
    assert(roots1.length >= 1, 'y=x-2 与X轴有1个交点');
    if (roots1.length >= 1) assertApprox(roots1[0], 2, 0.01, '交点 x≈2');

    const f2 = new MathParser().parse('x^2-4');
    const roots2 = findXAxisIntersections(f2, -10, 10);
    assert(roots2.length >= 2, 'y=x^2-4 与X轴有2个交点');

    const f3 = new MathParser().parse('x+3');
    const roots3 = findXAxisIntersections(f3, -10, 10);
    assert(roots3.length >= 1, 'y=x+3 与X轴有1个交点');
    if (roots3.length >= 1) assertApprox(roots3[0], -3, 0.01, '交点 x≈-3 (第三象限)');

    const f4 = new MathParser().parse('sin(x)');
    const roots4 = findXAxisIntersections(f4, -10, 10);
    assert(roots4.length >= 3, 'y=sin(x) 在[-10,10]与X轴有多个交点');

    const yAtZero_f1 = f1(0);
    assertApprox(yAtZero_f1, -2, 1e-6, 'y=x-2 在x=0时 y=-2 (Y轴交点)');

    const yAtZero_f3 = f3(0);
    assertApprox(yAtZero_f3, 3, 1e-6, 'y=x+3 在x=0时 y=3 (Y轴交点)');
})();

section("12. 第三象限显示范围检查");

(() => {
    function simulateDrawFunction(func, xMin, xMax, yMin, yMax, width) {
        const step = (xMax - xMin) / (width * 2);
        let drawnPoints = [];
        let isDrawing = false;
        let prevY = null;

        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = func(x);
                if (isNaN(y) || !isFinite(y)) {
                    isDrawing = false;
                    prevY = null;
                    continue;
                }
                if (y < yMin - (yMax - yMin) * 0.1 || y > yMax + (yMax - yMin) * 0.1) {
                    isDrawing = false;
                    prevY = y;
                    continue;
                }
                drawnPoints.push({ x, y, quadrant: x < 0 && y < 0 ? 3 : (x >= 0 && y >= 0 ? 1 : (x < 0 ? 2 : 4)) });
                isDrawing = true;
                prevY = y;
            } catch {
                isDrawing = false;
                prevY = null;
            }
        }
        return drawnPoints;
    }

    const f1 = new MathParser().parse('x');
    const points1 = simulateDrawFunction(f1, -10, 10, -10, 10, 800);
    const q3Points1 = points1.filter(p => p.quadrant === 3);
    assert(q3Points1.length > 0, 'y=x 在第三象限有绘制点');
    console.log(`    y=x 第三象限点数: ${q3Points1.length} / 总点数: ${points1.length}`);

    const f2 = new MathParser().parse('x^3');
    const points2 = simulateDrawFunction(f2, -10, 10, -10, 10, 800);
    const q3Points2 = points2.filter(p => p.quadrant === 3);
    assert(q3Points2.length > 0, 'y=x^3 在第三象限有绘制点');
    console.log(`    y=x^3 第三象限点数: ${q3Points2.length} / 总点数: ${points2.length}`);

    const f3 = new MathParser().parse('-0.5*x^2+4');
    const points3 = simulateDrawFunction(f3, -10, 10, -10, 10, 800);
    const q3Points3 = points3.filter(p => p.quadrant === 3);
    assert(q3Points3.length > 0, 'y=-0.5x^2+4 在第三象限有绘制点');
    console.log(`    y=-0.5x^2+4 第三象限点数: ${q3Points3.length} / 总点数: ${points3.length}`);

    const f4 = new MathParser().parse('x^2-9');
    const points4 = simulateDrawFunction(f4, -10, 10, -10, 10, 800);
    const q3Points4 = points4.filter(p => p.quadrant === 3);
    assert(q3Points4.length > 0, 'y=x^2-9 在第三象限有绘制点');
    console.log(`    y=x^2-9 第三象限点数: ${q3Points4.length} / 总点数: ${points4.length}`);
})();

section("13. prevY状态保持测试（超出范围后恢复）");

(() => {
    function simulateDrawWithPrevYTracking(func, xMin, xMax, yMin, yMax, width) {
        const step = (xMax - xMin) / (width * 2);
        let prevY = null;
        let xAxisCrossings = [];

        for (let x = xMin; x <= xMax; x += step) {
            try {
                const y = func(x);
                if (isNaN(y) || !isFinite(y)) {
                    prevY = null;
                    continue;
                }
                if (y < yMin - (yMax - yMin) * 0.1 || y > yMax + (yMax - yMin) * 0.1) {
                    prevY = y;
                    continue;
                }
                if (prevY !== null && prevY * y < 0) {
                    xAxisCrossings.push({ x, prevY, y });
                }
                prevY = y;
            } catch { prevY = null; }
        }
        return xAxisCrossings;
    }

    const f1 = new MathParser().parse('x^2-25');
    const crossings1 = simulateDrawWithPrevYTracking(f1, -10, 10, -10, 10, 800);
    assert(crossings1.length >= 2, 'y=x^2-25 在[-10,10]穿过X轴2次');
    console.log(`    y=x^2-25 X轴穿越次数: ${crossings1.length}`);

    const f2 = new MathParser().parse('x^3');
    const crossings2 = simulateDrawWithPrevYTracking(f2, -10, 10, -10, 10, 800);
    assert(crossings2.length >= 1, 'y=x^3 穿过X轴(原点)');
    console.log(`    y=x^3 X轴穿越次数: ${crossings2.length}`);

    const f3 = new MathParser().parse('100*sin(x)');
    const crossings3 = simulateDrawWithPrevYTracking(f3, -10, 10, -10, 10, 800);
    console.log(`    y=100sin(x) X轴穿越次数: ${crossings3.length} (超出范围后prevY保持)`);
})();

section("14. 自动调整视图范围");

(() => {
    function autoFitView(funcs, xMin, xMax) {
        let minY = Infinity, maxY = -Infinity;
        const step = (xMax - xMin) / 500;
        for (let x = xMin; x <= xMax; x += step) {
            for (const func of funcs) {
                try {
                    const y = func(x);
                    if (isFinite(y)) {
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                } catch {}
            }
        }
        if (minY === Infinity) return { yMin: -10, yMax: 10 };
        const yMargin = (maxY - minY) * 0.15;
        return { yMin: minY - yMargin, yMax: maxY + yMargin };
    }

    const f1 = new MathParser().parse('x^2');
    const range1 = autoFitView([f1], -10, 10);
    assert(range1.yMin <= 0, 'y=x^2 自动调整后 yMin <= 0');
    assert(range1.yMax >= 100, 'y=x^2 自动调整后 yMax >= 100');
    console.log(`    y=x^2 自动范围: yMin=${range1.yMin.toFixed(1)}, yMax=${range1.yMax.toFixed(1)}`);

    const f2 = new MathParser().parse('-0.5*x^2+4');
    const range2 = autoFitView([f2], -10, 10);
    assert(range2.yMax >= 4, 'y=-0.5x^2+4 自动调整后 yMax >= 4');
    assert(range2.yMin <= -16, 'y=-0.5x^2+4 自动调整后 yMin <= -16 (包含第三象限)');
    console.log(`    y=-0.5x^2+4 自动范围: yMin=${range2.yMin.toFixed(1)}, yMax=${range2.yMax.toFixed(1)}`);

    const f3 = new MathParser().parse('x');
    const range3 = autoFitView([f3], -10, 10);
    assert(range3.yMin <= -10, 'y=x 自动调整后 yMin <= -10');
    assert(range3.yMax >= 10, 'y=x 自动调整后 yMax >= 10');
    console.log(`    y=x 自动范围: yMin=${range3.yMin.toFixed(1)}, yMax=${range3.yMax.toFixed(1)}`);
})();

section("15. 多函数场景");

(() => {
    const f1 = new MathParser().parse('x');
    const f2 = new MathParser().parse('x^2');
    const f3 = new MathParser().parse('-x+2');

    function findIntersections(funcs, xMin, xMax) {
        const intersections = [];
        function bisection(f, a, b, tolerance = 1e-6, maxIterations = 50) {
            let fa = f(a), fb = f(b);
            if (fa * fb > 0) return null;
            for (let i = 0; i < maxIterations; i++) {
                const mid = (a + b) / 2;
                const fmid = f(mid);
                if (Math.abs(fmid) < tolerance) return mid;
                if (fa * fmid < 0) { b = mid; fb = fmid; }
                else { a = mid; fa = fmid; }
            }
            return (a + b) / 2;
        }
        for (let i = 0; i < funcs.length; i++) {
            for (let j = i + 1; j < funcs.length; j++) {
                const diff = (x) => funcs[i](x) - funcs[j](x);
                const step = (xMax - xMin) / 200;
                let x = xMin;
                while (x < xMax) {
                    try {
                        const d1 = diff(x), d2 = diff(x + step);
                        if (d1 * d2 < 0) {
                            const root = bisection(diff, x, x + step);
                            if (root !== null) intersections.push({ x: root, y: funcs[i](root), pair: `${i}-${j}` });
                        }
                    } catch {}
                    x += step;
                }
            }
        }
        return intersections;
    }

    const ints = findIntersections([f1, f2, f3], -10, 10);
    console.log(`    3个函数间交点总数: ${ints.length}`);
    assert(ints.length >= 3, '3个函数至少有3个交点');

    const pair01 = ints.filter(p => p.pair === '0-1');
    const pair02 = ints.filter(p => p.pair === '0-2');
    const pair12 = ints.filter(p => p.pair === '1-2');
    console.log(`    y=x 与 y=x^2 交点: ${pair01.length}个`);
    console.log(`    y=x 与 y=-x+2 交点: ${pair02.length}个`);
    console.log(`    y=x^2 与 y=-x+2 交点: ${pair12.length}个`);
    assert(pair01.length >= 1, 'y=x 与 y=x^2 有交点');
    assert(pair02.length >= 1, 'y=x 与 y=-x+2 有交点');
    assert(pair12.length >= 1, 'y=x^2 与 y=-x+2 有交点');
})();

console.log("\n" + "=".repeat(50));
console.log(`测试结果: ${passed} 通过, ${failed} 失败, 共 ${passed + failed} 项`);
if (failures.length > 0) {
    console.log("\n失败项:");
    failures.forEach(f => console.log(`  ✗ ${f}`));
}
console.log("=".repeat(50));

process.exit(failed > 0 ? 1 : 0);
