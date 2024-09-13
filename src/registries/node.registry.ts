import { NodeGraph } from "../lib/node";

export class NodeRegistry {
    private static nodes = new Map<string, new() => NodeGraph>();

    public static registerHandler(
        target: new() => NodeGraph,
        name: string,
        alias?: string
    ) {
        Reflect.defineMetadata(
            'node_metadata',
            { name, alias },
            target,
        );

        this.nodes.set(name, target);

        if(alias)
            this.nodes.set(alias, target);
    }

    public static getNodes() : Map<string, new() => NodeGraph>{
        return this.nodes;
    }

    public static getNode(name?: string) : new() => NodeGraph | null {
        return this.nodes.has(name) ? this.nodes.get(name) : null;
    }
}