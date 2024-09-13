import { uid } from 'uid';
import { Logger } from "@cmmv/core";

import { Graph } from "./graph";
import { Property } from "./property";
import { AbstractFunction } from "./functions";

export class Blueprint {
    public logger: Logger;

    public name: string;

    public id: string;

    public functions: Map<string, AbstractFunction> = new Map<string, AbstractFunction>();
    public variables: Map<string, Property> = new Map<string, Property>();

    private _onConstructor: Graph;

    get onConstructor(): Graph {
        return this._onConstructor;
    }

    set onConstructor(newOnConstructor: Graph) {
        if (newOnConstructor !== this._onConstructor) {
            newOnConstructor.setCtx(this);
            this._onConstructor = newOnConstructor;
        }
    }

    private _beginPlay: Graph;

    get beginPlay(): Graph {
        return this._beginPlay;
    }

    set beginPlay(newBeginPlay: Graph) {
        if (newBeginPlay !== this._beginPlay) {
            newBeginPlay.setCtx(this);
            this._beginPlay = newBeginPlay;
        }            
    }

    private _tick: Graph;

    get tick(): Graph {
        return this._tick;
    }

    set tick(newTick: Graph) {
        if (newTick !== this._tick){
            newTick.setCtx(this);
            this._tick = newTick;
        }
    }

    constructor(name?: string){
        this.name = name;
        const uuid = uid();
        this.id = `blueprint-${uuid}`;
        this.logger = new Logger(`Blueprint::${uuid}`);
        this._onConstructor?.exec()
    }

    start(){
        this._beginPlay?.exec();

        if(this._tick)
            setTimeout(() => this._tick?.exec(), 1);
    }

    catch(e: any){
        
    }
}

export class Instance extends Graph {

}