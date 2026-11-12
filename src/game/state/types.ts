export type Tool='hand'|'hoe'|'seed'|'water'|'axe';
export type CropStage='none'|'seeded'|'sprout'|'mature';
export type PlotState={id:string;x:number;y:number;tilled:boolean;watered:boolean;crop:CropStage};
export type TreeState={id:string;x:number;y:number;hp:number};
export type Prompt={label:string;enabled:boolean;targetId?:string};
export type HudState={day:number;clock:string;coins:number;prompt:Prompt;message:string;quest:string;questDone:number;questTotal:number};
export type GameEvents={hud:HudState;toast:string;tutorial:{step:number;text:string};ready:true};
