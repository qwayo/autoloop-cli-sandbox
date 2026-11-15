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
test('帮助不读取标准输入并说明字段选项', () => {
  const result = cli(['--help']);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  assert.match(result.stdout, /用法/);
  assert.match(result.stdout, /--field <lines\|words\|characters\|bytes>/);
  assert.match(result.stdout, /数值及换行/);
});

for (const [field, expected] of Object.entries({ lines: 2, words: 4, characters: 17, bytes: 24 })) {
  test(`--field ${field} 从标准输入只输出所选指标`, () => {
    for (const args of [['--field', field], ['--field', field, '-'], ['-', '--field', field]]) {
      const result = cli(args, 'hello world\n中文 😀\n');
      assert.equal(result.status, 0);
      assert.equal(result.stdout, `${expected}\n`);
      assert.equal(result.stderr, '');
    }
  });

  test(`--field ${field} 的空输入输出零`, () => {
    const result = cli(['--field', field]);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, '0\n');
    assert.equal(result.stderr, '');
  });
}

test('--field 支持四个字段以及文件路径前后的选项', () => {
  const folder = mkdtempSync(path.join(tmpdir(), 'text-metrics-field-'));
  const file = path.join(folder, '输入 sample.txt');
  writeFileSync(file, 'hello world\n中文 😀\n');
  for (const [field, expected] of Object.entries({ lines: 2, words: 4, characters: 17, bytes: 24 })) {
    for (const args of [['--field', field, file], [file, '--field', field]]) {
      const result = cli(args, '不应读取标准输入');
      assert.equal(result.status, 0);
      assert.equal(result.stdout, `${expected}\n`);
      assert.equal(result.stderr, '');
    }
  }
});

test('--field 保留 CRLF 和无尾换行的行数语义', () => {
  const result = cli(['--field', 'lines'], 'one\r\ntwo');
  assert.equal(result.status, 0);
  assert.equal(result.stdout, '2\n');
  assert.equal(result.stderr, '');
});

test('--field 缺参、未知字段及无效组合返回中文错误且无标准输出', () => {
  const cases = [
    { args: ['--field'], error: /缺少字段值/ },
    { args: ['-', '--field'], error: /缺少字段值/ },
    { args: ['--field', 'unknown'], error: /字段无效/ },
    { args: ['--field', 'Lines'], error: /字段无效/ },
    { args: ['--field', ''], error: /字段无效/ },
    { args: ['--field', 'lines', '--field', 'words'], error: /只能指定一次/ },
    { args: ['--field', 'lines', 'one', 'two'], error: /参数无效/ },
    { args: ['--field', 'lines', '--unknown'], error: /参数无效/ },
  ];
  for (const { args, error } of cases) {
    const result = cli(args, 'hello world\n');
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^错误：/);
    assert.match(result.stderr, error);
  }
});
test('参数错误和读文件失败返回非零退出码', () => {
  for (const args of [['--unknown'], ['one', 'two'], ['missing-file-for-cli-test.txt']]) {
    const result = cli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^错误：/);
  }
});
