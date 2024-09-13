import { 
    Node, Input, Exec,
    Blueprint, Property, NodeGraph 
} from "@cmmv/blueprint"; 

@Node("cmmv.console", "console")
export class NodeConsole extends NodeGraph {
    @Input("string")
    public message: Property<string>;

    @Exec()
    public handlerExec(cxt: Blueprint, $args?: any[]) {
        let message = this.getNodeParameter<string>("message");
        console.log(message);
    }
}

export default NodeConsole;