import {
  FlowGraphBlock,
  RichTypeAny,
  RichTypeString
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Utils/flowGraphFunctionReferenceBlock.js
var FlowGraphFunctionReferenceBlock = class extends FlowGraphBlock {
  constructor(config) {
    super(config);
    this.functionName = this.registerDataInput("functionName", RichTypeString);
    this.object = this.registerDataInput("object", RichTypeAny);
    this.context = this.registerDataInput("context", RichTypeAny, null);
    this.output = this.registerDataOutput("output", RichTypeAny);
  }
  _updateOutputs(context) {
    const functionName = this.functionName.getValue(context);
    const object = this.object.getValue(context);
    const contextValue = this.context.getValue(context);
    if (object && functionName) {
      const func = object[functionName];
      if (func && typeof func === "function") {
        this.output.setValue(func.bind(contextValue), context);
      }
    }
  }
  getClassName() {
    return "FlowGraphFunctionReference";
  }
};
RegisterClass("FlowGraphFunctionReference", FlowGraphFunctionReferenceBlock);
export {
  FlowGraphFunctionReferenceBlock
};
//# sourceMappingURL=flowGraphFunctionReferenceBlock-S6P6TRSU.js.map
