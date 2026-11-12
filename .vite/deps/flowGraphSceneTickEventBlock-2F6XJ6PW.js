import {
  FlowGraphEventBlock
} from "./chunk-GDYZGBZS.js";
import "./chunk-7QGMUAC2.js";
import "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSceneTickEventBlock.js
var FlowGraphSceneTickEventBlock = class extends FlowGraphEventBlock {
  constructor() {
    super();
    this.type = "SceneBeforeRender";
    this.timeSinceStart = this.registerDataOutput("timeSinceStart", RichTypeNumber);
    this.deltaTime = this.registerDataOutput("deltaTime", RichTypeNumber);
  }
  /**
   * @internal
   */
  _preparePendingTasks(_context) {
  }
  /**
   * @internal
   */
  _executeEvent(context, payload) {
    this.timeSinceStart.setValue(payload.timeSinceStart, context);
    this.deltaTime.setValue(payload.deltaTime, context);
    this._execute(context);
    return true;
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
    return "FlowGraphSceneTickEventBlock";
  }
};
RegisterClass("FlowGraphSceneTickEventBlock", FlowGraphSceneTickEventBlock);
export {
  FlowGraphSceneTickEventBlock
};
//# sourceMappingURL=flowGraphSceneTickEventBlock-2F6XJ6PW.js.map
