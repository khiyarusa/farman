import {
  _IsDescendantOf
} from "./chunk-RH3T4P6D.js";
import {
  FlowGraphEventBlock
} from "./chunk-GDYZGBZS.js";
import "./chunk-7QGMUAC2.js";
import "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  RichTypeAny,
  RichTypeNumber,
  RichTypeVector3
} from "./chunk-C6RQ3N4C.js";
import {
  PointerEventTypes
} from "./chunk-RK7KWGJI.js";
import "./chunk-6CCHNGZY.js";
import "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import {
  RegisterClass
} from "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphMeshPickEventBlock.js
var FlowGraphMeshPickEventBlock = class extends FlowGraphEventBlock {
  constructor(config) {
    super(config);
    this.config = config;
    this.type = "MeshPick";
    this.asset = this.registerDataInput("asset", RichTypeAny, config?.targetMesh);
    this.pickedPoint = this.registerDataOutput("pickedPoint", RichTypeVector3);
    this.pickOrigin = this.registerDataOutput("pickOrigin", RichTypeVector3);
    this.pointerId = this.registerDataOutput("pointerId", RichTypeNumber);
    this.pickedMesh = this.registerDataOutput("pickedMesh", RichTypeAny);
    this.pointerType = this.registerDataInput("pointerType", RichTypeAny, PointerEventTypes.POINTERPICK);
  }
  _getReferencedMesh(context) {
    return this.asset.getValue(context);
  }
  _executeEvent(context, pickedInfo) {
    const pointerType = this.pointerType.getValue(context);
    if (pointerType !== pickedInfo.type) {
      return true;
    }
    const mesh = this._getReferencedMesh(context);
    if (mesh && pickedInfo.pickInfo?.pickedMesh && (pickedInfo.pickInfo?.pickedMesh === mesh || _IsDescendantOf(pickedInfo.pickInfo?.pickedMesh, mesh))) {
      this.pointerId.setValue(pickedInfo.event.pointerId, context);
      this.pickOrigin.setValue(pickedInfo.pickInfo.ray?.origin, context);
      this.pickedPoint.setValue(pickedInfo.pickInfo.pickedPoint, context);
      this.pickedMesh.setValue(pickedInfo.pickInfo.pickedMesh, context);
      this._execute(context);
      return !this.config?.stopPropagation;
    } else {
      this.pointerId.resetToDefaultValue(context);
      this.pickOrigin.resetToDefaultValue(context);
      this.pickedPoint.resetToDefaultValue(context);
      this.pickedMesh.resetToDefaultValue(context);
    }
    return true;
  }
  /**
   * @internal
   */
  _preparePendingTasks(_context) {
  }
  /**
   * @internal
   */
  _cancelPendingTasks(_context) {
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphMeshPickEventBlock";
  }
};
RegisterClass("FlowGraphMeshPickEventBlock", FlowGraphMeshPickEventBlock);
export {
  FlowGraphMeshPickEventBlock
};
//# sourceMappingURL=flowGraphMeshPickEventBlock-VG2E5EKS.js.map
