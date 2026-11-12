import {
  Light
} from "./chunk-3SNLELJE.js";
import {
  Node
} from "./chunk-BIH5THMU.js";
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
import {
  __decorate,
  serializeAsColor3,
  serializeAsVector3
} from "./chunk-72UO6CVR.js";
import "./chunk-7FIJNGMA.js";
import {
  Matrix,
  Vector3
} from "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import {
  Color3
} from "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import {
  RegisterClass
} from "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/Lights/hemisphericLight.js
Node.AddNodeConstructor("Light_Type_3", (name, scene) => {
  return () => new HemisphericLight(name, Vector3.Zero(), scene);
});
var HemisphericLight = class extends Light {
  /**
   * Creates a HemisphericLight object in the scene according to the passed direction (Vector3).
   * The HemisphericLight simulates the ambient environment light, so the passed direction is the light reflection direction, not the incoming direction.
   * The HemisphericLight can't cast shadows.
   * Documentation : https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
   * @param name The friendly name of the light
   * @param direction The direction of the light reflection
   * @param scene The scene the light belongs to
   * @param dontAddToScene True to not add the light to the scene
   */
  constructor(name, direction, scene, dontAddToScene) {
    super(name, scene, dontAddToScene);
    this.groundColor = new Color3(0, 0, 0);
    this.direction = direction || Vector3.Up();
  }
  _buildUniformLayout() {
    this._uniformBuffer.addUniform("vLightData", 4);
    this._uniformBuffer.addUniform("vLightDiffuse", 4);
    this._uniformBuffer.addUniform("vLightSpecular", 4);
    this._uniformBuffer.addUniform("vLightGround", 3);
    this._uniformBuffer.addUniform("shadowsInfo", 3);
    this._uniformBuffer.addUniform("depthValues", 2);
    this._uniformBuffer.create();
  }
  /**
   * Returns the string "HemisphericLight".
   * @returns The class name
   */
  getClassName() {
    return "HemisphericLight";
  }
  /**
   * Sets the HemisphericLight direction towards the passed target (Vector3).
   * Returns the updated direction.
   * @param target The target the direction should point to
   * @returns The computed direction
   */
  setDirectionToTarget(target) {
    this.direction = Vector3.Normalize(target.subtract(Vector3.Zero()));
    return this.direction;
  }
  /**
   * Returns the shadow generator associated to the light.
   * @returns Always null for hemispheric lights because it does not support shadows.
   */
  getShadowGenerator() {
    return null;
  }
  /**
   * Sets the passed Effect object with the HemisphericLight normalized direction and color and the passed name (string).
   * @param _effect The effect to update
   * @param lightIndex The index of the light in the effect to update
   * @returns The hemispheric light
   */
  transferToEffect(_effect, lightIndex) {
    const normalizeDirection = Vector3.Normalize(this.direction);
    this._uniformBuffer.updateFloat4("vLightData", normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0, lightIndex);
    this._uniformBuffer.updateColor3("vLightGround", this.groundColor.scale(this.intensity), lightIndex);
    return this;
  }
  transferToNodeMaterialEffect(effect, lightDataUniformName) {
    const normalizeDirection = Vector3.Normalize(this.direction);
    effect.setFloat3(lightDataUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z);
    return this;
  }
  /**
   * Computes the world matrix of the node
   * @returns the world matrix
   */
  computeWorldMatrix() {
    if (!this._worldMatrix) {
      this._worldMatrix = Matrix.Identity();
    }
    return this._worldMatrix;
  }
  /**
   * Returns the integer 3.
   * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  getTypeID() {
    return Light.LIGHTTYPEID_HEMISPHERICLIGHT;
  }
  /**
   * Prepares the list of defines specific to the light type.
   * @param defines the list of defines
   * @param lightIndex defines the index of the light for the effect
   */
  prepareLightSpecificDefines(defines, lightIndex) {
    defines["HEMILIGHT" + lightIndex] = true;
  }
};
__decorate([
  serializeAsColor3()
], HemisphericLight.prototype, "groundColor", void 0);
__decorate([
  serializeAsVector3()
], HemisphericLight.prototype, "direction", void 0);
RegisterClass("BABYLON.HemisphericLight", HemisphericLight);
export {
  HemisphericLight
};
//# sourceMappingURL=@babylonjs_core_Lights_hemisphericLight.js.map
