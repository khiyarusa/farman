import {
  FlowGraphEventBlock
} from "./chunk-GDYZGBZS.js";
import "./chunk-7QGMUAC2.js";
import "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import "./chunk-C6RQ3N4C.js";
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSceneReadyEventBlock.js
var FlowGraphSceneReadyEventBlock = class extends FlowGraphEventBlock {
  constructor() {
    super(...arguments);
    this.initPriority = -1;
    this.type = "SceneReady";
  }
  _executeEvent(context, _payload) {
    this._execute(context);
    return true;
  }
  _preparePendingTasks(context) {
  }
  _cancelPendingTasks(context) {
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphSceneReadyEventBlock";
  }
};
RegisterClass("FlowGraphSceneReadyEventBlock", FlowGraphSceneReadyEventBlock);
export {
  FlowGraphSceneReadyEventBlock
};
//# sourceMappingURL=flowGraphSceneReadyEventBlock-6NCMUSFV.js.map
