import { RuneMachine } from "@rune-ui/machine";
import {
  CollapsibleContext,
  CollapsibleEvent,
  createCollapsibleMachine,
} from "./collapsible.machine";
import { View } from "rune-ts";

export class CollapsibleStateView<T extends object = {}> extends View<T> {
  protected machine: RuneMachine<CollapsibleContext, CollapsibleEvent>;

  constructor(data: T) {
    super(data);
    this.machine = createCollapsibleMachine();
  }

  toggle() {
    this.machine.send("TOGGLE");
  }

  expand() {
    this.machine.send("EXPAND");
  }

  collapse() {
    this.machine.send("COLLAPSE");
  }

  getState() {
    return this.machine.state.context;
  }
}
