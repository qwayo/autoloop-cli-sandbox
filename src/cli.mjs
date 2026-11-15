#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const fields = ['lines', 'words', 'characters', 'bytes'];
const help = '用法：node src/cli.mjs [--field <lines|words|characters|bytes>] [文件路径|-]\n省略文件或使用 - 时读取标准输入。\n--field 只输出所选指标的数值及换行，可放在文件路径前后。\n字段：lines 行数、words 词数、characters Unicode 码点数、bytes UTF-8 字节数。\n缺少字段值或字段未知时输出错误，退出码为 1。\n';
function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(help);
    return;
  }
  let field;
  let file;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--field') {
      if (field !== undefined) {
        throw new Error('--field 只能指定一次。');
      }
      if (index + 1 >= args.length) {
        throw new Error('--field 缺少字段值，可选字段：' + fields.join(', ') + '。');
      }
      field = args[++index];
      if (!fields.includes(field)) {
        throw new Error('--field 字段无效，可选字段：' + fields.join(', ') + '。');
      }
    } else if ((arg.startsWith('-') && arg !== '-') || file !== undefined) {
      throw new Error('参数无效。使用 --help 查看用法。');
    } else {
      file = arg;
    }
  }
  const text = readFileSync(file === undefined || file === '-' ? 0 : file, 'utf8');
  const normalized = text.replaceAll('\r\n', '\n');
  const metrics = {
    lines: normalized.length ? normalized.split('\n').length - (normalized.endsWith('\n') ? 1 : 0) : 0,
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    characters: Array.from(text).length,
    bytes: Buffer.byteLength(text, 'utf8'),
  };
  if (field !== undefined) {
    process.stdout.write(`${metrics[field]}\n`);
  } else {
    process.stdout.write(`行数: ${metrics.lines}\n词数: ${metrics.words}\n字符数: ${metrics.characters}\n字节数: ${metrics.bytes}\n`);
  }
}

try { main(process.argv.slice(2)); }
catch (error) {
  process.stderr.write('错误：' + error.message + '\n');
  process.exitCode = 1;
}
