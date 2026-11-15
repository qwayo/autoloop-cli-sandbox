# 文本统计 CLI

一个不联网、无需第三方依赖的 Node.js 24 命令行工具。读取 UTF-8 文件或标准输入，输出行数、词数、Unicode 码点数和 UTF-8 字节数。

```text
node src/cli.mjs --help
node src/cli.mjs notes.txt
node src/cli.mjs -
node src/cli.mjs --field words notes.txt
node src/cli.mjs notes.txt --field bytes
node src/cli.mjs --field lines -
npm test
```

词数按连续空白分隔，中文没有自动分词。行数接受 LF 和 CRLF，最后一个换行不额外增加一行；空输入为零行。字符数按 Unicode 码点计数，包含空白和换行，不是屏幕上可见的字形数。成功退出码为 0，参数或读取错误为 1。

使用 `--field <lines|words|characters|bytes>` 选择单个指标：`lines` 为行数，`words` 为词数，`characters` 为 Unicode 码点数，`bytes` 为 UTF-8 字节数。此时只输出数值及换行，例如内容为 `a b` 的文件使用 `--field words` 输出 `2` 及换行。选项可放在文件路径前后；省略文件或使用 `-` 时读取标准输入，空输入的每个指标均输出 `0` 及换行。不指定 `--field` 时保留默认的四项输出。`--field` 只能指定一次，缺少字段值或字段未知时向标准错误输出中文错误，标准输出为空，退出码为 1。

默认分支为 `trunk`。CI 检查所有 PR；CD 在默认分支提交通过测试后，将程序、测试和说明打包到当前仓库 Releases 的 `text-metrics.tgz`。解包后可直接使用 Node.js 运行。

本仓库用于验证通用 AutoLoop 工作流在非游戏项目中的接入、并行开发、审批和交付。候选与合并由维护者通过飞书批准。
