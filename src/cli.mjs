#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { isUtf8 } from 'node:buffer';

const fields = ['lines', 'words', 'characters', 'bytes'];
const help = '用法：node src/cli.mjs [--json] [--field <lines|words|characters|bytes>] [--] [文件路径|-]\n省略文件或使用 - 时读取标准输入；指定文件时忽略标准输入。\n首个 -- 结束选项解析，其后参数均按路径处理，包括 -notes.txt、--json、--help 和再次出现的 --；最多一个路径。\n单独 -- 仍读取标准输入；-- 前的选项保持有效，--field -- 为字段无效错误。\n--json 输出包含 lines、words、characters、bytes 数值字段的 JSON 对象，可放在文件路径前后。\n--field 只输出所选指标的数值及换行，可放在文件路径前后。\n字段：lines 行数、words 词数、characters Unicode 码点数、bytes UTF-8 字节数。\n--json 与 --field 组合时只输出包含所选字段的 JSON 对象及换行，字段值必须紧跟 --field。\n两个选项均只能指定一次；缺少字段值、字段未知、未知参数或多个文件路径时输出错误，退出码为 1。\n文件和标准输入必须为合法 UTF-8；非法编码时标准输出为空，标准错误输出中文错误，退出码为 1。\n--help 单独使用。\n';
function main(args) {
  if (args.length === 1 && args[0] === '--help') {
    process.stdout.write(help);
    return;
  }
  let field;
  let file;
  let json = false;
  let optionsEnded = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!optionsEnded && arg === '--') {
      optionsEnded = true;
      continue;
    }
    if (!optionsEnded && arg === '--field') {
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
    } else if (!optionsEnded && arg === '--json') {
      if (json) {
        throw new Error('参数无效。使用 --help 查看用法。');
      }
      json = true;
    } else if ((!optionsEnded && arg.startsWith('-') && arg !== '-') || file !== undefined) {
      throw new Error('参数无效。使用 --help 查看用法。');
    } else {
      file = arg;
    }
  }
  let input;
  try {
    input = readFileSync(file === undefined || file === '-' ? 0 : file);
  } catch (error) {
    if (file !== undefined && file !== '-' && error.code === 'ENOENT') {
      throw new Error(`文件不存在：${file}。`);
    }
    throw error;
  }
  if (!isUtf8(input)) {
    throw new Error('输入包含非法 UTF-8 编码。');
  }
  const text = input.toString('utf8');
  const normalized = text.replaceAll('\r\n', '\n');
  const metrics = {
    lines: normalized.length ? normalized.split('\n').length - (normalized.endsWith('\n') ? 1 : 0) : 0,
    words: text.trim() ? text.trim().split(/\s+/u).length : 0,
    characters: Array.from(text).length,
    bytes: Buffer.byteLength(text, 'utf8'),
  };
  if (json) {
    process.stdout.write(JSON.stringify(field === undefined ? metrics : { [field]: metrics[field] }) + '\n');
  } else if (field !== undefined) {
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
