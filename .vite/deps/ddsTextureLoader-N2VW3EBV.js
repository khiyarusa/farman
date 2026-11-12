import {
  DDSTools
} from "./chunk-KLKJVCIY.js";
import "./chunk-Q7CK4PKC.js";
import "./chunk-NILNUU5S.js";
import "./chunk-VOXVBXE3.js";
import "./chunk-X6R6SXCK.js";
import "./chunk-PUQI2RKU.js";
import "./chunk-X546WSJS.js";
import "./chunk-LUCTKE24.js";
import {
  SphericalPolynomial
} from "./chunk-LD5ZBJJE.js";
import "./chunk-47UXWHBQ.js";
import "./chunk-SJHN4QA5.js";
import "./chunk-Z2AXRV7G.js";
import "./chunk-XAOAEXLS.js";
import "./chunk-TIZQJ37G.js";
import "./chunk-PIDXGDPS.js";
import "./chunk-OY3H5KO3.js";
import "./chunk-A4QROWLZ.js";
import "./chunk-4UFYTMEM.js";
import "./chunk-XPCOJVRL.js";
import "./chunk-WQ2ZP3ZG.js";
import "./chunk-TYU74FDJ.js";
import "./chunk-FKR3NDUC.js";
import "./chunk-HQFYYCIB.js";
import "./chunk-56R6SLXN.js";
import "./chunk-SMBXAMFT.js";
import "./chunk-QBFOJVNJ.js";
import "./chunk-P5UHPJUF.js";
import "./chunk-V5DQ4GQZ.js";
import "./chunk-DNMF2AQB.js";
import "./chunk-6CCHNGZY.js";
import "./chunk-VFZGOG7I.js";
import "./chunk-RNBHK7DW.js";
import "./chunk-BM6KRUOE.js";
import "./chunk-UMQQ7LY7.js";
import "./chunk-SEACPUNZ.js";
import "./chunk-PL6H5BHA.js";
import "./chunk-J2BGSIQE.js";
import "./chunk-72UO6CVR.js";
import "./chunk-7FIJNGMA.js";
import "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/Materials/Textures/Loaders/ddsTextureLoader.js
var _DDSTextureLoader = class {
  constructor() {
    this.supportCascades = true;
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param imgs contains the cube maps
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   */
  loadCubeData(imgs, texture, createPolynomials, onLoad) {
    const engine = texture.getEngine();
    let info;
    let loadMipmap = false;
    let maxLevel = 1e3;
    if (Array.isArray(imgs)) {
      for (let index = 0; index < imgs.length; index++) {
        const data = imgs[index];
        info = DDSTools.GetDDSInfo(data);
        texture.width = info.width;
        texture.height = info.height;
        loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps;
        engine._unpackFlipY(info.isCompressed);
        DDSTools.UploadDDSLevels(engine, texture, data, info, loadMipmap, 6, -1, index);
        if (!info.isFourCC && info.mipmapCount === 1) {
          engine.generateMipMapsForCubemap(texture);
        } else {
          maxLevel = info.mipmapCount - 1;
        }
      }
    } else {
      const data = imgs;
      info = DDSTools.GetDDSInfo(data);
      texture.width = info.width;
      texture.height = info.height;
      if (createPolynomials) {
        info.sphericalPolynomial = new SphericalPolynomial();
      }
      loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps;
      engine._unpackFlipY(info.isCompressed);
      DDSTools.UploadDDSLevels(engine, texture, data, info, loadMipmap, 6);
      if (!info.isFourCC && info.mipmapCount === 1) {
        engine.generateMipMapsForCubemap(texture, false);
      } else {
        maxLevel = info.mipmapCount - 1;
      }
    }
    engine._setCubeMapTextureParams(texture, loadMipmap, maxLevel);
    texture.isReady = true;
    texture.onLoadedObservable.notifyObservers(texture);
    texture.onLoadedObservable.clear();
    if (onLoad) {
      onLoad({ isDDS: true, width: texture.width, info, data: imgs, texture });
    }
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param callback defines the method to call once ready to upload
   */
  loadData(data, texture, callback) {
    const info = DDSTools.GetDDSInfo(data);
    const loadMipmap = (info.isRGB || info.isLuminance || info.mipmapCount > 1) && texture.generateMipMaps && Math.max(info.width, info.height) >> info.mipmapCount - 1 === 1;
    callback(info.width, info.height, loadMipmap, info.isFourCC, () => {
      DDSTools.UploadDDSLevels(texture.getEngine(), texture, data, info, loadMipmap, 1);
    });
  }
};
export {
  _DDSTextureLoader
};
//# sourceMappingURL=ddsTextureLoader-N2VW3EBV.js.map
