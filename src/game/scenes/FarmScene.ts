import Phaser from 'phaser';
import { gameBus, gameCommands, gameState, inputController, saveNow } from '../context';
import { InteractionSystem } from '../systems/InteractionSystem';
import type { HudState, PlotState, Tool, TreeState } from '../state/types';
import { GameState } from '../state/GameState';

type PlotView = {
  soil: Phaser.GameObjects.Rectangle;
  focus: Phaser.GameObjects.Rectangle;
  plant: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
};

type TreeView = {
  focus: Phaser.GameObjects.Ellipse;
  trunk: Phaser.GameObjects.Rectangle;
  crown: Phaser.GameObjects.Ellipse;
  shine: Phaser.GameObjects.Ellipse;
};

export class FarmScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerBody!: Phaser.Physics.Arcade.Body;
  private hair!: Phaser.GameObjects.Arc;
  private coat!: Phaser.GameObjects.Rectangle;
  private scarf!: Phaser.GameObjects.Rectangle;
  private footL!: Phaser.GameObjects.Rectangle;
  private footR!: Phaser.GameObjects.Rectangle;
  private partner!: Phaser.GameObjects.Container;
  private tool: Tool = 'hand';
  private interactions = new InteractionSystem(gameState);
  private plotViews = new Map<string, PlotView>();
  private treeViews = new Map<string, TreeView>();
  private focusId = '';
  private lastHud = '';
  private keys: any;
  private elapsed = 0;
  private moveTarget: Phaser.Math.Vector2 | null = null;
  private moveMarker!: Phaser.GameObjects.Arc;

  constructor() { super('farm'); }

  create() {
    this.physics.world.setBounds(0, 0, 1900, 1500);
    this.cameras.main.setBounds(0, 0, 1900, 1500);
    this.buildWorld();
    this.buildEntities();
    this.buildPartner();
    this.buildPlayer();
    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.moveMarker = this.add.circle(0, 0, 26, 0xffed83, 0.28).setStrokeStyle(4, 0xffffff, 0.9).setVisible(false).setDepth(999);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.setClickTarget(pointer));
    this.cameras.main.startFollow(this.player, true, 0.10, 0.10);
    this.scale.on('resize', () => this.fit());
    this.fit();
    gameCommands.setTool = t => { this.tool = t; this.refreshFocus(true); };
    gameCommands.act = () => this.act();
    gameCommands.sleep = () => this.nextDay();
    gameBus.emit('ready', true);
    gameBus.emit('tutorial', { step: 0, text: '点击地图地面，角色会自动走过去。靠近目标后会出现黄色边框。' });
    this.refreshFocus(true);
  }

  private buildWorld() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x8bd36f, 0x8bd36f, 0x5ea85b, 0x5ea85b, 1);
    g.fillRect(0, 0, 1900, 1500);

    // Decorative meadows and paths.
    g.fillStyle(0xf0cf91, 1);
    g.fillRoundedRect(120, 430, 690, 125, 50);
    g.fillRoundedRect(630, 500, 150, 500, 65);
    g.fillRoundedRect(640, 985, 880, 120, 50);
    g.fillStyle(0xe3b879, 0.9);
    g.fillRoundedRect(135, 455, 660, 70, 40);
    g.fillRoundedRect(675, 520, 80, 465, 40);
    g.fillRoundedRect(660, 1010, 830, 65, 35);

    g.fillStyle(0xb8e488, 0.72);
    for (let i = 0; i < 260; i++) g.fillCircle(Phaser.Math.Between(0, 1900), Phaser.Math.Between(0, 1500), Phaser.Math.Between(2, 6));
    g.fillStyle(0xf7d98d, 0.8);
    for (let i = 0; i < 44; i++) g.fillCircle(Phaser.Math.Between(80, 1770), Phaser.Math.Between(80, 1370), Phaser.Math.Between(4, 10));

    // Cottage, mailbox, shipping box.
    g.fillStyle(0xc98558); g.fillRoundedRect(95, 100, 430, 305, 30);
    g.fillStyle(0x8f573e); g.fillTriangle(70, 145, 310, 15, 550, 145);
    g.fillStyle(0xf5dfb5); g.fillRoundedRect(180, 185, 255, 170, 18);
    g.fillStyle(0x6b4a36); g.fillRoundedRect(285, 250, 58, 105, 12);
    g.fillStyle(0x8bd4e8); g.fillRoundedRect(205, 215, 55, 55, 8); g.fillRoundedRect(365, 215, 55, 55, 8);
    this.add.text(185, 365, '云朵小屋', { fontSize: '30px', color: '#543823', backgroundColor: '#fff8d9cc', padding: { x: 12, y: 5 } });
    this.add.text(565, 335, '📮', { fontSize: '54px' });
    this.add.text(615, 360, '今日信箱', { fontSize: '20px', color: '#523b2a', backgroundColor: '#fff7', padding: { x: 7, y: 3 } });
    this.add.text(760, 915, '📦', { fontSize: '64px' });
    this.add.text(830, 942, '出货箱', { fontSize: '22px', color: '#493521', backgroundColor: '#fff7', padding: { x: 8, y: 3 } });

    // River area.
    g.fillGradientStyle(0x66cae4, 0x66cae4, 0x3287c9, 0x3287c9, 1);
    g.fillEllipse(1510, 1090, 560, 335);
    g.lineStyle(18, 0xd9ca8b, 1); g.strokeEllipse(1510, 1090, 560, 335);
    this.add.text(1385, 1025, '河湾码头', { fontSize: '34px', color: '#fff', backgroundColor: '#1f6f9e77', padding: { x: 10, y: 5 } });
    this.add.text(1560, 1160, '🎣', { fontSize: '54px' });

    // Area signs.
    this.add.text(90, 535, '共享农田', { fontSize: '27px', color: '#2d6239', backgroundColor: '#fff4bccc', padding: { x: 10, y: 5 } });
    this.add.text(1035, 120, '微风林地', { fontSize: '27px', color: '#2d6239', backgroundColor: '#fff4bccc', padding: { x: 10, y: 5 } });
  }

  private buildEntities() {
    for (const p of gameState.plots) {
      const soil = this.add.rectangle(p.x, p.y, 98, 86, 0x6dac61).setStrokeStyle(4, 0x568b49);
      const focus = this.add.rectangle(p.x, p.y, 114, 102).setStrokeStyle(5, 0xffed83).setVisible(false);
      const plant = this.add.text(p.x, p.y - 3, '', { fontSize: '50px' }).setOrigin(0.5);
      const hint = this.add.text(p.x, p.y + 33, '', { fontSize: '13px', backgroundColor: '#263a', padding: { x: 4, y: 2 } }).setOrigin(0.5);
      this.plotViews.set(p.id, { soil, focus, plant, hint });
      this.paintPlot(p);
    }

    for (const t of gameState.trees) {
      const focus = this.add.ellipse(t.x, t.y + 20, 135, 110).setStrokeStyle(6, 0xffed83).setVisible(false);
      const trunk = this.add.rectangle(t.x, t.y + 44, 34, 88, 0x8a5a37).setStrokeStyle(4, 0x5d3b27);
      const crown = this.add.ellipse(t.x, t.y, 126, 118, 0x2f8f4f).setStrokeStyle(5, 0x1f6b38);
      const shine = this.add.ellipse(t.x - 24, t.y - 25, 38, 24, 0x80d477, 0.55);
      this.treeViews.set(t.id, { focus, trunk, crown, shine });
    }
  }

  private buildPlayer() {
    const shadow = this.add.ellipse(0, 29, 54, 22, 0x173a29, 0.35);
    const legs = this.add.rectangle(0, 18, 40, 32, 0x425b89).setStrokeStyle(3, 0x2d3e63);
    this.footL = this.add.rectangle(-12, 39, 17, 10, 0x4d382a);
    this.footR = this.add.rectangle(12, 39, 17, 10, 0x4d382a);
    this.coat = this.add.rectangle(0, -5, 56, 56, 0xf0a44f).setStrokeStyle(5, 0x704b32);
    this.scarf = this.add.rectangle(0, -20, 60, 12, 0xed6b82);
    const head = this.add.circle(0, -47, 27, 0xf6c98b).setStrokeStyle(4, 0x6b5144);
    this.hair = this.add.arc(0, -60, 30, 180, 360, false, 0x5b3726).setStrokeStyle(4, 0x4b2d20);
    const eyeL = this.add.circle(-9, -48, 2.5, 0x4b352d);
    const eyeR = this.add.circle(9, -48, 2.5, 0x4b352d);
    const smile = this.add.arc(0, -41, 8, 15, 165, false, 0x000000, 0).setStrokeStyle(2, 0x7d4a42);
    const tag = this.add.text(0, -96, '你', { fontSize: '19px', color: '#fff', backgroundColor: '#315f47', padding: { x: 8, y: 3 } }).setOrigin(0.5);
    this.player = this.add.container(gameState.player.x, gameState.player.y, [shadow, legs, this.footL, this.footR, this.coat, this.scarf, head, this.hair, eyeL, eyeR, smile, tag]);
    this.physics.add.existing(this.player);
    this.playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setSize(42, 48).setOffset(-21, -2).setCollideWorldBounds(true);
  }

  private buildPartner() {
    const shadow = this.add.ellipse(0, 26, 48, 20, 0x173a29, 0.25);
    const body = this.add.rectangle(0, -5, 50, 54, 0xe68db0).setStrokeStyle(4, 0x69445a);
    const head = this.add.circle(0, -45, 25, 0xf3c58a).setStrokeStyle(4, 0x6b5144);
    const hair = this.add.arc(0, -59, 28, 180, 360, false, 0x46334d).setStrokeStyle(4, 0x33253a);
    const face = this.add.text(0, -45, '•‿•', { fontSize: '15px', color: '#5d3d3d' }).setOrigin(0.5);
    const tag = this.add.text(0, -91, '小伙伴 · 离线', { fontSize: '17px', color: '#fff', backgroundColor: '#604a66', padding: { x: 7, y: 3 } }).setOrigin(0.5);
    this.partner = this.add.container(925, 520, [shadow, body, head, hair, face, tag]).setAlpha(0.85);
  }

  private fit() {
    const portrait = this.scale.height > this.scale.width;
    const base = portrait ? 540 : 850;
    this.cameras.main.setZoom(Phaser.Math.Clamp(this.scale.width / base, 0.58, 1.30));
  }

  update(_: number, dt: number) {
    this.elapsed += dt / 1000;
    let x = 0, y = 0;
    if (this.keys) {
      x += (this.keys.A.isDown || this.keys.LEFT.isDown ? -1 : 0) + (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0);
      y += (this.keys.W.isDown || this.keys.UP.isDown ? -1 : 0) + (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0);
    }
    inputController.setKeys(x, y);
    const keyboard = inputController.vector();
    let vx = keyboard.x, vy = keyboard.y;
    if (Math.hypot(vx, vy) > 0.05) {
      this.moveTarget = null;
      this.moveMarker.setVisible(false);
    } else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.player.x;
      const dy = this.moveTarget.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 10) {
        this.moveTarget = null;
        this.moveMarker.setVisible(false);
        vx = 0; vy = 0;
        gameState.player.x = this.player.x;
        gameState.player.y = this.player.y;
        saveNow();
      } else {
        vx = dx / dist;
        vy = dy / dist;
      }
    }
    this.playerBody.setVelocity(vx * 255, vy * 255);
    this.animatePlayer(vx, vy);
    this.partner.y = 520 + Math.sin(this.elapsed * 1.2) * 4;
    gameState.seconds -= dt / 1000;
    if (gameState.seconds <= 0) this.nextDay();
    this.refreshFocus(false);
  }


  private setClickTarget(pointer: Phaser.Input.Pointer) {
    const world = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
    const x = Phaser.Math.Clamp(world.x, 40, 1860);
    const y = Phaser.Math.Clamp(world.y, 40, 1460);
    this.moveTarget = new Phaser.Math.Vector2(x, y);
    this.moveMarker.setPosition(x, y).setVisible(true);
    gameBus.emit('tutorial', { step: 1, text: '角色正在前往点击位置。靠近土地或树木后再点击右下动作按钮。' });
  }

  private animatePlayer(x: number, y: number) {
    const moving = Math.hypot(x, y) > 0.05;
    this.player.scaleX = x < -0.05 ? -1 : 1;
    this.coat.y = -5 + (moving ? Math.sin(this.elapsed * 10) * 1.8 : 0);
    this.scarf.angle = moving ? Math.sin(this.elapsed * 8) * 5 : 0;
    this.footL.y = 39 + (moving ? Math.sin(this.elapsed * 12) * 4 : 0);
    this.footR.y = 39 - (moving ? Math.sin(this.elapsed * 12) * 4 : 0);
    this.hair.y = -60 + (moving ? Math.sin(this.elapsed * 9) * 1.2 : 0);
  }

  private candidate() { return this.interactions.find(this.player.x, this.player.y); }

  private refreshFocus(force: boolean) {
    const c = this.candidate();
    const id = c?.id || '';
    if (id !== this.focusId) {
      if (this.focusId) this.setFocus(this.focusId, false);
      this.focusId = id;
      if (id) this.setFocus(id, true);
      if (id) gameBus.emit('tutorial', { step: 1, text: '黄色边框是当前目标，点击右下按钮执行动作。' });
    }
    const prompt = this.interactions.prompt(c, this.tool);
    const hud = this.makeHud(prompt);
    const raw = JSON.stringify(hud);
    if (force || raw !== this.lastHud) {
      this.lastHud = raw;
      gameBus.emit('hud', hud);
    }
  }

  private setFocus(id: string, on: boolean) {
    this.plotViews.get(id)?.focus.setVisible(on);
    this.treeViews.get(id)?.focus.setVisible(on);
  }

  private makeHud(prompt: any): HudState {
    const elapsed = 150 - gameState.seconds;
    const h = 6 + Math.floor(elapsed / 12.5);
    const m = Math.floor((elapsed % 12.5) * 4.8);
    return {
      day: gameState.day,
      clock: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      coins: gameState.coins,
      prompt,
      message: '',
      quest: '种下3颗云萝卜',
      questDone: gameState.questDone,
      questTotal: gameState.questTotal,
      inventory: {...gameState.inventory},
      shippingCount: gameState.shippingBin.reduce((n,x)=>n+x.quantity,0),
      saveStatus: '已保存',
    };
  }

  private toast(text: string) { gameBus.emit('toast', text); }

  private act() {
    const c = this.candidate();
    const prompt = this.interactions.prompt(c, this.tool);
    if (!c || !prompt.enabled) { this.toast(prompt.label || '再靠近一点'); return; }
    if (c.kind === 'tree') {
      const t = c.data as TreeState;
      t.hp--;
      const view = this.treeViews.get(t.id)!;
      view.crown.setAlpha(t.hp ? 0.62 : 0.12);
      view.trunk.setAlpha(t.hp ? 0.70 : 0.12);
      view.shine.setVisible(!!t.hp);
      if (!t.hp) { gameState.add('wood'); this.toast('木材已放入背包'); }
      else this.toast('树木摇晃了，再砍一下');
    } else {
      const p = c.data as PlotState;
      if (p.crop === 'mature') { gameState.harvest(p); this.toast('云萝卜已放入背包'); }
      else if (!p.tilled) { p.tilled = true; this.toast('土地已翻松'); }
      else if (p.crop === 'none') { if (gameState.plant(p)) this.toast('种下云萝卜，记得浇水'); else this.toast('金币不足'); }
      else if (!p.watered) { p.watered = true; this.toast('浇水完成，明天会成长'); }
      this.paintPlot(p);
    }
    gameState.player.x=this.player.x;gameState.player.y=this.player.y;saveNow();
    this.refreshFocus(true);
  }

  private paintPlot(p: PlotState) {
    const v = this.plotViews.get(p.id)!;
    v.soil.setFillStyle(!p.tilled ? 0x6dac61 : p.watered ? 0x64483d : 0x9b6645);
    v.soil.setStrokeStyle(4, !p.tilled ? 0x568b49 : 0x73442e);
    v.plant.setText(GameState.cropIcon(p.crop));
    v.hint.setText(p.crop === 'mature' ? '可收获' : p.crop !== 'none' ? (p.watered ? '已浇水' : '需要水') : '');
  }

  private nextDay() {
    const summary = gameState.endDay();
    gameBus.emit('dayEnded', summary);
    for (const p of gameState.plots) this.paintPlot(p);
    this.toast(summary.revenue ? `售出获得 ${summary.revenue} 金币，第 ${gameState.day} 天开始` : `第 ${gameState.day} 天开始`);
    saveNow();
    this.refreshFocus(true);
  }
}
