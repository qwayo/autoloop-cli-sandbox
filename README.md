# 文本统计 CLI

一个不联网、无需第三方依赖的 Node.js 24 命令行工具。读取 UTF-8 文件或标准输入，输出行数、词数、Unicode 码点数和 UTF-8 字节数。

```text
node src/cli.mjs --help
node src/cli.mjs notes.txt
node src/cli.mjs -
node src/cli.mjs --field words notes.txt
node src/cli.mjs notes.txt --field bytes
node src/cli.mjs --field lines -
node src/cli.mjs --json notes.txt
node src/cli.mjs --json -
node src/cli.mjs --json --field words notes.txt
node src/cli.mjs -- -notes.txt
node src/cli.mjs --json --field words -- --help
node src/cli.mjs --
npm test
```

词数按连续空白分隔，中文没有自动分词。行数接受 LF 和 CRLF，最后一个换行不额外增加一行；空输入为零行。字符数按 Unicode 码点计数，包含空白和换行，不是屏幕上可见的字形数。成功退出码为 0，参数或读取错误为 1。

默认输出四行中文统计。使用 `--json` 时，标准输出为一个 JSON 对象并以换行结束，包含 `lines`、`words`、`characters`、`bytes` 四个数值字段，计数规则与默认输出相同。例如输入 `a b` 时输出 `{"lines":1,"words":2,"characters":3,"bytes":3}`。`--json` 可放在文件路径或 `-` 前后，省略路径时读取标准输入；空输入的四个字段均为 `0`。重复传入 `--json`、未知参数或多个文件路径均为参数错误；`--help` 单独使用。

使用 `--field <lines|words|characters|bytes>` 选择单个指标：`lines` 为行数，`words` 为词数，`characters` 为 Unicode 码点数，`bytes` 为 UTF-8 字节数。不使用 `--json` 时只输出数值及换行，例如内容为 `a b` 的文件使用 `--field words` 输出 `2` 及换行。选项可放在文件路径前后；省略文件或使用 `-` 时读取标准输入，空输入的每个指标均为 `0`。与 `--json` 组合时，只输出包含所选字段的 JSON 对象及换行，例如 `--json --field words` 输出 `{"words":2}` 及换行；两个选项顺序不限，但字段值必须紧跟 `--field`。不指定 `--field` 时保留四项输出。`--field` 只能指定一次，缺少字段值或字段未知时向标准错误输出中文错误，标准输出为空，退出码为 1。

首个 `--` 结束选项解析，其后的所有参数均按文件路径处理，包括 `-notes.txt`、`--json`、`--help` 和再次出现的 `--`；最多只能指定一个路径。例如 `-- --help` 读取名为 `--help` 的文件。结束符前的 `--json`、`--field` 仍然有效；未使用结束符时，选项仍可放在路径前后。字段值必须紧跟 `--field` 且有效，因此 `--field --` 报错。单独 `--` 等同省略路径，`-- -` 也读取标准输入；指定文件时忽略标准输入。多路径、重复选项、未知字段、结束符前的未知选项或读取失败时，标准输出为空，标准错误输出中文错误，退出码为 1。

默认分支为 `trunk`。CI 检查所有 PR；CD 在默认分支提交通过测试后，将程序、测试和说明打包到当前仓库 Releases 的 `text-metrics.tgz`。解包后可直接使用 Node.js 运行。

本仓库用于验证通用 AutoLoop 工作流在非游戏项目中的接入、并行开发、审批和交付。候选与合并由维护者通过飞书批准。
