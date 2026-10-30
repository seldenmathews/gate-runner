const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes('wav')) {
  config.resolver.assetExts.push('wav');
}

/**
 * three@0.187's package exports send require() to build/three.cjs.
 * That file calls process.emitWarning at import time, which Hermes does not
 * implement, so Expo Go crashes on the first screen that loads
 * @react-three/fiber/native (it does require('three')).
 * The ESM build does not touch process. Force every `three` import onto it.
 */
const threeEsm = path.join(__dirname, 'node_modules/three/build/three.module.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three' || moduleName === 'three/build/three.cjs') {
    return { type: 'sourceFile', filePath: threeEsm };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
