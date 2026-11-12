import {
  FlowGraphBlock,
  RichTypeAny
} from "./chunk-C6RQ3N4C.js";
import "./chunk-6CCHNGZY.js";
import "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphCodeExecutionBlock.js
var FlowGraphCodeExecutionBlock = class extends FlowGraphBlock {
  /**
   * Construct a FlowGraphCodeExecutionBlock.
   * @param config construction parameters
   */
  constructor(config) {
    super(config);
    this.config = config;
    this.executionFunction = this.registerDataInput("function", RichTypeAny);
    this.value = this.registerDataInput("value", RichTypeAny);
    this.result = this.registerDataOutput("result", RichTypeAny);
  }
  /**
   * @internal
   */
  _updateOutputs(context) {
    const func = this.executionFunction.getValue(context);
    const value = this.value.getValue(context);
    if (func) {
      this.result.setValue(func(value, context), context);
    }
  }
  getClassName() {
    return "FlowGraphCodeExecutionBlock";
  }
};
export {
  FlowGraphCodeExecutionBlock
};
//# sourceMappingURL=flowGraphCodeExecutionBlock-H5AP7BMB.js.map
