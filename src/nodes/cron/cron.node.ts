import { Blueprint, Property, NodeGraph } from "../../lib";
import { Node, Exec, Output, Input } from "../../decorators";

@Node("cmmv.cron", "cron")
export class NodeCron extends NodeGraph {
    @Input("int32", 1)
    public interval: Property<number>;

    @Output("int32")
    public deltaTime: Property<number>;

    @Exec()
    public handlerExec(cxt: Blueprint, $args?: any[]) {
        setInterval(() => {
            this.deltaTime.value = new Date().getTime();
            this.next?.execute(cxt, $args);
        }, this.interval.value * 1000);
    }
}
 
export default NodeCron;