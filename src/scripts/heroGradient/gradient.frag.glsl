// 白〜ミント〜ティールの液体グラデーション（domain-warped fbm）
uniform float uTime;
uniform vec2 uResolution;
// xy: ポインタ位置（0〜1、左下原点）、z: 渦の強さ（0〜1）
uniform vec3 uPointer;
uniform float uProgress;
uniform float uIntensity;
// xy: コピーの中心（0〜1）、zw: コピーの半幅・半高（0〜1）
uniform vec4 uMask;
uniform vec3 uColorBase;
uniform vec3 uColorMint;
uniform vec3 uColorTeal;

varying vec2 vUv;

const float TAU = 6.28318530718;
// 1 周の秒数。時間は orbit 経由でだけ効くので、この周期でちょうど元に戻る
const float CYCLE = 20.0;
const float SWIRL_ANGLE = 1.2;
const float SWIRL_RADIUS = 0.05;
const float GRAIN = 0.035;

// 2D simplex noise — Ian McEwan, Ashima Arts (MIT License)
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  const mat2 rotation = mat2(0.8, 0.6, -0.6, 0.8);
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p);
    p = rotation * p * 2.0 + 17.0;
    amplitude *= 0.45;
  }
  return value;
}

// Hash without Sine — Dave Hoskins (MIT License)
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 position = vec2(vUv.x * aspect, vUv.y);

  // ポインタ周りの座標を回して渦にする
  vec2 center = vec2(uPointer.x * aspect, uPointer.y);
  vec2 offset = position - center;
  float swirl = uPointer.z * SWIRL_ANGLE * exp(-dot(offset, offset) / SWIRL_RADIUS);
  vec2 p = center + mat2(cos(swirl), sin(swirl), -sin(swirl), cos(swirl)) * offset;

  float phase = uTime * TAU / CYCLE;
  vec2 orbit = vec2(cos(phase), sin(phase));
  vec2 q = p * 0.55 + vec2(0.0, uProgress * 0.6);

  vec2 warp1 = vec2(fbm(q + orbit * 0.35), fbm(q + vec2(5.2, 1.3) - orbit.yx * 0.3));
  vec2 warp2 = vec2(
    fbm(q + 0.9 * warp1 + vec2(1.7, 9.2) + orbit * 0.2),
    fbm(q + 0.9 * warp1 + vec2(8.3, 2.8) - orbit * 0.15)
  );
  float n = fbm(q + 1.1 * warp2) * 0.5 + 0.5;

  float mint = smoothstep(0.28, 0.7, n);
  float teal = smoothstep(0.58, 0.95, n + length(warp2) * 0.1 + uProgress * 0.08);
  vec3 color = mix(uColorBase, uColorMint, mint);
  color = mix(color, uColorTeal, teal * 0.55);

  // コピーの周辺は白寄りに保つ（角丸矩形の距離でぼかす）
  vec2 maskCenter = vec2(uMask.x * aspect, uMask.y);
  vec2 maskHalf = vec2(uMask.z * aspect, uMask.w);
  vec2 maskOffset = abs(position - maskCenter) - maskHalf;
  float maskDistance = length(max(maskOffset, 0.0)) + min(max(maskOffset.x, maskOffset.y), 0.0);
  float keepWhite = 1.0 - smoothstep(-0.04, 0.32, maskDistance);
  color = mix(uColorBase, color, clamp(uIntensity, 0.0, 1.0) * (1.0 - keepWhite * 0.85));

  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>

  // 出力色空間に変換した後に grain を足す（banding 対策を兼ねる）
  gl_FragColor.rgb += (hash12(gl_FragCoord.xy) - 0.5) * GRAIN;
}
