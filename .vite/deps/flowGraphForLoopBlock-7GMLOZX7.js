import {
  getNumericValue
} from "./chunk-RH3T4P6D.js";
import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  FlowGraphInteger,
  RichTypeAny,
  RichTypeFlowGraphInteger,
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphForLoopBlock.js
var FlowGraphForLoopBlock = class _FlowGraphForLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.startIndex = this.registerDataInput("startIndex", RichTypeAny, 0);
    this.endIndex = this.registerDataInput("endIndex", RichTypeAny);
    this.step = this.registerDataInput("step", RichTypeNumber, 1);
    this.index = this.registerDataOutput("index", RichTypeFlowGraphInteger, new FlowGraphInteger(getNumericValue(config?.initialIndex ?? 0)));
    this.executionFlow = this._registerSignalOutput("executionFlow");
    this.completed = this._registerSignalOutput("completed");
    this._unregisterSignalOutput("out");
  }
  /**
   * @internal
   */
  _execute(context) {
    const index = getNumericValue(this.startIndex.getValue(context));
    const step = this.step.getValue(context);
    let endIndex = getNumericValue(this.endIndex.getValue(context));
    for (let i = index; i < endIndex; i += step) {
      this.index.setValue(new FlowGraphInteger(i), context);
      this.executionFlow._activateSignal(context);
      endIndex = getNumericValue(this.endIndex.getValue(context));
      if (i > _FlowGraphForLoopBlock.MaxLoopIterations * step) {
        break;
      }
    }
    if (this.config?.incrementIndexWhenLoopDone) {
      this.index.setValue(new FlowGraphInteger(getNumericValue(this.index.getValue(context)) + step), context);
    }
    this.completed._activateSignal(context);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphForLoopBlock";
  }
};
FlowGraphForLoopBlock.MaxLoopIterations = 1e3;
RegisterClass("FlowGraphForLoopBlock", FlowGraphForLoopBlock);
export {
  FlowGraphForLoopBlock
};
//# sourceMappingURL=flowGraphForLoopBlock-7GMLOZX7.js.map
