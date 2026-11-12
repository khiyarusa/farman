import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  RichTypeBoolean
} from "./chunk-C6RQ3N4C.js";
import "./chunk-6CCHNGZY.js";
import {
  Logger
} from "./chunk-UMQQ7LY7.js";
import "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import {
  RegisterClass
} from "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphWhileLoopBlock.js
var FlowGraphWhileLoopBlock = class _FlowGraphWhileLoopBlock extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.config = config;
    this.condition = this.registerDataInput("condition", RichTypeBoolean);
    this.executionFlow = this._registerSignalOutput("executionFlow");
    this.completed = this._registerSignalOutput("completed");
    this._unregisterSignalOutput("out");
  }
  _execute(context, _callingSignal) {
    let conditionValue = this.condition.getValue(context);
    if (this.config?.doWhile && !conditionValue) {
      this.executionFlow._activateSignal(context);
    }
    let i = 0;
    while (conditionValue) {
      this.executionFlow._activateSignal(context);
      ++i;
      if (i >= _FlowGraphWhileLoopBlock.MaxLoopCount) {
        Logger.Warn("FlowGraphWhileLoopBlock: Max loop count reached. Breaking.");
        break;
      }
      conditionValue = this.condition.getValue(context);
    }
    this.completed._activateSignal(context);
  }
  getClassName() {
    return "FlowGraphWhileLoopBlock";
  }
};
FlowGraphWhileLoopBlock.MaxLoopCount = 1e3;
RegisterClass("FlowGraphWhileLoopBlock", FlowGraphWhileLoopBlock);
export {
  FlowGraphWhileLoopBlock
};
//# sourceMappingURL=flowGraphWhileLoopBlock-ZXMDBMRA.js.map
