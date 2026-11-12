import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  FlowGraphInteger,
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphDoNBlock.js
var FlowGraphDoNBlock = class extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config = {}) {
    super(config);
    this.config = config;
    this.config.startIndex = config.startIndex ?? new FlowGraphInteger(0);
    this.reset = this._registerSignalInput("reset");
    this.maxExecutions = this.registerDataInput("maxExecutions", RichTypeFlowGraphInteger);
    this.executionCount = this.registerDataOutput("executionCount", RichTypeFlowGraphInteger, new FlowGraphInteger(0));
  }
  _execute(context, callingSignal) {
    if (callingSignal === this.reset) {
      this.executionCount.setValue(this.config.startIndex, context);
    } else {
      const currentCountValue = this.executionCount.getValue(context);
      if (currentCountValue.value < this.maxExecutions.getValue(context).value) {
        this.executionCount.setValue(new FlowGraphInteger(currentCountValue.value + 1), context);
        this.out._activateSignal(context);
      }
    }
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphDoNBlock";
  }
};
RegisterClass("FlowGraphDoNBlock", FlowGraphDoNBlock);
export {
  FlowGraphDoNBlock
};
//# sourceMappingURL=flowGraphDoNBlock-JKF2D53U.js.map
