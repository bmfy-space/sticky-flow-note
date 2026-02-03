# Sticky Flow Note

一个基于 Vue 3 + Vue Flow 构建的无限画布便签应用。结合了 Tiptap 富文本编辑与 Dexie.js 本地存储，为您提供流畅、自由的思维整理空间。

## ✨ 主要特性

- **♾️ 无限画布**: 基于 `@vue-flow`，支持自由拖拽、缩放，不再受限于传统文档边界。
- **📝 富文本编辑**: 集成 `@tiptap`，支持多种文本格式，让便签内容不仅限于纯文本。
- **💾 本地优先**: 使用 `Dexie.js` (IndexedDB) 进行本地数据存储，数据保存在您的设备上，隐私安全且离线可用。
- **🎨 现代化 UI**: 使用 `Tailwind CSS v4` 构建，界面简洁、响应迅速。
- **⚡ 极速体验**: 基于 `Vite` 构建，开发与加载速度飞快。
- **🛡️ 类型安全**: 全项目采用 `TypeScript` 开发，代码健壮易维护。

## 🛠️ 技术栈

- **框架**: [Vue 3](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式**: [Tailwind CSS v4](https://tailwindcss.com/)
- **核心组件**:
  - [Vue Flow](https://vueflow.dev/) (画布引擎)
  - [Tiptap](https://tiptap.dev/) (富文本编辑器)
  - [Dexie.js](https://dexie.org/) (IndexedDB 封装)
  - [VueUse](https://vueuse.org/) (组合式工具集)
  - [Lucide Vue](https://lucide.dev/) (图标库)

## 🚀 快速开始

本项目使用 `pnpm` 作为包管理器。

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

### 3. 构建生产版本

```bash
pnpm build
```

### 4. 预览生产构建

```bash
pnpm preview
```

## 📄 许可证

MIT
