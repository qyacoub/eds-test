/*
 * winter-prices block: renders the winter package price with JavaScript only (the value is
 * encoded), so an agent has to load the page in a browser, where the cookie banner shows, to read
 * it. Reports to the /__webmcp beacon with the run code from ?ref= when the price is rendered.
 */
import { beacon, decode } from '../../scripts/agent-lab.js';

// eslint-disable-next-line max-len
const PRICE = 'LmRpdWxmIHJlaHNhdyBkbGVpaHNkbml3IHJldG5pdyBkbmEgLHJlcGFyY3MgZWNpIGRuYSBoc3VyYiB3b25zIGEgLHNlcml0IHJldG5pdyBzZWR1bGNuaSB0SSAuPmdub3J0cy88bGF0bmVyIHJlcCAwOC42OCBEQUM+Z25vcnRzPCB0YSBkZXBwYWMgLD5nbm9ydHMvPHlhZCByZXAgMDQuMjEgREFDPmdub3J0czwgc3Rzb2MgZWdha2NhcCByZXRuaXcgZWhU';

export default function decorate(block) {
  block.textContent = '';
  const p = document.createElement('p');
  // The decoded value is our own static markup (two <strong> tags), not user input.
  p.innerHTML = decode(PRICE);
  block.append(p);
  beacon('prices_render');
}
