import {
  FlowGraphBlock,
  RichTypeAny,
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphContextBlock.js
var FlowGraphContextBlock = class extends FlowGraphBlock {
  constructor(config) {
    super(config);
    this.userVariables = this.registerDataOutput("userVariables", RichTypeAny);
    this.executionId = this.registerDataOutput("executionId", RichTypeNumber);
  }
  _updateOutputs(context) {
    this.userVariables.setValue(context.userVariables, context);
    this.executionId.setValue(context.executionId, context);
  }
  serialize(serializationObject) {
    super.serialize(serializationObject);
  }
  getClassName() {
    return "FlowGraphContextBlock";
  }
};
RegisterClass("FlowGraphContextBlock", FlowGraphContextBlock);
export {
  FlowGraphContextBlock
};
//# sourceMappingURL=flowGraphContextBlock-OMXJQP3R.js.map
