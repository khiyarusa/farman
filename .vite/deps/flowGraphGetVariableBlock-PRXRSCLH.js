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
import {
  RegisterClass
} from "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphGetVariableBlock.js
var FlowGraphGetVariableBlock = class extends FlowGraphBlock {
  /**
   * Construct a FlowGraphGetVariableBlock.
   * @param config construction parameters
   */
  constructor(config) {
    super(config);
    this.config = config;
    this.value = this.registerDataOutput("value", RichTypeAny, config.initialValue);
  }
  /**
   * @internal
   */
  _updateOutputs(context) {
    const variableNameValue = this.config.variable;
    if (context.hasVariable(variableNameValue)) {
      this.value.setValue(context.getVariable(variableNameValue), context);
    }
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   */
  serialize(serializationObject) {
    super.serialize(serializationObject);
    serializationObject.config.variable = this.config.variable;
  }
  getClassName() {
    return "FlowGraphGetVariableBlock";
  }
};
RegisterClass("FlowGraphGetVariableBlock", FlowGraphGetVariableBlock);
export {
  FlowGraphGetVariableBlock
};
//# sourceMappingURL=flowGraphGetVariableBlock-PRXRSCLH.js.map
