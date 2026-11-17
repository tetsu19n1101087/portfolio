/**
 * カルーセルが動いている間、速さに応じて画像を弓なりにゆがめ、色をずらす演出。
 * カルーセルの表示領域に重ねた canvas に、見えているスライド（最大 2 枚）を描く。
 * 作品カードの演出と同じく、背景のレンダラーを使い回す（WebGPU のときだけ使える）。
 */
import { float, mix, step, texture, uniform, uv, vec2, vec3 } from 'three/tsl';
import {
  CanvasTarget,
  Color,
  DataTexture,
  LinearFilter,
  MeshBasicNodeMaterial,
  QuadMesh,
  SRGBColorSpace,
  Texture,
  Vector3,
} from 'three/webgpu';
import type { Node, WebGPURenderer } from 'three/webgpu';

export interface CarouselDistortionOptions {
  canvas: HTMLCanvasElement;
  /** 画像のない部分の色（表示領域の下地の色） */
  surfaceColor: string;
}

export interface CarouselSlideFrame {
  /** スライドの番号 */
  index: number;
  /** 表示領域の左端から、スライドの左端までの距離。表示領域の幅を 1 とする */
  left: number;
  /** 画像の高さ。表示領域の高さを 1 とする */
  height: number;
}

export interface CarouselDistortionLayer {
  /** canvas の大きさが変わったときに呼ぶ */
  resize(): void;
  /** スライドの画像を、テクスチャとして使えるようにする */
  setSlideImage(index: number, image: HTMLImageElement): Promise<void>;
  hasSlide(index: number): boolean;
  /** いま見えているスライド（2 枚まで）と、速さ（-1〜1）を渡す */
  setFrame(slides: CarouselSlideFrame[], velocity: number): void;
  render(renderer: WebGPURenderer): void;
  dispose(): void;
}

/** 使っていない枠のスライドを置く位置。表示領域の外 */
const OFFSCREEN = 5;

export const createCarouselDistortionLayer = ({ canvas, surfaceColor }: CarouselDistortionOptions): CarouselDistortionLayer => {
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  const target = new CanvasTarget(canvas);
  target.setPixelRatio(pixelRatio);

  const resize = () => {
    target.setSize(Math.max(canvas.clientWidth, 1), Math.max(canvas.clientHeight, 1), false);
  };
  resize();

  // 画像がまだ無い枠に入れておく 1 画素のテクスチャ
  const blank = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  blank.needsUpdate = true;

  const velocity = uniform(0);
  const slots = [0, 1].map(() => ({
    map: texture(blank),
    left: uniform(OFFSCREEN),
    height: uniform(1),
  }));

  // 縦の中央ほど大きく横へずらすと、弓なりに曲がって見える
  const base = uv();
  const bend = velocity.mul(0.09).mul(base.y.sub(0.5).pow2().mul(4).oneMinus());
  const x = base.x.sub(bend);
  // 速いほど、赤と青を左右へずらす
  const split = velocity.mul(0.005);

  // Color が持つ r・g・b は、計算用（リニア）に直した後の値
  const surface = new Color(surfaceColor);
  let color: Node<'vec3'> = uniform(new Vector3(surface.r, surface.g, surface.b));
  slots.forEach((slot) => {
    const u = x.sub(slot.left);
    const v = base.y.div(slot.height);
    const inside = step(0, u).mul(step(u, 1)).mul(step(v, 1));
    const sampled = vec3(
      slot.map.sample(vec2(u.add(split), v)).r,
      slot.map.sample(vec2(u, v)).g,
      slot.map.sample(vec2(u.sub(split), v)).b,
    );
    color = mix(color, sampled, inside);
  });

  const material = new MeshBasicNodeMaterial();
  // 速いときは、わずかに明るくして勢いを出す
  material.colorNode = color.mul(float(1).add(velocity.abs().mul(0.08)));
  const quad = new QuadMesh(material);

  const textures = new Map<number, { map: Texture; bitmap: ImageBitmap }>();
  let disposed = false;

  return {
    resize,
    async setSlideImage(index, image) {
      if (disposed || textures.has(index) || image.naturalWidth === 0) {
        return;
      }
      // 表示する幅に合わせて縮める（元画像のままだと GPU のメモリを使いすぎる）
      const scale = Math.min((Math.max(canvas.clientWidth, 1) * pixelRatio) / image.naturalWidth, 1);
      const bitmap = await createImageBitmap(image, {
        resizeWidth: Math.max(Math.round(image.naturalWidth * scale), 1),
        resizeHeight: Math.max(Math.round(image.naturalHeight * scale), 1),
        resizeQuality: 'high',
      });
      if (disposed || textures.has(index)) {
        bitmap.close();
        return;
      }
      const map = new Texture(bitmap);
      map.colorSpace = SRGBColorSpace;
      map.flipY = false;
      map.generateMipmaps = false;
      map.minFilter = LinearFilter;
      map.needsUpdate = true;
      textures.set(index, { map, bitmap });
    },
    hasSlide: (index) => textures.has(index),
    setFrame(slides, nextVelocity) {
      velocity.value = nextVelocity;
      slots.forEach((slot, slotIndex) => {
        const slide = slides[slotIndex];
        const entry = slide ? textures.get(slide.index) : undefined;
        if (!slide || !entry) {
          slot.left.value = OFFSCREEN;
          return;
        }
        slot.map.value = entry.map;
        slot.left.value = slide.left;
        slot.height.value = Math.max(slide.height, 0.0001);
      });
    },
    render(renderer) {
      renderer.setCanvasTarget(target);
      quad.render(renderer);
    },
    dispose() {
      disposed = true;
      textures.forEach(({ map, bitmap }) => {
        map.dispose();
        bitmap.close();
      });
      textures.clear();
      blank.dispose();
      material.dispose();
      target.dispose();
    },
  };
};
