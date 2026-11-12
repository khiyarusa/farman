import {
  FlowGraphBlock,
  FlowGraphInteger,
  RichTypeAny,
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphIndexOfBlock.js
var FlowGraphIndexOfBlock = class extends FlowGraphBlock {
  /**
   * Construct a FlowGraphIndexOfBlock.
   * @param config construction parameters
   */
  constructor(config) {
    super(config);
    this.config = config;
    this.object = this.registerDataInput("object", RichTypeAny);
    this.array = this.registerDataInput("array", RichTypeAny);
    this.index = this.registerDataOutput("index", RichTypeFlowGraphInteger, new FlowGraphInteger(-1));
  }
  /**
   * @internal
   */
  _updateOutputs(context) {
    const object = this.object.getValue(context);
    const array = this.array.getValue(context);
    if (array) {
      this.index.setValue(new FlowGraphInteger(array.indexOf(object)), context);
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
    return "FlowGraphIndexOfBlock";
  }
};
RegisterClass("FlowGraphIndexOfBlock", FlowGraphIndexOfBlock);
export {
  FlowGraphIndexOfBlock
};
//# sourceMappingURL=flowGraphIndexOfBlock-RBK3UDQC.js.map
