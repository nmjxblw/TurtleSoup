# 🐢 海龟汤 TurtleSoup

> AI 驱动的海龟汤（Turtle Soup）推理谜题游戏 — 一个故事，一碗汤，你只知道开头，却猜不到结局。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![DeepSeek](https://img.shields.io/badge/Powered%20by-DeepSeek-4B6BFB)](https://deepseek.com)

## 📖 什么是海龟汤？

海龟汤（Turtle Soup）是一种情境推理游戏。主持人给出一个离奇的故事**谜面**，玩家通过**是/否**提问逐步还原故事的完整真相（**汤底**）。核心乐趣在于：用有限的问题，拼凑出意想不到的结局。

## ✨ 特性

- 🤖 **DeepSeek AI 驱动** — 由 LLM 实时生成谜题、回答提问、评分复盘
- 🌐 **中英文双语** — 全局 i18n 支持，一键切换界面语言
- 🌓 **暗色 / 白天双主题** — 右上角一键切换，偏好持久化
- 📊 **多难度设计** — 入门 / 简单 / 专家 / 硬核 + 自定义模式
- 🎨 **6 种故事风格** — 悬疑推理、惊悚、恐怖、喜剧、鬼怪玄幻、刑侦悬疑，支持自定义
- 🔍 **本格推理开关** — 开启后 LLM 严格遵循逻辑推理、现实物理、公平竞技规则
- 📡 **流式传输** — 谜题生成和提问回答均实时显示进度
- 💯 **智能评分** — LLM 评估汤底吻合度，给出 100 分制评分和改进建议
- 📦 **JSON 导出** — 完整对局数据（谜面、盘问点、汤底、提问记录）导出到本地

## 🚀 快速开始

### 方式一：直接打开

1. 下载本项目
2. 用浏览器打开 `index.html`
3. 输入你的 [DeepSeek API Key](https://platform.deepseek.com/api_keys)
4. 开始推理！

### 方式二：本地服务器

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# VS Code
# 安装 Live Server 插件，右键 index.html → Open with Live Server
```

然后访问 `http://localhost:8080`

### 无需 API Key？

点击「跳过，使用演示模式」使用内置示例谜题体验完整流程。

## 🎮 游戏流程

```
封面 → API Key 配置 → 故事配置 → 熬汤中... → 推理对局 → 提交汤底 → 评分复盘
```

### 1️⃣ 配置

- 选择难度（入门/简单/专家/硬核/自定义）
- 自定义模式下可调整提问次数（5~30）和文本长度（200~10000）
- 选择故事风格，开启/关闭本格推理

### 2️⃣ 推理

- 阅读谜面，向 AI 提问（仅限是/否问题）
- AI 按规则简短回复：是 / 不是 / 重要 / 不重要 / 是也不是
- 推理进度条实时显示已发现盘问点比例

### 3️⃣ 复盘

- 提交汤底后 AI 评分（受准确度和提问效率影响）
- 查看详细报告：失误点、提升建议、盘问点回顾
- 一键导出完整对局 JSON

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JavaScript |
| AI 引擎 | DeepSeek API（chat / reasoner） |
| 流式传输 | Server-Sent Events (SSE) + ReadableStream |
| 持久化 | localStorage（API Key、设置、主题偏好） |
| 国际化 | 自研 `data-i18n` 属性绑定系统 |

## 📁 项目结构

```
TurtleSoup/
├── index.html       # 五视图单页应用（封面/API Key/配置/加载/游戏）
├── app.js           # 核心逻辑（状态管理、API 调用、提示词、评分）
├── styles.css       # 样式（CSS 变量、双主题、动画、响应式）
├── TurtleSoup.md    # 设计文档
└── README.md        # 本文件
```

## 🔑 提示词设计

项目内置了三套工程提示词，对应 LLM 的三个角色：

| 提示词 | 角色 | 用途 |
|--------|------|------|
| `buildStoryPrompt` | 谜题设计师 | 根据配置生成故事大纲、谜面（HTML）、盘问点、汤底 |
| `buildQuestionPrompt` | 回答引擎 | 用简短规则化语言回复玩家提问，同步更新推理进度 |
| `buildScoringPrompt` | 评分评委 | 评估汤底准确度，输出 100 分制评分和改进报告 |

## 🌍 浏览器兼容

支持所有现代浏览器（Chrome / Firefox / Safari / Edge）。

## 📄 许可证

MIT © 2025

---

<p align="center">🐢 一锅好汤，等你来熬 🐢</p>
