import {
  getNumericValue
} from "./chunk-RH3T4P6D.js";
import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  RichTypeFlowGraphInteger
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphCancelDelayBlock.js
var FlowGraphCancelDelayBlock = class extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.delayIndex = this.registerDataInput("delayIndex", RichTypeFlowGraphInteger);
  }
  _execute(context, _callingSignal) {
    const delayIndex = getNumericValue(this.delayIndex.getValue(context));
    if (delayIndex <= 0 || isNaN(delayIndex) || !isFinite(delayIndex)) {
      return this._reportError(context, "Invalid delay index");
    }
    const timers = context._getGlobalContextVariable("pendingDelays", []);
    const timer = timers[delayIndex];
    if (timer) {
      timer.dispose();
    }
    this.out._activateSignal(context);
  }
  getClassName() {
    return "FlowGraphCancelDelayBlock";
  }
};
RegisterClass("FlowGraphCancelDelayBlock", FlowGraphCancelDelayBlock);
export {
  FlowGraphCancelDelayBlock
};
//# sourceMappingURL=flowGraphCancelDelayBlock-GOIP4SLM.js.map
