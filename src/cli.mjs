#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const help = '用法：node src/cli.mjs [文件路径|-]\n省略文件或使用 - 时读取标准输入。\n';
function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(help);
    return;
  }
  if (args.length > 1 || (args[0]?.startsWith('-') && args[0] !== '-')) {
    throw new Error('参数无效。使用 --help 查看用法。');
  }
  const text = readFileSync(!args.length || args[0] === '-' ? 0 : args[0], 'utf8');
  const normalized = text.replaceAll('\r\n', '\n');
  const metrics = {
    lines: normalized.length ? normalized.split('\n').length - (normalized.endsWith('\n') ? 1 : 0) : 0,
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    characters: Array.from(text).length,
    bytes: Buffer.byteLength(text, 'utf8'),
  };
  process.stdout.write(`行数: ${metrics.lines}\n词数: ${metrics.words}\n字符数: ${metrics.characters}\n字节数: ${metrics.bytes}\n`);
}

try { main(process.argv.slice(2)); }
catch (error) {
  process.stderr.write('错误：' + error.message + '\n');
  process.exitCode = 1;
}
