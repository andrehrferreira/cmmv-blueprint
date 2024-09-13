import { Blueprint } from "./blueprint";
import { NodeGraph } from "./node";
import { Property } from "./property";

export class NodeEvent {
    private context: Blueprint;
    public exec: NodeGraph;
    public inputs: Array<Property> = new Array<Property>();

    constructor(cxt: Blueprint, args?: Array<Property>){
        this.context = cxt;
        this.inputs = args;
    }

    public start(){
        this.exec.execute(this.context);
    }

    public addInput(property: Property){
        this.inputs.push(property);
    }

    public moveInput(oldIndex: number, newIndex: number): void {
        if (oldIndex < 0 || oldIndex >= this.inputs.length || newIndex < 0 || newIndex >= this.inputs.length)
            return;

        const [movedElement] = this.inputs.splice(oldIndex, 1); 
        this.inputs.splice(newIndex, 0, movedElement); 
    }

    public updateInput(index: number, newProperty: Property): void {
        if (index < 0 || index >= this.inputs.length) 
            return;
        
        this.inputs[index] = newProperty;
    }

    public removeInput(index: number): void {
        if (index < 0 || index >= this.inputs.length) 
            return;
        
        this.inputs.splice(index, 1);  
    }
}