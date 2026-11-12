import {
  getNumericValue
} from "./chunk-RH3T4P6D.js";
import {
  FlowGraphBlock,
  FlowGraphInteger,
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphArrayIndexBlock.js
var FlowGraphArrayIndexBlock = class extends FlowGraphBlock {
  /**
   * Construct a FlowGraphArrayIndexBlock.
   * @param config construction parameters
   */
  constructor(config) {
    super(config);
    this.config = config;
    this.array = this.registerDataInput("array", RichTypeAny);
    this.index = this.registerDataInput("index", RichTypeAny, new FlowGraphInteger(-1));
    this.value = this.registerDataOutput("value", RichTypeAny);
  }
  /**
   * @internal
   */
  _updateOutputs(context) {
    const array = this.array.getValue(context);
    const index = getNumericValue(this.index.getValue(context));
    if (array && index >= 0 && index < array.length) {
      this.value.setValue(array[index], context);
    } else {
      this.value.setValue(null, context);
    }
  }
  /**
   * Serializes this block
   * @param serializationObject the object to serialize to
   */
  serialize(serializationObject) {
    super.serialize(serializationObject);
  }
  getClassName() {
    return "FlowGraphArrayIndexBlock";
  }
};
RegisterClass("FlowGraphArrayIndexBlock", FlowGraphArrayIndexBlock);
export {
  FlowGraphArrayIndexBlock
};
//# sourceMappingURL=flowGraphArrayIndexBlock-EM6IUC2X.js.map
