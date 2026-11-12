import {
  FlowGraphBlock,
  defaultValueSerializationFunction,
  getRichTypeFromValue
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/flowGraphConstantBlock.js
var FlowGraphConstantBlock = class extends FlowGraphBlock {
  constructor(config) {
    super(config);
    this.config = config;
    this.output = this.registerDataOutput("output", getRichTypeFromValue(config.value));
  }
  _updateOutputs(context) {
    this.output.setValue(this.config.value, context);
  }
  /**
   * Gets the class name of this block
   * @returns the class name
   */
  getClassName() {
    return "FlowGraphConstantBlock";
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   * @param valueSerializeFunction the function to use to serialize the value
   */
  serialize(serializationObject = {}, valueSerializeFunction = defaultValueSerializationFunction) {
    super.serialize(serializationObject);
    valueSerializeFunction("value", this.config.value, serializationObject.config);
  }
};
RegisterClass("FlowGraphConstantBlock", FlowGraphConstantBlock);
export {
  FlowGraphConstantBlock
};
//# sourceMappingURL=flowGraphConstantBlock-HN6UECVT.js.map
