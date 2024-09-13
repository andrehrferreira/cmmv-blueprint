import { Subject } from "rxjs";
import { uid } from 'uid';
import { Logger } from "@cmmv/core";

import { Blueprint } from "./blueprint";
import { Graph } from "./graph";
import { Property } from "./property";

export interface INodeGraph {
    execute(ctx: Blueprint, $args: any[]): void;
}

export class NodeGraph implements INodeGraph {
    public logger: Logger;
    
    public namespace: string;

    public id: string;

    public ctx: Blueprint;

    public root: NodeGraph | Graph;
    
    public _next: NodeGraph;

    get next(): NodeGraph {
        return this._next;
    }

    set next(newValue: NodeGraph) {
        if(newValue && newValue instanceof NodeGraph) {
            newValue.setCtx(this.ctx);  
            newValue.setRoot(this);
            newValue.onChange.subscribe((node) => this._next = node); 
            this._next = newValue;
            this.onChange.next(this);
        }      
        else {
            throw new Error(`Error when trying to configure next node ${this.namespace}::${this.id}`);
        }  
    }

    public onChange = new Subject<NodeGraph>();

    constructor(namespace: string, ctx?: Blueprint){
        if(namespace){
            const uuid = uid();
            this.id = `node-${uuid}`;
            this.namespace = namespace;
            this.ctx = ctx;        
            this.logger = new Logger(`Node::${uuid}`);                  
        }
    }

    setCtx(ctx: Blueprint): void {
        this.ctx = ctx;
    }

    setRoot(node: NodeGraph | Graph): void {
        this.root = node;
    }

    set(name: string, value: Property): void {
        this[name] = value;
    }

    get(name): Property | null {
        return this[name] && this[name] instanceof Property ? this[name] : null;
    }

    getNodeParameter<T = any>(name: string): T | undefined {
        if(this[name] && this[name] instanceof Property)
            return (this[name] as Property).value as T;
        else
            return undefined;
    }
    
    execute(ctx: Blueprint, $args?: any[]): void {
        throw new Error("Method not implemented.");
    }    
}