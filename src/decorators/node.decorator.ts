import { NodeRegistry } from "../registries/node.registry";

export function Node(namespace: string, alias?: string): ClassDecorator {
    return (target: any) => {
        NodeRegistry.registerHandler(target, namespace, alias);
    };
}