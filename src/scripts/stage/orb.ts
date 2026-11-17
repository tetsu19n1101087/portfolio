/**
 * 背景に浮かぶ球体。ノイズで表面をうねらせ、ガラスのような質感を自作のシェーダーで描く。
 * 環境マップや透過の追加パスを使わないので軽く、WebGPU でも WebGL2 でも同じ見た目になる。
 */
import {
  Fn,
  abs,
  cos,
  cross,
  dot,
  exp,
  mix,
  mx_noise_float,
  normalize,
  positionGeometry,
  positionViewDirection,
  pow,
  screenUV,
  transformNormalToView,
  vec2,
  vec3,
} from 'three/tsl';
import { Mesh, MeshBasicNodeMaterial, SphereGeometry } from 'three/webgpu';
import type { Node } from 'three/webgpu';
import type { StageUniforms } from './uniforms';

type ColorFn = (uv: Node<'vec2'>) => Node<'vec3'>;

/** 法線を求めるために、すぐ隣の点をどれだけ離して取るか */
const NEIGHBOR_OFFSET = 0.03;

export const createOrb = (uniforms: StageUniforms, gradient: ColorFn, grain: (color: Node<'vec3'>) => Node<'vec3'>) => {
  // 半径 1 の球。頂点の位置がそのまま外向きの向き（法線）になる
  const geometry = new SphereGeometry(1, 160, 120);
  const material = new MeshBasicNodeMaterial();

  // 球面上の点を、ノイズの量だけ外へ押し出した位置を返す
  const displace = Fn(([direction]: [Node<'vec3'>]) => {
    const drift = vec3(uniforms.time.mul(0.11), uniforms.time.mul(0.07), uniforms.time.mul(0.05));
    const large = mx_noise_float(direction.mul(1.2).add(drift)).mul(0.13);
    const small = mx_noise_float(direction.mul(2.6).sub(drift.mul(1.6))).mul(0.035);
    // ポインタの側をへこませる
    const dent = exp(dot(direction, uniforms.orbPointer).oneMinus().mul(-5)).mul(uniforms.orbDent).mul(-0.22);
    return direction.mul(large.add(small).mul(uniforms.orbWobble).add(dent).add(1));
  });

  const direction = normalize(positionGeometry);

  // うねらせた後の法線は、隣り合う 2 点も同じようにずらして外積で求める
  const helper = abs(direction.y).greaterThan(0.99).select(vec3(1, 0, 0), vec3(0, 1, 0));
  const tangent = normalize(cross(helper, direction));
  const bitangent = cross(direction, tangent);
  const center = displace(direction);
  const alongTangent = displace(normalize(direction.add(tangent.mul(NEIGHBOR_OFFSET))));
  const alongBitangent = displace(normalize(direction.add(bitangent.mul(NEIGHBOR_OFFSET))));
  const displacedNormal = normalize(cross(alongTangent.sub(center), alongBitangent.sub(center)));

  material.positionNode = center;

  // 頂点ごとに計算した法線を、画素へ補間して渡す
  const normal = normalize(transformNormalToView(displacedNormal).toVarying('vOrbNormal'));
  const view = positionViewDirection;
  const facing = dot(normal, view).clamp(0, 1);
  const rim = pow(facing.oneMinus(), 2.4);

  // 中身: 背景のグラデーションを、表面の傾きに応じてずらして映す（屈折の代わり）
  const refractedUv = screenUV.add(vec2(normal.x, normal.y.negate()).mul(0.14).mul(facing.oneMinus().add(0.3)));
  const inside = gradient(refractedUv).mul(2.2).add(uniforms.colorA.mul(0.12));

  // 縁: 見る角度で色相が移る虹色
  const phase = rim.mul(1.5).add(normal.y.mul(0.3)).add(uniforms.time.mul(0.025));
  const rainbow = cos(vec3(0, 0.33, 0.67).add(phase).mul(Math.PI * 2)).mul(0.5).add(0.5);
  const iridescence = mix(rainbow, uniforms.colorA.mul(3), 0.35);

  // 左上からの光の映り込み。うねった法線だけで計算すると平らな面で大きくにじむため、
  // うねる前の球の法線を混ぜて小さくまとめる
  const light = normalize(vec3(-0.45, 0.75, 0.6));
  const smoothNormal = normalize(mix(normal, normalize(transformNormalToView(direction).toVarying('vOrbSphereNormal')), 0.7));
  const highlight = pow(dot(smoothNormal, normalize(light.add(view))).clamp(0, 1), 160).mul(0.55);
  const sheen = pow(dot(normal, light).clamp(0, 1), 4).mul(0.05);

  material.colorNode = grain(mix(inside, iridescence, rim.mul(0.85)).add(highlight).add(sheen));

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;

  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
};
