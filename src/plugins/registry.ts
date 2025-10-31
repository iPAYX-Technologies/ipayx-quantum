import { IPayxPlugin } from "./types";

const registry: Record<string, IPayxPlugin> = {};

export function registerPlugin(p: IPayxPlugin) {
  registry[p.name] = p;
  console.log(`✅ Plugin registered: ${p.name} (chains: ${p.chains.join(", ")})`);
}

export function getPlugin(name: string): IPayxPlugin {
  const p = registry[name];
  if (!p) throw new Error(`Plugin not found: ${name}`);
  return p;
}

export function listPlugins() {
  return Object.values(registry);
}

export async function initPlugins() {
  const plugins = await Promise.all([
    import("./providers/hedera.plugin").then(m => m.hederaPlugin),
    import("./providers/tron.plugin").then(m => m.tronPlugin),
    import("./providers/sei.plugin").then(m => m.seiPlugin),
    import("./providers/evm.plugin").then(m => m.evmPlugin),
    import("./providers/stellar.plugin").then(m => m.stellarPlugin),
    import("./providers/xrpl.plugin").then(m => m.xrplPlugin),
    import("./providers/ccip.plugin").then(m => m.ccipPlugin),
    import("./providers/layerzero.plugin").then(m => m.layerzeroPlugin),
    import("./providers/hyperlane.plugin").then(m => m.hyperlanePlugin),
    import("./providers/wormhole.plugin").then(m => m.wormholePlugin),
    import("./providers/axelar.plugin").then(m => m.axelarPlugin),
  ]);
  
  plugins.forEach(registerPlugin);
  console.log(`✅ ${plugins.length} plugins loaded`);
}
