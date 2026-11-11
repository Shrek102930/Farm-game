# 云朵谷：移动沙盒农场重制版

这是从九宫格网页重制的横屏手机 2D 农场原型。

## 已实现

- Phaser 游戏画布和响应式摄像机
- 横屏与安全区域适配
- 浮动虚拟摇杆
- 可移动角色与摄像机跟随
- 大型原创农场地图原型
- 20 块可操作土地
- 锄地、播种、浇水、跨日成长和收获
- 砍树、金币、昼夜时间
- 工具快捷栏和情境操作
- 双人角色位置预留

## 运行

```bash
npm install
npm run dev
```

## Render Static Site

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## 替换旧仓库

将本项目中的 `package.json`、`index.html`、`src/main.tsx`、`src/style.css` 替换到仓库同名位置，再在 Render 选择 Manual Deploy。

## 尚未完成

真实异地联机需要继续开发 Node.js WebSocket 服务、PostgreSQL、房间身份、服务器权威存档与断线恢复。当前粉色伙伴角色为联机位置占位。

本项目只借鉴生活模拟农场游戏的通用玩法，不使用任何商业游戏的角色、地图、美术、音乐或文本。
