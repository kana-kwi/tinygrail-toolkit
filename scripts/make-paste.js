#!/usr/bin/env node
// 由主文件生成「提交组件审核用」的精简版：
//   - 头部大段说明（功能清单 / 安装 / 接口清单）换成三行 banner
//   - 删掉整行块注释与 `//` 注释，连续空行压成一行
//   - 代码一行不动（行内注释保留），生成后应用 `node --check` 校验
//
// 用法：node scripts/make-paste.js
//       node scripts/make-paste.js <输入> <输出>
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const inp = process.argv[2] || path.join(root, 'tinygrail-toolkit.component.js');
const out = process.argv[3] || path.join(root, 'dist', 'tinygrail-toolkit.component.paste.js');

const s = fs.readFileSync(inp, 'utf8').replace(/\r\n/g, '\n');

// 版本号从 banner 里带出来，保持和主文件一致
const ver = (s.match(/版本号填\s*([\d.]+)/) || [])[1] || '';

const end = s.indexOf('*/');
if (s.indexOf('/*') !== 0 || end < 0) throw new Error('头部注释块没找到');

const banner = [
  '/**',
  ' * 小圣杯工具箱 · Bangumi 超合金组件' + (ver ? ' v' + ver : ''),
  ' * 说明与更新记录：https://github.com/kana-kwi/tinygrail-toolkit',
  ' */',
].join('\n');

const lines = s.slice(end + 2).split('\n');
const kept = [];
let inBlock = false;
let blank = 0;
for (const raw of lines) {
  const t = raw.trim();
  if (inBlock) {
    if (t.indexOf('*/') >= 0) inBlock = false;
    continue;
  }
  if (t.indexOf('/*') === 0) {
    if (t.indexOf('*/') < 0) inBlock = true;
    continue;
  }
  if (t.indexOf('//') === 0) continue;
  if (t === '') {
    blank++;
    if (blank > 1) continue;
    kept.push('');
    continue;
  }
  blank = 0;
  kept.push(raw);
}

const result = banner + kept.join('\n').replace(/^\n+/, '\n');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, result, 'utf8');
execFileSync(process.execPath, ['--check', out], { stdio: 'inherit' });

const src = s.split('\n').length;
const dst = result.split('\n').length;
console.log(
  path.relative(root, out) +
    '：' + dst + ' 行 / ' + Buffer.byteLength(result) + ' 字节' +
    '（主文件 ' + src + ' 行 / ' + Buffer.byteLength(s) + ' 字节）'
);
