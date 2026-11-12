import {
  FlowGraphExecutionBlock
} from "./chunk-FL3XGGJF.js";
import {
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphFlipFlopBlock.js
var FlowGraphFlipFlopBlock = class extends FlowGraphExecutionBlock {
  constructor(config) {
    super(config);
    this.onOn = this._registerSignalOutput("onOn");
    this.onOff = this._registerSignalOutput("onOff");
    this.value = this.registerDataOutput("value", RichTypeBoolean);
  }
  _execute(context, _callingSignal) {
    let value = context._getExecutionVariable(this, "value", typeof this.config?.startValue === "boolean" ? !this.config.startValue : false);
    value = !value;
    context._setExecutionVariable(this, "value", value);
    this.value.setValue(value, context);
    if (value) {
      this.onOn._activateSignal(context);
    } else {
      this.onOff._activateSignal(context);
    }
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphFlipFlopBlock";
  }
};
RegisterClass("FlowGraphFlipFlopBlock", FlowGraphFlipFlopBlock);
export {
  FlowGraphFlipFlopBlock
};
//# sourceMappingURL=flowGraphFlipFlopBlock-LTMJGS73.js.map
