import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslint from '@eslint/js';
import tsEslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
    globalIgnores(['node_modules/**/*', 'dist/**/*' ]),
    /** js推荐配置 */
    eslint.configs.recommended,
    /** ts推荐配置 */
    ...tsEslint.configs.recommended,
    {
        files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        settings: {
            'import/resolver': 'node'
        },
        rules: {
            'semi': 1, // 行末分号，根据编码习惯选择添加，这里配置的加分号
            'no-console': 0, // 禁用 console
            'comma-dangle': [2,'never'], //对象字面量项尾不能有逗号(always-multiline是有逗号)
            'max-len': 0, // 强制一行的最大长度，可以是[1, 200]限制长度
            'max-lines': 0, // 强制最大行数
            'max-params': 0, // 强制 function 定义中最多允许的参数数量，可以用[1, 7]限制数量
            'max-statements': 0, // 强制 function 块最多允许的的语句数量，可以用[1, 200]限制数量
            'max-statements-per-line': 0, // 强制每一行中所允许的最大语句数量
            'space-before-function-paren': [0,'always'], // 强制在 function的左括号之前使用一致的空格
            // 禁止出现未使用过的表达式
            'no-unused-expressions': [
                0,
                {
                    'allowShortCircuit': true,
                    'allowTernary': true
                }
            ],
            'arrow-body-style': [0, 'never'], // 要求箭头函数体使用大括号
            'func-names': 0, // 强制使用命名的 function 表达式
            'prefer-const': 0, // 要求使用 const 声明那些声明后不再被修改的变量
            'no-extend-native': 2, // 禁止扩展原生类型
            'no-param-reassign': 0, // 不允许对 function 的参数进行重新赋值
            'no-restricted-syntax': 0, // 禁止使用特定的语法
            'no-eval': 0, // 禁用 eval()，eval() 函数可计算某个字符串，并执行其中的的 JavaScript 代码。
            'no-continue': 0, // 禁用 continue 语句
            'global-require': 1, // 要求 require() 出现在顶层模块作用域中
            'camelcase': 0, //强制驼峰法命名
            'import/no-extraneous-dependencies': 0,
            'import/prefer-default-export': 0,
            'import/no-unresolved': 0,
            'import/extensions': 0,

            'no-extra-boolean-cast': 0, //禁止不必要的bool转换
            'no-unreachable': 1, //不能有无法执行的代码
            'no-mixed-spaces-and-tabs': 0, //禁止混用tab和空格
            'prefer-arrow-callback': 0, //比较喜欢箭头回调
            'arrow-parens': 0, //箭头函数用小括号括起来
            'arrow-spacing': 0, //=>的前/后括号
            'quotes': [2, 'single'], //单引号
            'no-debugger': 2, //禁用debugger
            'no-var': 2, //对var警告
            'no-irregular-whitespace': 0, //不规则的空白不允许
            'no-trailing-spaces': 1, //一行结束后面有空格就发出警告
            'eol-last': 0, //文件以单一的换行符结束
//        "no-unused-vars": [2, {"vars": "all", "args": "after-used"}], //不能有声明后未被使用的变量或参数
            'no-underscore-dangle': 0, //标识符不能以_开头或结尾
            'no-alert': 2, //禁止使用alert confirm prompt
            'no-lone-blocks': 0, //禁止不必要的嵌套块
            'no-class-assign': 2, //禁止给类赋值
            'no-cond-assign': 2, //禁止在条件表达式中使用赋值语句
            'no-const-assign': 2, //禁止修改const声明的变量
            'no-delete-var': 2, //不能对var声明的变量使用delete操作符
            'no-dupe-keys': 2, //在创建对象字面量时不允许键重复
            'no-duplicate-case': 2, //switch中的case标签不能重复
            'no-dupe-args': 2, //函数参数不能重复
            'no-empty': 2, //块语句中的内容不能为空
            'no-func-assign': 2, //禁止重复的函数声明
            'no-invalid-this': 0, //禁止无效的this，只能用在构造器，类，对象字面量
            'no-redeclare': 2, //禁止重复声明变量
            'no-spaced-func': 2, //函数调用时 函数名与()之间不能有空格
            'no-this-before-super': 0, //在调用super()之前不能使用this或super
//        "no-undef": 2, //不能有未定义的变量
            'no-use-before-define': 0, //未定义前不能使用

            '@typescript-eslint/no-unused-vars': 0,
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-empty-interface': 0,
            '@typescript-eslint/explicit-function-return-type': 0,
            '@typescript-eslint/camelcase': ['off', {'properties':'always'}], //强制驼峰法命名（ts）
            '@typescript-eslint/no-use-before-define': 0,
            '@typescript-eslint/explicit-module-boundary-types': 0,
            '@typescript-eslint/no-non-null-assertion': 0,
            '@typescript-eslint/ban-ts-comment': 0 //禁止使用ts-ignore

        }
    }
]);
