import {
  FlowGraphExecutionBlockWithOutSignal
} from "./chunk-RXJYF5MU.js";
import "./chunk-FL3XGGJF.js";
import {
  RichTypeAny
} from "./chunk-C6RQ3N4C.js";
import "./chunk-6CCHNGZY.js";
import {
  Logger
} from "./chunk-UMQQ7LY7.js";
import "./chunk-VRSVNNT2.js";
import "./chunk-KH7OXBY7.js";
import "./chunk-WNRGLLCG.js";
import "./chunk-7SFGFRN6.js";
import "./chunk-PUA2HRJM.js";
import {
  RegisterClass
} from "./chunk-KITXCBO2.js";
import "./chunk-PVI5UHGD.js";

// node_modules/@babylonjs/core/FlowGraph/Blocks/Execution/flowGraphConsoleLogBlock.js
var FlowGraphConsoleLogBlock = class extends FlowGraphExecutionBlockWithOutSignal {
  constructor(config) {
    super(config);
    this.message = this.registerDataInput("message", RichTypeAny);
    this.logType = this.registerDataInput("logType", RichTypeAny, "log");
    if (config?.messageTemplate) {
      const matches = this._getTemplateMatches(config.messageTemplate);
      for (const match of matches) {
        this.registerDataInput(match, RichTypeAny);
      }
    }
  }
  /**
   * @internal
   */
  _execute(context) {
    const typeValue = this.logType.getValue(context);
    const messageValue = this._getMessageValue(context);
    if (typeValue === "warn") {
      Logger.Warn(messageValue);
    } else if (typeValue === "error") {
      Logger.Error(messageValue);
    } else {
      Logger.Log(messageValue);
    }
    this.out._activateSignal(context);
  }
  /**
   * @returns class name of the block.
   */
  getClassName() {
    return "FlowGraphConsoleLogBlock";
  }
  _getMessageValue(context) {
    if (this.config?.messageTemplate) {
      let template = this.config.messageTemplate;
      const matches = this._getTemplateMatches(template);
      for (const match of matches) {
        const value = this.getDataInput(match)?.getValue(context);
        if (value !== void 0) {
          template = template.replace(new RegExp(`\\{${match}\\}`, "g"), value.toString());
        }
      }
      return template;
    } else {
      return this.message.getValue(context);
    }
  }
  _getTemplateMatches(template) {
    const regex = /\{([^}]+)\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1]);
    }
    return matches;
  }
};
RegisterClass("FlowGraphConsoleLogBlock", FlowGraphConsoleLogBlock);
export {
  FlowGraphConsoleLogBlock
};
//# sourceMappingURL=flowGraphConsoleLogBlock-HDAH72N6.js.map
