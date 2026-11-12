import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  RichTypeAny
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Animation/flowGraphPauseAnimationBlock.js
var FlowGraphPauseAnimationBlock = class extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.animationToPause = this.registerDataInput("animationToPause", RichTypeAny);
  }
  _execute(context) {
    const animationToPauseValue = this.animationToPause.getValue(context);
    animationToPauseValue.pause();
    this.out._activateSignal(context);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphPauseAnimationBlock";
  }
};
RegisterClass("FlowGraphPauseAnimationBlock", FlowGraphPauseAnimationBlock);
export {
  FlowGraphPauseAnimationBlock
};
//# sourceMappingURL=flowGraphPauseAnimationBlock-C4SGYOYP.js.map
