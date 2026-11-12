import {
  FlowGraphCoordinator
} from "./chunk-CXNV7UTW.js";
import "./chunk-YPN2AXKP.js";
import "./chunk-RH3T4P6D.js";
import {
  FlowGraphEventBlock
} from "./chunk-GDYZGBZS.js";
import "./chunk-7QGMUAC2.js";
import "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import "./chunk-C6RQ3N4C.js";
import "./chunk-RK7KWGJI.js";
import {
  Tools
} from "./chunk-P5UHPJUF.js";
import "./chunk-V5DQ4GQZ.js";
import "./chunk-DNMF2AQB.js";
import "./chunk-6CCHNGZY.js";
import "./chunk-VFZGOG7I.js";
import "./chunk-RNBHK7DW.js";
import "./chunk-BM6KRUOE.js";
import "./chunk-UMQQ7LY7.js";
import "./chunk-SEACPUNZ.js";
import "./chunk-PL6H5BHA.js";
import "./chunk-72UO6CVR.js";
import "./chunk-7FIJNGMA.js";
import "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import {
  RegisterClass
} from "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/FlowGraph/Blocks/Event/flowGraphReceiveCustomEventBlock.js
var FlowGraphReceiveCustomEventBlock = class extends FlowGraphEventBlock {
  constructor(config) {
    super(config);
    this.config = config;
    this.initPriority = 1;
    for (const key in this.config.eventData) {
      this.registerDataOutput(key, this.config.eventData[key].type);
    }
  }
  _preparePendingTasks(context) {
    const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
    if (observable && observable.hasObservers() && observable.observers.length > FlowGraphCoordinator.MaxEventsPerType) {
      this._reportError(context, `FlowGraphReceiveCustomEventBlock: Too many observers for event ${this.config.eventId}. Max is ${FlowGraphCoordinator.MaxEventsPerType}.`);
      return;
    }
    const eventObserver = observable.add((eventData) => {
      const keys = Object.keys(eventData);
      for (const key of keys) {
        this.getDataOutput(key)?.setValue(eventData[key], context);
      }
      this._execute(context);
    });
    context._setExecutionVariable(this, "_eventObserver", eventObserver);
  }
  _cancelPendingTasks(context) {
    const observable = context.configuration.coordinator.getCustomEventObservable(this.config.eventId);
    if (observable) {
      const eventObserver = context._getExecutionVariable(this, "_eventObserver", null);
      observable.remove(eventObserver);
    } else {
      Tools.Warn(`FlowGraphReceiveCustomEventBlock: Missing observable for event ${this.config.eventId}`);
    }
  }
  _executeEvent(_context, _payload) {
    return true;
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphReceiveCustomEventBlock";
  }
};
RegisterClass("FlowGraphReceiveCustomEventBlock", FlowGraphReceiveCustomEventBlock);
export {
  FlowGraphReceiveCustomEventBlock
};
//# sourceMappingURL=flowGraphReceiveCustomEventBlock-YFFISTN7.js.map
