/**
 * 背景の「場面」の定義。three.js には依存しない。
 * セクションやページに data-stage="<名前>" を付けると、その場所で背景がこの値へ滑らかに移る。
 */

export interface StageScene {
  /** グラデーションの主色。文字の可読性を保つため、暗めの色を指定する */
  colorA: string;
  /** グラデーションの副色 */
  colorB: string;
  /** 色の強さ。0 でベース色（--color-dark）一色になる */
  intensity: number;
  /** 流れの速さの倍率 */
  flow: number;
  /** 色が最も明るくなる位置。画面左上を [0, 0]、右下を [1, 1] とする */
  focus: [number, number];
}

/** ベース色。variables.scss の --color-dark と同じ値にする */
export const STAGE_BASE_COLOR = '#020617';

export const stageScenes = {
  default: {
    colorA: '#0b4f6c',
    colorB: '#1b2a6b',
    intensity: 0.6,
    flow: 0.6,
    focus: [0.85, 0.2],
  },
  hero: {
    colorA: '#0c6b70',
    colorB: '#2a2f8f',
    intensity: 1,
    flow: 1,
    focus: [0.72, 0.45],
  },
  works: {
    colorA: '#0b4f6c',
    colorB: '#1b2a6b',
    intensity: 0.7,
    flow: 0.7,
    focus: [0.12, 0.3],
  },
  about: {
    colorA: '#3b2a7a',
    colorB: '#0c5a63',
    intensity: 0.75,
    flow: 0.6,
    focus: [0.82, 0.6],
  },
  worksIndex: {
    colorA: '#0b4f6c',
    colorB: '#1b2a6b',
    intensity: 0.7,
    flow: 0.7,
    focus: [0.85, 0.2],
  },
  // 本文を読むページ。色も動きも抑える
  workDetail: {
    colorA: '#0a3d47',
    colorB: '#1a1f55',
    intensity: 0.45,
    flow: 0.4,
    focus: [0.9, 0.12],
  },
} satisfies Record<string, StageScene>;

export type StageSceneName = keyof typeof stageScenes;

export const isStageSceneName = (value: string | undefined): value is StageSceneName =>
  value !== undefined && value in stageScenes;

/** 入口（index.ts）が書き込み、描画側（renderer.ts）が毎フレーム読む値 */
export interface StageInput {
  /** いま目指している場面 */
  scene: StageScene;
  /** ポインタの位置。画面左上を [0, 0]、右下を [1, 1] とする */
  pointer: [number, number];
  /** ポインタが動いた直後は 1、しばらく動かないと 0 へ戻る値の目標 */
  pointerActive: number;
  /** スクロール量。画面の高さを 1 とする */
  scroll: number;
}

export const createStageInput = (): StageInput => ({
  scene: stageScenes.default,
  pointer: [0.5, 0.5],
  pointerActive: 0,
  scroll: 0,
});
