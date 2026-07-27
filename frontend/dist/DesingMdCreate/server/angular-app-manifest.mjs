
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1047, hash: '13ef37c649b3bb8eda7a8f830c59e3cd3b9c9d18cba6a1e3470b6b227d137c3b', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 952, hash: 'fe824158412825b66df4526aad61fc2d3e312c7ad89771f103956724201800be', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 9015, hash: '273a907d40b7bbf637e86fe53e2c972b8cd0961e72406200a469dc724e3edd89', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-NEWSGKCQ.css': {size: 552, hash: 'XPXdpuEH+bM', text: () => import('./assets-chunks/styles-NEWSGKCQ_css.mjs').then(m => m.default)}
  },
};
