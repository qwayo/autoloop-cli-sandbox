import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const entry = fileURLToPath(new URL('../src/cli.mjs', import.meta.url));
const cli = (args = [], input = '') => spawnSync(process.execPath, [entry, ...args], { input, encoding: 'utf8', windowsHide: true });

test('从标准输入统计两行、空白分隔词及 UTF-8 字节', () => {
  const result = cli([], 'hello world\n中文 😀\n');
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '行数: 2\n词数: 4\n字符数: 17\n字节数: 24\n');
});
test('空输入产生零计数', () => {
  assert.equal(cli().stdout, '行数: 0\n词数: 0\n字符数: 0\n字节数: 0\n');
});
test('CRLF 和无尾换行均按逻辑行统计', () => {
  assert.match(cli(['-'], 'one\r\ntwo').stdout, /^行数: 2\n/);
});
test('读取带空格和中文的文件路径', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'text-metrics-'));
  const file = path.join(folder, '输入 sample.txt');
  writeFileSync(file, 'a b');
  const result = cli([file]);
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '行数: 1\n词数: 2\n字符数: 3\n字节数: 3\n');
});
test('帮助不读取标准输入', () => {
  assert.equal(cli(['--help']).status, 0);
  assert.match(cli(['--help']).stdout, /用法/);
});
test('参数错误和读文件失败返回非零退出码', () => {
  for (const args of [['--unknown'], ['one', 'two'], ['missing-file-for-cli-test.txt']]) {
    const result = cli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^错误：/);
  }
});
