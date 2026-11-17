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
  /** 球体の位置と大きさ。背景の色も、この位置で最も明るくなる */
  orb: OrbPose;
  /** 縦長の画面（スマートフォンなど）での球体の位置と大きさ */
  orbNarrow: OrbPose;
}

export interface OrbPose {
  /** 画面中央を 0、左端を -1、右端を 1 とする横位置 */
  x: number;
  /** 画面中央を 0、下端を -1、上端を 1 とする縦位置 */
  y: number;
  /** 半径。画面の高さを 1 とする */
  size: number;
}

/** ベース色。variables.scss の --color-dark と同じ値にする */
export const STAGE_BASE_COLOR = '#020617';

export const stageScenes = {
  default: {
    colorA: '#0b4f6c',
    colorB: '#1b2a6b',
    intensity: 0.6,
    flow: 0.6,
    orb: { x: 0.84, y: 0.6, size: 0.1 },
    orbNarrow: { x: 0.8, y: 0.74, size: 0.07 },
  },
  hero: {
    colorA: '#0a565c',
    colorB: '#272c86',
    intensity: 1,
    flow: 1,
    orb: { x: 0.6, y: 0.02, size: 0.27 },
    orbNarrow: { x: 0.42, y: 0.46, size: 0.17 },
  },
  works: {
    colorA: '#0b4f6c',
    colorB: '#1b2a6b',
    intensity: 0.7,
    flow: 0.7,
    orb: { x: 0.9, y: 0.68, size: 0.13 },
    orbNarrow: { x: 0.82, y: 0.78, size: 0.08 },
  },
  about: {
    colorA: '#3b2a7a',
    colorB: '#0c5a63',
    intensity: 0.75,
    flow: 0.6,
    orb: { x: 0.7, y: -0.2, size: 0.2 },
    orbNarrow: { x: 0.75, y: -0.55, size: 0.12 },
  },
  worksIndex: {
    colorA: '#0b4f6c',
    colorB: '#1b2a6b',
    intensity: 0.7,
    flow: 0.7,
    orb: { x: 0.84, y: 0.6, size: 0.1 },
    orbNarrow: { x: 0.8, y: 0.74, size: 0.07 },
  },
  // 本文を読むページ。色も動きも抑える
  workDetail: {
    colorA: '#0a3d47',
    colorB: '#1a1f55',
    intensity: 0.45,
    flow: 0.4,
    orb: { x: 0.93, y: 0.72, size: 0.07 },
    orbNarrow: { x: 0.85, y: 0.8, size: 0.05 },
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
  /** ページ遷移で背景が画面を覆っている度合い。0 で通常、1 で画面全体を覆う */
  flood: number;
  /** 覆いが広がり始める位置。画面左上を [0, 0]、右下を [1, 1] とする */
  floodOrigin: [number, number];
}

export const createStageInput = (): StageInput => ({
  scene: stageScenes.default,
  pointer: [0.5, 0.5],
  pointerActive: 0,
  scroll: 0,
  flood: 0,
  floodOrigin: [0.5, 0.5],
});
