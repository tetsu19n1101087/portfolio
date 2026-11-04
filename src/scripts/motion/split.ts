import { gsap, SplitText } from './core';

// line-height: 1 の見出しでもマスクで字形の上下が欠けないよう、マスクの上下に余白を足して同じ量だけ打ち消す
const MASK_BLEED = '0.15em';

/** 空白を除いた各文字の位置を、分割前のテキストから測る */
const measureGlyphs = (el: HTMLElement) => {
  const rects: DOMRect[] = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';

    for (let i = 0; i < text.length; i += 1) {
      if (/\s/.test(text[i])) {
        continue;
      }

      range.setStart(node, i);
      range.setEnd(node, i + 1);
      rects.push(range.getBoundingClientRect());
    }
  }

  return rects;
};

/**
 * 1 文字ずつ別要素に分けるとカーニングが効かなくなり、revert() の瞬間に文字が横にずれる。
 * 分割前の位置との差をマスクの左マージンで埋めて、分割中も元の字送りを保つ。
 */
const keepKerning = (split: SplitText, glyphs: DOMRect[]) => {
  const { chars, masks } = split;

  if (glyphs.length !== chars.length || masks.length !== chars.length) {
    return;
  }

  const current = chars.map((char) => char.getBoundingClientRect());
  let prevShift = 0;

  current.forEach((rect, i) => {
    const shift = glyphs[i].left - rect.left;
    const isLineStart = i === 0 || Math.abs(rect.top - current[i - 1].top) > 1;
    const mask = masks[i];

    if (!isLineStart && mask instanceof HTMLElement) {
      mask.style.marginInlineStart = `${shift - prevShift}px`;
    }

    prevShift = shift;
  });
};

/**
 * text-transform: capitalize は inline-block に分けた各文字を単語の先頭とみなし、全文字を大文字にする。
 * 単語の 2 文字目以降だけ打ち消して、分割前と同じ表記を保つ。
 */
const keepCapitalize = (el: HTMLElement, split: SplitText) => {
  if (getComputedStyle(el).textTransform !== 'capitalize') {
    return;
  }

  split.words.forEach((word) => {
    split.chars
      .filter((char) => word.contains(char))
      .slice(1)
      .forEach((char) => {
        if (char instanceof HTMLElement) {
          char.style.textTransform = 'none';
        }
      });
  });
};

/**
 * 見出しを 1 文字ずつマスクの下からせり上げる。
 * 単語単位でも包んで単語途中の改行を防ぎ、完了後は revert() で元の DOM に戻す。
 */
export const animateCharsIn = (el: HTMLElement, vars: gsap.TweenVars = {}) => {
  const glyphs = measureGlyphs(el);
  const split = SplitText.create(el, {
    type: 'words,chars',
    mask: 'chars',
  });

  split.masks.forEach((mask) => {
    if (mask instanceof HTMLElement) {
      mask.style.paddingBlock = MASK_BLEED;
      mask.style.marginBlock = `-${MASK_BLEED}`;
    }
  });

  // 文字幅が変わるので、字送りの補正より先に表記を戻す
  keepCapitalize(el, split);
  keepKerning(split, glyphs);

  // 文字は全てマスクの下にあるので、見出し自体の初期非表示を外しても見えない
  gsap.set(el, { opacity: 1 });

  const { onComplete, ...rest } = vars;

  return gsap.from(split.chars, {
    yPercent: 100,
    stagger: 0.03,
    ...rest,
    onComplete: () => {
      split.revert();
      onComplete?.();
    },
  });
};
