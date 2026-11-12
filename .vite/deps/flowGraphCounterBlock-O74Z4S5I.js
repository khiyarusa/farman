import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphCounterBlock.js
var FlowGraphCallCounterBlock = class extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.count = this.registerDataOutput("count", RichTypeNumber);
    this.reset = this._registerSignalInput("reset");
  }
  _execute(context, callingSignal) {
    if (callingSignal === this.reset) {
      context._setExecutionVariable(this, "count", 0);
      this.count.setValue(0, context);
      return;
    }
    const countValue = context._getExecutionVariable(this, "count", 0) + 1;
    context._setExecutionVariable(this, "count", countValue);
    this.count.setValue(countValue, context);
    this.out._activateSignal(context);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphCallCounterBlock";
  }
};
RegisterClass("FlowGraphCallCounterBlock", FlowGraphCallCounterBlock);
export {
  FlowGraphCallCounterBlock
};
//# sourceMappingURL=flowGraphCounterBlock-O74Z4S5I.js.map
