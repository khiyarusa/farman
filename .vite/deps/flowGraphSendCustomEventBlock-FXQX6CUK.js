import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
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

// node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphSendCustomEventBlock.js
var FlowGraphSendCustomEventBlock = class extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.config = config;
    for (const key in this.config.eventData) {
      this.registerDataInput(key, this.config.eventData[key].type, this.config.eventData[key].value);
    }
  }
  _execute(context) {
    const eventId = this.config.eventId;
    const eventData = {};
    for (const port of this.dataInputs) {
      eventData[port.name] = port.getValue(context);
    }
    context.configuration.coordinator.notifyCustomEvent(eventId, eventData);
    this.out._activateSignal(context);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphReceiveCustomEventBlock";
  }
};
RegisterClass("FlowGraphReceiveCustomEventBlock", FlowGraphSendCustomEventBlock);
export {
  FlowGraphSendCustomEventBlock
};
//# sourceMappingURL=flowGraphSendCustomEventBlock-FXQX6CUK.js.map
