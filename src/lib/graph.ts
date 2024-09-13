import { uid } from 'uid';
import { Logger } from '@cmmv/core';

import { Blueprint } from "./blueprint";
import { NodeGraph } from "./node";

export class Graph {
    public logger: Logger;

    public ctx: Blueprint;

    public id: string;

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
        }            
        else {
            throw new Error(`Error when trying to configure next node ${this.id}`);
        }     
    }

    constructor(ctx?: Blueprint){
        const uuid = uid();
        this.id = `graph-${uuid}`;
        this.ctx = (ctx) ? ctx : new Blueprint();
        this.logger = new Logger(`Graph::${uuid}`);
    }

    public exec($args?: any[]){
        if(process.env.NODE_ENV === "dev")
            this.logger.log(`Execute graph`);
        
        this.next.execute(this.ctx, $args);
    }

    public setCtx(ctx: Blueprint){
        this.ctx = ctx;
    }
}

export class BeginPlay extends Graph {}

export class TickGraph extends Graph {}