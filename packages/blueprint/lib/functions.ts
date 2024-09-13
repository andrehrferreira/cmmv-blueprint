import { Subject } from "rxjs";

import { Graph } from "./graph";
import { Property } from "./property";
import { NodeGraph } from "./node";
import { Blueprint } from "./blueprint";

export class AbstractFunction extends Graph {
    private localVariables: Map<string, Property> = new Map<string, Property>();
    protected result: Subject<AbstractFunction> = new Subject<AbstractFunction>();
    
    set(name: string, value: Property){
        this.localVariables.set(name, value);
    }

    get(name){
        return this.localVariables.has(name) ? this.localVariables.get(name) : null;
    }

    public end($args?: any[]): void {
        this.result.next(this);
    }

    public endNode($args?: any[]): NodeGraph {
        const self = this;
        const nodeGraph = new NodeGraph(this.id, this.ctx);

        nodeGraph.execute = () => {
            self.result.next(self);
        };
        
        return nodeGraph;
    }

    public await($args?: any[]): Promise<any> {
        return new Promise((result) => {  
            this.result.subscribe((context) => result(context));
        });
    }
}