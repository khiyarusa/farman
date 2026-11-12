import {
  BezierCurveEase
} from "./chunk-KKBWEXPX.js";
import {
  FlowGraphBlock,
  RichTypeAny,
  RichTypeNumber,
  RichTypeVector2
} from "./chunk-C6RQ3N4C.js";
import "./chunk-SJHN4QA5.js";
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/Animation/flowGraphBezierCurveEasingBlock.js
var FlowGraphBezierCurveEasingBlock = class extends FlowGraphBlock {
  constructor(config) {
    super(config);
    this.config = config;
    this._easingFunctions = {};
    this.mode = this.registerDataInput("mode", RichTypeNumber, 0);
    this.controlPoint1 = this.registerDataInput("controlPoint1", RichTypeVector2);
    this.controlPoint2 = this.registerDataInput("controlPoint2", RichTypeVector2);
    this.easingFunction = this.registerDataOutput("easingFunction", RichTypeAny);
  }
  _updateOutputs(context) {
    const mode = this.mode.getValue(context);
    const controlPoint1 = this.controlPoint1.getValue(context);
    const controlPoint2 = this.controlPoint2.getValue(context);
    if (mode === void 0) {
      return;
    }
    const key = `${mode}-${controlPoint1.x}-${controlPoint1.y}-${controlPoint2.x}-${controlPoint2.y}`;
    if (!this._easingFunctions[key]) {
      const easing = new BezierCurveEase(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y);
      easing.setEasingMode(mode);
      this._easingFunctions[key] = easing;
    }
    this.easingFunction.setValue(this._easingFunctions[key], context);
  }
  getClassName() {
    return "FlowGraphBezierCurveEasing";
  }
};
RegisterClass("FlowGraphBezierCurveEasing", FlowGraphBezierCurveEasingBlock);
export {
  FlowGraphBezierCurveEasingBlock
};
//# sourceMappingURL=flowGraphBezierCurveEasingBlock-GRYIKPYM.js.map
