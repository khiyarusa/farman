import {
  FlowGraphBlock,
  RichTypeAny,
  RichTypeBoolean
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphConditionalDataBlock.js
var FlowGraphConditionalDataBlock = class extends FlowGraphBlock {
  /**
   * Creates a new instance of the block
   * @param config optional configuration for this block
   */
  constructor(config) {
    super(config);
    this.condition = this.registerDataInput("condition", RichTypeBoolean);
    this.onTrue = this.registerDataInput("onTrue", RichTypeAny);
    this.onFalse = this.registerDataInput("onFalse", RichTypeAny);
    this.output = this.registerDataOutput("output", RichTypeAny);
  }
  /**
   * @internal
   */
  _updateOutputs(context) {
    const condition = this.condition.getValue(context);
    this.output.setValue(condition ? this.onTrue.getValue(context) : this.onFalse.getValue(context), context);
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return "FlowGraphConditionalBlock";
  }
};
RegisterClass("FlowGraphConditionalBlock", FlowGraphConditionalDataBlock);
export {
  FlowGraphConditionalDataBlock
};
//# sourceMappingURL=flowGraphConditionalDataBlock-NVACQQFK.js.map
