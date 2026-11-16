/**
 * 背景のシェーダーへ渡す値（uniform）。描画側が毎フレーム書き換える。
 */
import { uniform } from 'three/tsl';
import { Color, Vector2 } from 'three/webgpu';
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
});

export type StageUniforms = ReturnType<typeof createStageUniforms>;
