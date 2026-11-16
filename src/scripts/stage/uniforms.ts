/**
 * 背景のシェーダーへ渡す値（uniform）。描画側が毎フレーム書き換える。
 */
import { uniform } from 'three/tsl';
import { Color, Vector2, Vector3 } from 'three/webgpu';
import { STAGE_BASE_COLOR } from './presets';

export const createStageUniforms = () => ({
  time: uniform(0),
  /** 画面の横 ÷ 縦 */
  aspect: uniform(1),
  /** ポインタの位置。画面左上を [0, 0]、右下を [1, 1] とする */
  pointer: uniform(new Vector2(0.5, 0.5)),
  /** ポインタ周りの渦の強さ。0 で渦なし */
  pointerForce: uniform(0),
  /** スクロール量。画面の高さを 1 とする */
  scroll: uniform(0),
  /** 色が最も明るくなる位置 */
  focus: uniform(new Vector2(0.5, 0.5)),
  base: uniform(new Color(STAGE_BASE_COLOR)),
  colorA: uniform(new Color(STAGE_BASE_COLOR)),
  colorB: uniform(new Color(STAGE_BASE_COLOR)),
  /** 色の強さ。0 でベース色一色になる */
  intensity: uniform(0),
  /** ページ遷移で背景が画面を覆っている度合い。0 で通常、1 で画面全体を覆う */
  flood: uniform(0),
  /** 覆いが広がり始める位置 */
  floodOrigin: uniform(new Vector2(0.5, 0.5)),
  /** 球体の表面のうねりの大きさ */
  orbWobble: uniform(1),
  /** 球体の中心から見たポインタの向き */
  orbPointer: uniform(new Vector3(0, 0, 1)),
  /** ポインタの側のへこみの強さ。0 でへこみなし */
  orbDent: uniform(0),
});

export type StageUniforms = ReturnType<typeof createStageUniforms>;
