/*
 * cc-test.js — TEST ONLY
 *
 * Plants color-contrast (WCAG 1.4.3) and link-in-text-block (WCAG 1.4.1) defects as inline styles
 * on injected text, keyed by pathname (only ever acts on /cc-* pages). The EDS content pipeline
 * strips authored inline styles, so the styles are applied here in the rendered DOM. ASO scrapes
 * the JS-rendered DOM and runs axe-core on it; SemRush only would with JS-rendering ON.
 *
 * Backgrounds are pinned (white, or a background-image for the needs-review case) so the contrast
 * ratio under test is well-defined. Hex/ratio targets are documented inline per scenario.
 */

const WHITE = '#ffffff';
// real asset so axe sees a background-image it cannot compute a ratio against (→ needs-review)
const BG_IMAGE = 'https://www.w3schools.com/w3images/lights.jpg';

function addBlock({ text, styles = {}, wrapStyles = {} }) {
  const main = document.querySelector('main');
  if (!main) return null;
  const wrap = document.createElement('div');
  wrap.className = 'cc-test';
  wrap.style.backgroundColor = WHITE;
  wrap.style.padding = '24px';
  Object.assign(wrap.style, wrapStyles);
  const p = document.createElement('p');
  p.textContent = text;
  Object.assign(p.style, styles);
  wrap.appendChild(p);
  main.appendChild(wrap);
  return wrap;
}

function run() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const injectors = {
    // #1a1a1a on #fff ≈ 16:1 — accessible baseline, no violation expected.
    '/cc-clean-control': () => addBlock({
      text: 'Open daily from 9am. All exhibits are free to members.',
      styles: { color: '#1a1a1a', fontSize: '16px' },
    }),
    // #8e8e8e on #fff ≈ 3.3:1, NORMAL 16px → fails the 4.5:1 minimum → color-contrast violation.
    '/cc-normal-below-4.5': () => addBlock({
      text: 'Membership renews annually; you can cancel anytime from your account page.',
      styles: { color: '#8e8e8e', fontSize: '16px' },
    }),
    // #767676 on #fff ≈ 4.54:1, NORMAL → just passes AA → must NOT be flagged (precision).
    '/cc-normal-boundary-pass': () => addBlock({
      text: 'Please keep noise to a minimum in the reading room.',
      styles: { color: '#767676', fontSize: '16px' },
    }),
    // #8e8e8e ≈ 3.3:1 but LARGE 28px → passes via the large-text 3:1 exception → must NOT be flagged.
    '/cc-large-3to1-pass': () => addBlock({
      text: 'Summer hours: 10am to 8pm',
      styles: { color: '#8e8e8e', fontSize: '28px', fontWeight: '400' },
    }),
    // #b0b0b0 on #fff ≈ 2.1:1, LARGE 28px → fails even the 3:1 large-text threshold → violation.
    '/cc-large-below-3': () => addBlock({
      text: 'Closed July 4 for the holiday',
      styles: { color: '#b0b0b0', fontSize: '28px' },
    }),
    // Inline link set apart from body text by colour only: #333 link vs #1a1a1a text is <3:1, with
    // no underline → link-in-text-block violation. (#333 on white ≈ 12:1, so it is NOT a
    // color-contrast failure — isolating the link-in-text-block defect.)
    '/cc-link-in-text-block': () => {
      const wrap = addBlock({
        text: 'For more on our collection, see ',
        styles: { color: '#1a1a1a', fontSize: '16px' },
      });
      if (!wrap) return;
      const p = wrap.querySelector('p');
      const a = document.createElement('a');
      a.href = '/cc-clean-control';
      a.textContent = 'the curator’s notes';
      a.style.color = '#333333';
      a.style.textDecoration = 'none';
      p.appendChild(a);
      p.appendChild(document.createTextNode('.'));
    },
    // White text over a background IMAGE → axe cannot compute a ratio → needs-review (incomplete),
    // which ASO does not surface (it aggregates violations only) → ASO miss.
    '/cc-text-on-image': () => addBlock({
      text: 'Now showing: Lights of the North — a luminous winter installation.',
      styles: { color: '#ffffff', fontSize: '18px', padding: '40px' },
      wrapStyles: {
        backgroundColor: 'transparent',
        backgroundImage: `url(${BG_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
    }),
  };
  const injector = injectors[path];
  if (injector) injector();
}

// main must exist; run after the DOM is parsed.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
