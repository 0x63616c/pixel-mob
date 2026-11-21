// Entry used only by scripts/deploy-api.mjs (API deploys without Wrangler): serves the bundled site/ files
// through the same env.ASSETS interface as Workers Static Assets, so worker/index.js is identical either way.
import worker from './index.js';
import { EmbeddedAssets } from './embedded-assets.js';
const assets = new EmbeddedAssets();
export default {
  fetch(req, env, ctx) {
    const e = Object.create(env);
    if (!env.ASSETS) Object.defineProperty(e, 'ASSETS', { value: assets });
    return worker.fetch(req, e, ctx);
  },
};
