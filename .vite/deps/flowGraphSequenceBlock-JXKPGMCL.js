import {
  FlowGraphExecutionBlock
} from "./chunk-FL3XGGJF.js";
import "./chunk-C6RQ3N4C.js";
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSequenceBlock.js
var FlowGraphSequenceBlock = class extends FlowGraphExecutionBlock {
  constructor(config) {
    super(config);
    this.config = config;
    this.executionSignals = [];
    this.setNumberOfOutputSignals(this.config.outputSignalCount);
  }
  _execute(context) {
    for (let i = 0; i < this.executionSignals.length; i++) {
      this.executionSignals[i]._activateSignal(context);
    }
  }
  /**
   * Sets the block's output flows. Would usually be passed from the constructor but can be changed afterwards.
   * @param outputSignalCount the number of output flows
   */
  setNumberOfOutputSignals(outputSignalCount = 1) {
    while (this.executionSignals.length > outputSignalCount) {
      const flow = this.executionSignals.pop();
      if (flow) {
        flow.disconnectFromAll();
        this._unregisterSignalOutput(flow.name);
      }
    }
    while (this.executionSignals.length < outputSignalCount) {
      this.executionSignals.push(this._registerSignalOutput(`out_${this.executionSignals.length}`));
    }
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphSequenceBlock";
  }
};
RegisterClass("FlowGraphSequenceBlock", FlowGraphSequenceBlock);
export {
  FlowGraphSequenceBlock
};
//# sourceMappingURL=flowGraphSequenceBlock-JXKPGMCL.js.map
