import {
  GetEnvInfo,
  UploadEnvLevelsAsync,
  UploadEnvSpherical
} from "./chunk-2ZSIEDLV.js";
import "./chunk-HTHC2K5H.js";
import "./chunk-TNWRATKB.js";
import "./chunk-SACGUPWG.js";
import "./chunk-NILNUU5S.js";
import "./chunk-VOXVBXE3.js";
import "./chunk-X6R6SXCK.js";
import "./chunk-PUQI2RKU.js";
import "./chunk-X546WSJS.js";
import "./chunk-LUCTKE24.js";
import "./chunk-LD5ZBJJE.js";
import "./chunk-47UXWHBQ.js";
import "./chunk-SJHN4QA5.js";
import "./chunk-TUWJFONG.js";
import "./chunk-FKMAXMOB.js";
import "./chunk-RK7KWGJI.js";
import "./chunk-BL57CD4C.js";
import "./chunk-Z2AXRV7G.js";
import "./chunk-XAOAEXLS.js";
import "./chunk-TIZQJ37G.js";
import "./chunk-PIDXGDPS.js";
import "./chunk-OY3H5KO3.js";
import "./chunk-A4QROWLZ.js";
import "./chunk-4UFYTMEM.js";
import "./chunk-XPCOJVRL.js";
import "./chunk-WQ2ZP3ZG.js";
import "./chunk-GHQP55O2.js";
import "./chunk-L7FYPZUN.js";
import "./chunk-TYU74FDJ.js";
import "./chunk-FKR3NDUC.js";
import "./chunk-FCRQE7E3.js";
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

// node_modules/@babylonjs/core/Materials/Textures/Loaders/envTextureLoader.js
var _ENVTextureLoader = class {
  constructor() {
    this.supportCascades = false;
  }
  /**
   * Uploads the cube texture data to the WebGL texture. It has already been bound.
   * @param data contains the texture data
   * @param texture defines the BabylonJS internal texture
   * @param createPolynomials will be true if polynomials have been requested
   * @param onLoad defines the callback to trigger once the texture is ready
   * @param onError defines the callback to trigger in case of error
   */
  loadCubeData(data, texture, createPolynomials, onLoad, onError) {
    if (Array.isArray(data)) {
      return;
    }
    const info = GetEnvInfo(data);
    if (info) {
      texture.width = info.width;
      texture.height = info.width;
      try {
        UploadEnvSpherical(texture, info);
        UploadEnvLevelsAsync(texture, data, info).then(() => {
          texture.isReady = true;
          texture.onLoadedObservable.notifyObservers(texture);
          texture.onLoadedObservable.clear();
          if (onLoad) {
            onLoad();
          }
        }, (reason) => {
          onError?.("Can not upload environment levels", reason);
        });
      } catch (e) {
        onError?.("Can not upload environment file", e);
      }
    } else if (onError) {
      onError("Can not parse the environment file", null);
    }
  }
  /**
   * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
   */
  loadData() {
    throw ".env not supported in 2d.";
  }
};
export {
  _ENVTextureLoader
};
//# sourceMappingURL=envTextureLoader-XYNQAWAS.js.map
