# 云朵谷 v0.4 结构化重制版

本版根据开源游戏架构与移动端 UI 研究，对 v0.3 进行了结构重构。

## 改进

- React UI、Phaser 场景、状态、输入、交互分离
- EventBus 事件通信，不再定时轮询 Phaser
- 明确的 TypeScript 农田、作物、树木和 HUD 类型
- 最近目标选择与对象情境提示
- 横竖屏独立重排、刘海与底部安全区适配
- 竖屏5格、横屏5格工具栏（后续可扩充6格）
- 事件式新手步骤与今日任务
- 摇杆和键盘输入统一归一化
- 金币不足、成长和最近目标的逻辑测试
- 2.5分钟游戏日及快速睡觉测试

## 结构

```text
src/app                 React UI 和摇杆
src/game/scenes         Phaser 场景
src/game/systems        输入与交互系统
src/game/state          数据状态与事件总线
src/tests               核心逻辑测试
```

## 运行

```bash
npm install
npm test
npm run dev
```

## 构建

```bash
npm run build
```

Render：

- Build Command：`npm install && npm run build`
- Publish Directory：`dist`

## 当前边界

仍是单机原型。下一阶段为 Tiled Tilemap、正式原创素材、碰撞图层、背包系统和 WebSocket 双人联机。
