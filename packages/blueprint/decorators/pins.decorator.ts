import { NodeGraph } from "../lib/node";
import { Property } from "../lib/property";

const inputsMap = new WeakMap();
const outputsMap = new WeakMap();

export function Exec(): MethodDecorator {
    return (target: any, propertyKey: string | symbol, context?: any) => {
        if(target instanceof NodeGraph)
            target.execute = context.value;
    };
}

export function Input<T>(
    type: string, 
    defaultValue?: T, 
    options?: any[], 
    optional: boolean = false
): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        if(target instanceof NodeGraph){
            if (!inputsMap.has(target)) 
            inputsMap.set(target, []);
        
            inputsMap.get(target).push({
                propertyKey,
                type,
                defaultValue,
                options,
                optional
            });
        }
    };
}

export function Output(type: string, defaultValue?: any): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        if(target instanceof NodeGraph){
            if (!outputsMap.has(target)) 
                outputsMap.set(target, []);
            
            outputsMap.get(target).push({
                propertyKey,
                type,
                defaultValue
            });
        }
    };
}

export function applyProperties<T = NodeGraph>(target: T): any {
    const inputs = inputsMap.get(Object.getPrototypeOf(target)) || [];
    const outputs = outputsMap.get(Object.getPrototypeOf(target)) || [];
    let result = {};

    inputs.forEach(({ propertyKey, type, defaultValue, options }) => {
        switch (type) {
            case "int32":
            case "int":
            case "float":
                result[propertyKey] = new Property<number>(defaultValue as number || 0);
                break;
            case "string":
            case "str":
                result[propertyKey] = new Property<string>(defaultValue as string || "");
                break;
            case "boolean":
            case "bool":
                result[propertyKey] = new Property<boolean>(defaultValue as boolean || false);
                break;
            case "option":
                result[propertyKey] = new Property<any>(defaultValue as boolean || false, options);
                break;
            default:
                throw new Error(`Unsupported input type: ${type}`);
        }
    });

    outputs.forEach(({ propertyKey, type, defaultValue }) => {
        switch (type) {
            case "int32":
            case "int":
            case "float":
                result[propertyKey] = new Property<number>(defaultValue as number || 0);
                break;
            case "string":
            case "str":
                result[propertyKey] = new Property<string>(defaultValue as string || "");
                break;
            case "boolean":
            case "bool":
                result[propertyKey] = new Property<boolean>(defaultValue as boolean || false);
                break;
            default:
                throw new Error(`Unsupported output type: ${type}`);
        }
    });

    return result;
}