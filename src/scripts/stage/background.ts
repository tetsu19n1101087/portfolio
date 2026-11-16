/**
 * 背景の液体グラデーションを TSL（three.js のシェーダー記述）で組み立てる。
 */
import { Fn, cos, dot, exp, fract, mix, mx_noise_float, pow, screenCoordinate, sin, smoothstep, vec2, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import type { StageUniforms } from './uniforms';

/**
 * 粒状ノイズ。暗いグラデーションに出る縞（バンディング）を散らし、質感を足す。
 * 暗部でも見え方が揃うよう、知覚に近い明るさ（ガンマ空間）で足してから戻す。
 */
export const withGrain = (uniforms: StageUniforms) =>
  Fn(([color]: [Node<'vec3'>]) => {
    const seed = screenCoordinate.xy.add(vec2(fract(uniforms.time.mul(7.13)).mul(311.7), fract(uniforms.time.mul(3.71)).mul(183.3)));
    const noise = fract(sin(dot(seed, vec2(12.9898, 78.233))).mul(43758.5453)).sub(0.5);
    const perceptual = pow(color.max(0), vec3(1 / 2.2)).add(noise.mul(0.028));
    return pow(perceptual.max(0), vec3(2.2));
  });

/**
 * 画面上の位置（左上 [0, 0]、右下 [1, 1]）から、グラデーションの色を返す関数を作る。
 * 球体の表面に背景を映し込むときにも同じ関数を使う。
 */
export const createGradient = (uniforms: StageUniforms) =>
  Fn(([uv]: [Node<'vec2'>]) => {
    const ratio = vec2(uniforms.aspect, 1);
    const position = uv.sub(0.5).mul(ratio).toVar();

    // ポインタの周りを渦のようにねじる。離れるほど弱まる
    const pointer = uniforms.pointer.sub(0.5).mul(ratio);
    const fromPointer = position.sub(pointer);
    const angle = exp(dot(fromPointer, fromPointer).mul(-7)).mul(uniforms.pointerForce).mul(1.4);
    const s = sin(angle);
    const c = cos(angle);
    position.assign(pointer.add(vec2(fromPointer.x.mul(c).sub(fromPointer.y.mul(s)), fromPointer.x.mul(s).add(fromPointer.y.mul(c)))));

    // スクロールすると、本文より遅い速さで流れがずれる
    const flowed = position.add(vec2(0, uniforms.scroll.mul(0.3)));

    // ノイズで座標をゆがめてから色を決めると、液体のようなうねりになる
    const time = uniforms.time;
    const warp = vec2(
      mx_noise_float(vec3(flowed.mul(0.9), time.mul(0.07))),
      mx_noise_float(vec3(flowed.mul(0.9).add(7.3), time.mul(0.07).add(3.1))),
    );
    const warped = flowed.add(warp.mul(0.6));
    const fieldA = mx_noise_float(vec3(warped.mul(1.2), time.mul(0.05))).mul(0.5).add(0.5);
    const fieldB = mx_noise_float(vec3(warped.mul(0.75).add(11), time.mul(0.04).add(5))).mul(0.5).add(0.5);

    // 焦点から離れるほど暗くして、文字の載る場所の明るさを抑える
    const fromFocus = position.sub(uniforms.focus.sub(0.5).mul(ratio));
    const glow = mix(0.3, 1, exp(dot(fromFocus, fromFocus).mul(-1.6)));
    const strength = uniforms.intensity.mul(glow);

    const withA = mix(uniforms.base, uniforms.colorA, smoothstep(0.3, 0.9, fieldA).mul(strength));
    return mix(withA, uniforms.colorB, smoothstep(0.42, 0.98, fieldB).mul(strength).mul(0.85));
  });
