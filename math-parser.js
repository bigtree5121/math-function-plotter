/**
 * 数学表达式解析器
 * 支持基本运算、函数和变量
 */
class MathParser {
    constructor() {
        this.position = 0;
        this.expression = '';
        this.tokens = [];
    }

    /**
     * 解析表达式并返回计算函数
     * @param {string} expression - 数学表达式
     * @returns {Function} - 计算函数
     */
    parse(expression) {
        this.expression = expression.replace(/\s+/g, ''); // 移除空白
        this.position = 0;
        this.tokens = this.tokenize();
        
        if (this.tokens.length === 0) {
            throw new Error('表达式为空');
        }
        
        const ast = this.parseExpression();
        return (x) => this.evaluate(ast, x);
    }

    /**
     * 词法分析 - 将表达式分解为tokens
     */
    tokenize() {
        const tokens = [];
        const regex = /(\d*\.?\d+)|([a-zA-Z]+)|([+\-*/^()])|(\|)/g;
        let match;
        
        while ((match = regex.exec(this.expression)) !== null) {
            const token = match[0];
            
            if (/\d/.test(token)) {
                tokens.push({ type: 'NUMBER', value: parseFloat(token) });
            } else if (/[a-zA-Z]/.test(token)) {
                if (token === 'x') {
                    tokens.push({ type: 'VARIABLE', value: token });
                } else {
                    tokens.push({ type: 'FUNCTION', value: token });
                }
            } else if (['+', '-', '*', '/', '^'].includes(token)) {
                tokens.push({ type: 'OPERATOR', value: token });
            } else if (token === '(') {
                tokens.push({ type: 'LPAREN' });
            } else if (token === ')') {
                tokens.push({ type: 'RPAREN' });
            } else if (token === '|') {
                tokens.push({ type: 'ABS' });
            }
        }
        
        return tokens;
    }

    /**
     * 语法分析 - 构建抽象语法树
     */
    parseExpression() {
        return this.parseAddSubtract();
    }

    parseAddSubtract() {
        let left = this.parseMultiplyDivide();
        
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token && token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
                this.position++;
                const right = this.parseMultiplyDivide();
                left = {
                    type: 'BINARY_OP',
                    operator: token.value,
                    left: left,
                    right: right
                };
            } else {
                break;
            }
        }
        
        return left;
    }

    parseMultiplyDivide() {
        let left = this.parsePower();
        
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token && token.type === 'OPERATOR' && (token.value === '*' || token.value === '/')) {
                this.position++;
                const right = this.parsePower();
                left = {
                    type: 'BINARY_OP',
                    operator: token.value,
                    left: left,
                    right: right
                };
            } else {
                break;
            }
        }
        
        return left;
    }

    parsePower() {
        let left = this.parseUnary();
        
        while (this.position < this.tokens.length) {
            const token = this.tokens[this.position];
            if (token && token.type === 'OPERATOR' && token.value === '^') {
                this.position++;
                const right = this.parseUnary();
                left = {
                    type: 'BINARY_OP',
                    operator: '^',
                    left: left,
                    right: right
                };
            } else {
                break;
            }
        }
        
        return left;
    }

    parseUnary() {
        const token = this.tokens[this.position];
        
        if (token && token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
            this.position++;
            return {
                type: 'UNARY_OP',
                operator: token.value,
                operand: this.parseUnary()
            };
        }
        
        return this.parseFactor();
    }

    parseFactor() {
        const token = this.tokens[this.position];
        
        if (!token) {
            throw new Error('意外的表达式结束');
        }
        
        switch (token.type) {
            case 'NUMBER':
                this.position++;
                return { type: 'NUMBER', value: token.value };
                
            case 'VARIABLE':
                this.position++;
                return { type: 'VARIABLE', name: token.value };
                
            case 'FUNCTION':
                return this.parseFunction();
                
            case 'LPAREN':
                this.position++;
                const expr = this.parseExpression();
                if (!this.tokens[this.position] || this.tokens[this.position].type !== 'RPAREN') {
                    throw new Error('缺少右括号');
                }
                this.position++;
                return expr;
                
            case 'ABS':
                return this.parseAbsolute();
                
            default:
                throw new Error(`意外的token: ${token.value || token.type}`);
        }
    }

    parseFunction() {
        const functionToken = this.tokens[this.position];
        this.position++;
        
        if (!this.tokens[this.position] || this.tokens[this.position].type !== 'LPAREN') {
            throw new Error(`函数 ${functionToken.value} 后面必须跟括号`);
        }
        
        this.position++; // 跳过左括号
        const argument = this.parseExpression();
        
        if (!this.tokens[this.position] || this.tokens[this.position].type !== 'RPAREN') {
            throw new Error('函数调用缺少右括号');
        }
        this.position++;
        
        return {
            type: 'FUNCTION_CALL',
            name: functionToken.value,
            argument: argument
        };
    }

    parseAbsolute() {
        this.position++; // 跳过第一个 |
        const expr = this.parseExpression();
        
        if (!this.tokens[this.position] || this.tokens[this.position].type !== 'ABS') {
            throw new Error('绝对值缺少右边的 |');
        }
        this.position++;
        
        return {
            type: 'FUNCTION_CALL',
            name: 'abs',
            argument: expr
        };
    }

    /**
     * 求值 - 计算AST的值
     */
    evaluate(node, x) {
        switch (node.type) {
            case 'NUMBER':
                return node.value;
                
            case 'VARIABLE':
                if (node.name === 'x') {
                    return x;
                }
                throw new Error(`未知变量: ${node.name}`);
                
            case 'BINARY_OP':
                const left = this.evaluate(node.left, x);
                const right = this.evaluate(node.right, x);
                
                switch (node.operator) {
                    case '+': return left + right;
                    case '-': return left - right;
                    case '*': return left * right;
                    case '/': 
                        if (Math.abs(right) < 1e-10) {
                            return right > 0 ? Infinity : -Infinity;
                        }
                        return left / right;
                    case '^': return Math.pow(left, right);
                    default:
                        throw new Error(`未知运算符: ${node.operator}`);
                }
                
            case 'UNARY_OP':
                const operand = this.evaluate(node.operand, x);
                switch (node.operator) {
                    case '+': return operand;
                    case '-': return -operand;
                    default:
                        throw new Error(`未知一元运算符: ${node.operator}`);
                }
                
            case 'FUNCTION_CALL':
                const arg = this.evaluate(node.argument, x);
                return this.callFunction(node.name, arg);
                
            default:
                throw new Error(`未知节点类型: ${node.type}`);
        }
    }

    /**
     * 调用内置函数
     */
    callFunction(name, arg) {
        switch (name) {
            case 'abs':
                return Math.abs(arg);
            case 'sqrt':
                if (arg < 0) {
                    return NaN; // 负数的平方根在实数范围内无定义
                }
                return Math.sqrt(arg);
            case 'sin':
                return Math.sin(arg);
            case 'cos':
                return Math.cos(arg);
            case 'tan':
                return Math.tan(arg);
            case 'log':
                if (arg <= 0) {
                    return NaN;
                }
                return Math.log10(arg);
            case 'ln':
                if (arg <= 0) {
                    return NaN;
                }
                return Math.log(arg);
            default:
                throw new Error(`未知函数: ${name}`);
        }
    }

    /**
     * 验证表达式格式
     */
    static validate(expression) {
        try {
            const parser = new MathParser();
            const func = parser.parse(expression);
            
            // 尝试计算几个点
            func(0);
            func(1);
            func(-1);
            
            return { valid: true, message: '表达式有效' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    /**
     * 格式化表达式显示
     */
    static formatExpression(expression) {
        return expression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/\^/g, '^')
            .replace(/abs\(/g, '|')
            .replace(/\)$/g, '|')
            .replace(/sqrt\(/g, '√(');
    }

    /**
     * 预处理表达式 - 添加隐式乘号
     */
    static preprocessExpression(expression) {
        // 在数字和字母之间添加乘号
        expression = expression.replace(/(\d)([a-zA-Z])/g, '$1*$2');
        // 在右括号和字母之间添加乘号
        expression = expression.replace(/\)([a-zA-Z])/g, ')*$1');
        // 在数字和左括号之间添加乘号
        expression = expression.replace(/(\d)\(/g, '$1*(');
        // 在右括号和数字之间添加乘号
        expression = expression.replace(/\)(\d)/g, ')*$1');
        
        return expression;
    }
}

// 导出到全局
window.MathParser = MathParser;