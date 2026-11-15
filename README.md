# 文本统计 CLI

一个不联网、无需第三方依赖的 Node.js 24 命令行工具。读取 UTF-8 文件或标准输入，输出行数、词数、Unicode 码点数和 UTF-8 字节数。

```text
node src/cli.mjs --help
node src/cli.mjs notes.txt
node src/cli.mjs -
node src/cli.mjs --json notes.txt
node src/cli.mjs --json -
npm test
```

词数按连续空白分隔，中文没有自动分词。行数接受 LF 和 CRLF，最后一个换行不额外增加一行；空输入为零行。字符数按 Unicode 码点计数，包含空白和换行，不是屏幕上可见的字形数。成功退出码为 0，参数或读取错误为 1。

默认输出四行中文统计。使用 `--json` 时，标准输出为一个 JSON 对象并以换行结束，包含 `lines`、`words`、`characters`、`bytes` 四个数值字段，计数规则与默认输出相同。例如输入 `a b` 时输出 `{"lines":1,"words":2,"characters":3,"bytes":3}`。`--json` 可放在文件路径或 `-` 前后，省略路径时读取标准输入；空输入的四个字段均为 `0`。重复传入 `--json`、未知参数或多个文件路径均为参数错误；`--help` 单独使用。

默认分支为 `trunk`。CI 检查所有 PR；CD 在默认分支提交通过测试后，将程序、测试和说明打包到当前仓库 Releases 的 `text-metrics.tgz`。解包后可直接使用 Node.js 运行。

本仓库用于验证通用 AutoLoop 工作流在非游戏项目中的接入、并行开发、审批和交付。候选与合并由维护者通过飞书批准。
