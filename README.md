# 云朵农场 MVP

手机端双人农场的第一版交互原型。当前包含：免注册创建/加入界面、3×3 农田、播种/浇水/定时成长/收获、金币、仓库和扩展玩法入口。

> 本版本首先验证核心手感；房间暂为前端演示身份，下一迭代接入服务端与 PostgreSQL 才能实现真实异地数据同步。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

Render 新建 Static Site：
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

## 下一迭代

- Express API 与 PostgreSQL
- 房间双人席位、设备令牌与恢复码
- 服务端作物计时和操作幂等
- 轮询同步及动态日志
- 正式原创像素/卡通资产

本项目仅参考生活模拟农场类型的核心循环，不使用《星露谷物语》的名称、角色、地图、图像、音乐或其他受保护素材。
