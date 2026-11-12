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
  RichTypeNumber
} from "./chunk-C6RQ3N4C.js";
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphPointerOutEventBlock.js
var FlowGraphPointerOutEventBlock = class extends FlowGraphEventBlock {
  constructor(config) {
    super(config);
    this.type = "PointerOut";
    this.pointerId = this.registerDataOutput("pointerId", RichTypeNumber);
    this.targetMesh = this.registerDataInput("targetMesh", RichTypeAny, config?.targetMesh);
    this.meshOutOfPointer = this.registerDataOutput("meshOutOfPointer", RichTypeAny);
  }
  _executeEvent(context, payload) {
    const mesh = this.targetMesh.getValue(context);
    this.meshOutOfPointer.setValue(payload.mesh, context);
    this.pointerId.setValue(payload.pointerId, context);
    const skipEvent = payload.over && _IsDescendantOf(payload.mesh, mesh);
    if (!skipEvent && (payload.mesh === mesh || _IsDescendantOf(payload.mesh, mesh))) {
      this._execute(context);
      return !this.config?.stopPropagation;
    }
    return true;
  }
  _preparePendingTasks(_context) {
  }
  _cancelPendingTasks(_context) {
  }
  getClassName() {
    return "FlowGraphPointerOutEventBlock";
  }
};
RegisterClass("FlowGraphPointerOutEventBlock", FlowGraphPointerOutEventBlock);
export {
  FlowGraphPointerOutEventBlock
};
//# sourceMappingURL=flowGraphPointerOutEventBlock-W7CS7VIU.js.map
