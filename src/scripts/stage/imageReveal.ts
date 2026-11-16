/**
 * 画像がノイズの境界から溶け出すように現れる演出。作品カードごとの小さな canvas に描く。
 * 背景と同じレンダラー（同じ GPU デバイス）を使い回し、描き先だけを切り替える。
 * この切り替え（CanvasTarget）は WebGPU でしか使えないため、WebGL2 では使わない。
 */
import { mix, mx_noise_float, sin, smoothstep, texture, uniform, uv, vec2, vec3 } from 'three/tsl';
import { CanvasTarget, Color, LinearFilter, MeshBasicNodeMaterial, QuadMesh, SRGBColorSpace, Texture } from 'three/webgpu';
import type { WebGPURenderer } from 'three/webgpu';

export interface ImageRevealLayer {
  /** 0 で何も見えず、1 で画像がすべて見える */
  setProgress(value: number): void;
  render(renderer: WebGPURenderer): void;
  dispose(): void;
}

export interface ImageRevealOptions {
  canvas: HTMLCanvasElement;
  image: HTMLImageElement;
  /** まだ現れていない部分の色（カードの下地の色） */
  surfaceColor: string;
  /** 境界を光らせる色 */
  glowColor: string;
}

/** 境界のぼかし幅 */
const EDGE = 0.07;

export const createImageRevealLayer = async ({
  canvas,
  image,
  surfaceColor,
  glowColor,
}: ImageRevealOptions): Promise<ImageRevealLayer> => {
  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);
  const pixelRatio = Math.min(window.devicePixelRatio, 2);

  // object-fit: cover と同じ切り抜きにする。画像を canvas を覆う最小の大きさへ縮め、はみ出す分はテクスチャ座標で切る
  const canvasAspect = width / height;
  const imageAspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
  const cover = imageAspect > canvasAspect ? vec2(canvasAspect / imageAspect, 1) : vec2(1, imageAspect / canvasAspect);
  const coverScale = Math.max(width / image.naturalWidth, height / Math.max(image.naturalHeight, 1)) * pixelRatio;

  // <img> をそのままテクスチャにすると、three.js が表示上の大きさでテクスチャを確保し、
  // 元画像の左上だけが切り取られる。表示する大きさに縮めた ImageBitmap を作って渡す
  const bitmap = await createImageBitmap(image, {
    resizeWidth: Math.max(Math.round(image.naturalWidth * Math.min(coverScale, 1)), 1),
    resizeHeight: Math.max(Math.round(image.naturalHeight * Math.min(coverScale, 1)), 1),
    resizeQuality: 'high',
  });

  // ここから先で失敗したら、作った ImageBitmap を閉じてから失敗を伝える
  try {
    const target = new CanvasTarget(canvas);
    target.setPixelRatio(pixelRatio);
    target.setSize(width, height, false);

    const map = new Texture(bitmap);
    map.colorSpace = SRGBColorSpace;
    // 全画面用の板（QuadMesh）のテクスチャ座標は左上が原点なので、上下反転はしない
    map.flipY = false;
    // 表示する大きさに合わせてあるので、縮小用のミップマップは作らない
    map.generateMipmaps = false;
    map.minFilter = LinearFilter;
    map.needsUpdate = true;

    const progress = uniform(0);
    // カードごとに模様を変える
    const seed = Math.random() * 100;

    const position = uv().sub(0.5).mul(vec2(canvasAspect, 1));
    const coarse = mx_noise_float(vec3(position.mul(2.1), seed)).mul(0.5).add(0.5);
    const fine = mx_noise_float(vec3(position.mul(6.5), seed + 3.7)).mul(0.5).add(0.5);
    // 下から上へ満ちていくように、縦位置の傾きを足す
    const field = coarse.mul(0.5).add(fine.mul(0.12)).add(uv().y.oneMinus().mul(0.38));

    const threshold = progress.mul(1.3).sub(0.15);
    const revealed = smoothstep(threshold.sub(EDGE), threshold, field).oneMinus();
    const band = smoothstep(threshold.sub(EDGE * 2.5), threshold, field).mul(smoothstep(threshold, threshold.add(EDGE), field).oneMinus());

    // 現れきるまでは、画像を少しゆがめて液体越しに見えるようにする
    const distortion = vec2(coarse.sub(0.5), fine.sub(0.5)).mul(progress.oneMinus()).mul(0.07);
    const sampled = texture(map, uv().sub(0.5).mul(cover).add(0.5).add(distortion)).rgb;

    const material = new MeshBasicNodeMaterial();
    material.colorNode = mix(uniform(new Color(surfaceColor)), sampled, revealed).add(
      uniform(new Color(glowColor))
        .mul(band)
        .mul(sin(progress.mul(Math.PI)))
        .mul(1.6),
    );

    const quad = new QuadMesh(material);

    return {
      setProgress(value) {
        progress.value = value;
      },
      render(renderer) {
        renderer.setCanvasTarget(target);
        quad.render(renderer);
      },
      dispose() {
        map.dispose();
        bitmap.close();
        material.dispose();
        target.dispose();
      },
    };
  } catch (error) {
    bitmap.close();
    throw error;
  }
};
