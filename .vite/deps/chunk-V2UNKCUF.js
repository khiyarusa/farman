import {
  ShaderStore
} from "./chunk-SEACPUNZ.js";

// node_modules/@babylonjs/core/Shaders/ShadersInclude/pointCloudVertex.js
var name = "pointCloudVertex";
var shader = `#if defined(POINTSIZE) && !defined(WEBGPU)
gl_PointSize=pointSize;
#endif
`;
if (!ShaderStore.IncludesShadersStore[name]) {
  ShaderStore.IncludesShadersStore[name] = shader;
}
//# sourceMappingURL=chunk-V2UNKCUF.js.map
