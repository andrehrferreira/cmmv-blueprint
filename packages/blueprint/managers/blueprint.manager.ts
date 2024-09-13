import * as path from 'path';
import * as fs from 'fs';
import * as fg from 'fast-glob';

import { Singleton, Logger } from "@cmmv/core";
import { NodeGraph } from '../lib/node';
import { applyProperties } from '../decorators/pins.decorator';

export class $ extends Singleton {
    private static logger = new Logger("BlueprintManager");

    public static nodes: Map<string, new(namespace: string) => NodeGraph> = 
        new Map<string, new(namespace: string) => NodeGraph>();

    public static nodesMetadata: Map<string, any> = 
        new Map<string, any>();

    static async load(patternFiles: string[] = []) {
        this.logger.log("Loading nodes...");

        let directoryPackages = path.resolve(
            process.env.NODE_ENV === 'prod'
                ? './node_modules/@cmmv/**/*.node.js'
                : './packages/**/*.node.ts',
        );

        let directory = path.resolve(
            process.env.NODE_ENV === 'prod'
                ? './dist/**/*.node.js'
                : './src/**/*.node.ts',
        );

        const files = await fg([directoryPackages, directory, ...patternFiles], {
            ignore: ['node_modules/**'],
        });

        for await (let filename of files) {
            if (!filename.includes('node_modules')) {
                const node: new() => NodeGraph = (await import(filename))?.default;
                const metadata: any = (fs.existsSync(filename.replace(".ts", ".json").replace(".js", ".json"))) ? 
                    JSON.parse(fs.readFileSync(filename.replace(".ts", ".json").replace(".js", ".json"), "utf-8")) : null;

                if(node && typeof node === "function"){
                    const nodeMetadata = Reflect.getMetadata("node_metadata", node);
                    const instance = new node();

                    if(instance instanceof NodeGraph && nodeMetadata.name && nodeMetadata.name !== ""){
                        if(this.nodes.has(nodeMetadata.name))
                            throw new Error(`The system cannot have 2 nodes with the same namespace: ${nodeMetadata.name}`);

                        this.nodes.set(nodeMetadata.name, node);
                        this.nodesMetadata.set(nodeMetadata.name, metadata);

                        if(nodeMetadata.alias){
                            this.nodes.set(nodeMetadata.alias, node);
                            this.nodesMetadata.set(nodeMetadata.alias, metadata);
                        }
                    }                        
                }
            }
        }
    }

    static getNode(namespace: string) : new(namespace: string) => NodeGraph | null {
        return this.nodes.has(namespace) ? this.nodes.get(namespace) : null;
    }

    static createNodeInstance<T = NodeGraph>(namespace: string) : T | null {
        if (this.nodes.has(namespace)) {
            const metadata = this.nodesMetadata.has(namespace) ? 
                this.nodesMetadata.get(namespace) : null;

            const base = this.nodes.get(namespace);
            let instance = new base(namespace) as T;

            const properties = applyProperties<T>(instance);

            if(properties){
                for(let propertyName in properties)
                    instance[propertyName] = properties[propertyName];
            }  

            if(metadata)
                instance = Object.assign(instance, metadata);

            return instance;
        } 
        else null;
    }
}