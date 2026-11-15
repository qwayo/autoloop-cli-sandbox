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
test('JSON 标准输入覆盖空输入、Unicode、CRLF 和尾换行，并与默认统计一致', () => {
  const cases = [
    ['', { lines: 0, words: 0, characters: 0, bytes: 0 }],
    ['hello world\n中文 😀\n', { lines: 2, words: 4, characters: 17, bytes: 24 }],
    ['one\r\ntwo', { lines: 2, words: 2, characters: 8, bytes: 8 }],
    ['a\n', { lines: 1, words: 1, characters: 2, bytes: 2 }],
  ];
  for (const [input, expected] of cases) {
    const standard = cli([], input);
    assert.equal(standard.status, 0);
    for (const args of [['--json'], ['--json', '-'], ['-', '--json']]) {
      const result = cli(args, input);
      assert.equal(result.status, 0);
      assert.equal(result.stderr, '');
      assert.equal(result.stdout, JSON.stringify(expected) + '\n');
      const metrics = JSON.parse(result.stdout);
      assert.deepEqual(Object.values(metrics), standard.stdout.match(/\d+/g).map(Number));
    }
  }
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
  for (const args of [['--json', file], [file, '--json']]) {
    const jsonResult = cli(args, '此标准输入不应参与统计');
    assert.equal(jsonResult.status, 0);
    assert.equal(jsonResult.stderr, '');
    assert.deepEqual(JSON.parse(jsonResult.stdout), { lines: 1, words: 2, characters: 3, bytes: 3 });
  }
});
test('帮助不读取标准输入', () => {
  assert.equal(cli(['--help']).status, 0);
  assert.match(cli(['--help']).stdout, /用法/);
  assert.match(cli(['--help']).stdout, /--json/);
  assert.match(cli(['--help']).stdout, /lines、words、characters、bytes/);
});
test('参数错误和读文件失败返回非零退出码', () => {
  for (const args of [
    ['--unknown'],
    ['one', 'two'],
    ['missing-file-for-cli-test.txt'],
    ['--json', '--unknown'],
    ['--json', 'one', 'two'],
    ['--json', '--json'],
    ['--json', '--help'],
    ['--json=true'],
    ['--json', 'missing-file-for-cli-test.txt'],
  ]) {
    const result = cli(args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^错误：/);
  }
});
