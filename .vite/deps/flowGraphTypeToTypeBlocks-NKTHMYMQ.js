import {
  FlowGraphUnaryOperationBlock
} from "./chunk-JN4QRMFH.js";
import "./chunk-4EF6JAXD.js";
import {
  FlowGraphInteger,
  RichTypeBoolean,
  RichTypeFlowGraphInteger,
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Data/Transformers/flowGraphTypeToTypeBlocks.js
var FlowGraphBooleanToFloat = class extends FlowGraphUnaryOperationBlock {
  constructor(config) {
    super(RichTypeBoolean, RichTypeNumber, (a) => +a, "FlowGraphBooleanToFloat", config);
  }
};
RegisterClass("FlowGraphBooleanToFloat", FlowGraphBooleanToFloat);
var FlowGraphBooleanToInt = class extends FlowGraphUnaryOperationBlock {
  constructor(config) {
    super(RichTypeBoolean, RichTypeFlowGraphInteger, (a) => FlowGraphInteger.FromValue(+a), "FlowGraphBooleanToInt", config);
  }
};
RegisterClass("FlowGraphBooleanToInt", FlowGraphBooleanToInt);
var FlowGraphFloatToBoolean = class extends FlowGraphUnaryOperationBlock {
  constructor(config) {
    super(RichTypeNumber, RichTypeBoolean, (a) => !!a, "FlowGraphFloatToBoolean", config);
  }
};
RegisterClass("FlowGraphFloatToBoolean", FlowGraphFloatToBoolean);
var FlowGraphIntToBoolean = class extends FlowGraphUnaryOperationBlock {
  constructor(config) {
    super(RichTypeFlowGraphInteger, RichTypeBoolean, (a) => !!a.value, "FlowGraphIntToBoolean", config);
  }
};
RegisterClass("FlowGraphIntToBoolean", FlowGraphIntToBoolean);
var FlowGraphIntToFloat = class extends FlowGraphUnaryOperationBlock {
  constructor(config) {
    super(RichTypeFlowGraphInteger, RichTypeNumber, (a) => a.value, "FlowGraphIntToFloat", config);
  }
};
RegisterClass("FlowGraphIntToFloat", FlowGraphIntToFloat);
var FlowGraphFloatToInt = class extends FlowGraphUnaryOperationBlock {
  constructor(config) {
    super(RichTypeNumber, RichTypeFlowGraphInteger, (a) => {
      const roundingMode = config?.roundingMode;
      switch (roundingMode) {
        case "floor":
          return FlowGraphInteger.FromValue(Math.floor(a));
        case "ceil":
          return FlowGraphInteger.FromValue(Math.ceil(a));
        case "round":
          return FlowGraphInteger.FromValue(Math.round(a));
        default:
          return FlowGraphInteger.FromValue(a);
      }
    }, "FlowGraphFloatToInt", config);
  }
};
RegisterClass("FlowGraphFloatToInt", FlowGraphFloatToInt);
export {
  FlowGraphBooleanToFloat,
  FlowGraphBooleanToInt,
  FlowGraphFloatToBoolean,
  FlowGraphFloatToInt,
  FlowGraphIntToBoolean,
  FlowGraphIntToFloat
};
//# sourceMappingURL=flowGraphTypeToTypeBlocks-NKTHMYMQ.js.map
