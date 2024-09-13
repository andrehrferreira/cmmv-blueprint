import * as fs from 'fs';
import * as path from 'path';
import * as fg from 'fast-glob';

import { Application, Config, ITranspile, Logger, Module } from '@cmmv/core';

export interface ImportMetadata {
    module?: string;
    deconstructor?: boolean;
}

export interface BlueprintMetadata {
    name: string;
    extends?: string;
    imports?: { [key: string]: string | ImportMetadata };
    beginplay?: { next: string };
    functions?: Array<FunctionMetadata>;
}

export interface FunctionMetadata {
    name: string;
    next: string;
    localVariables: Array<LocalVariable>;
    graph: Array<GraphNode>;
    outputs: Array<FunctionOutput> | FunctionOutput;
}

export interface FunctionOutput {
    name: string;
    type: string;
    node?: string;
    property: string;
}

export interface LocalVariable {
    name: string;
    type: string;
    defaultValue?: any;
}

export interface GraphNode {
    name: string;
    node: string;
    next?: string;
    link?: Array<LinkMetadata>;
}

export interface LinkMetadata {
    node: string;
    property: string;
    nodeTo: string;
    to: string;
    fn?: string;
}

export class BlueprintTranspile implements ITranspile {
    private logger: Logger = new Logger('BlueprintTranspile');

    run(): void {}

    static async transpileBlueprint(json: BlueprintMetadata) {
        const { name, imports, beginplay, functions } = json;
    
        if(!json.extends)
            json.extends = "Blueprint";
    
        let result = '// Generated automatically by CMMV\n\n';
    
        result += 'import { \n';
        result += `    $, Blueprint, 
    BeginPlay, AbstractFunction,
    Property, CFunction, CClass
} from "@cmmv/blueprint";\n\n`;
        
        const allNodes = new Set<string>();
        let nodesImports = "";
    
        functions?.forEach(func => {
            func.graph.forEach(graph => {
                allNodes.add(graph.node);
            });
        });

        allNodes.forEach(node => {
            nodesImports += `    Node${BlueprintTranspile.capitalizeFirstLetter(node)},\n`;
        });
    
        result += `import {\n${nodesImports.slice(0, nodesImports.length -2)}\n} from "@cmmv/nodes";\n\n`;
    
        Object.keys(imports).forEach(key => {
            if(typeof imports[key] === "string")
                result += `import * as ${key} from "${imports[key]}";\n`;
            else if(typeof imports[key] === "object") {
                const module = (imports[key] as ImportMetadata).module || "@cmmv/blueprint";
                const deconstructor = (imports[key] as ImportMetadata).deconstructor || false;
            
                if(deconstructor)
                    result += `import { ${key} } from "${module}";\n\n`;
                else
                    result += `import * as ${key} from "${module}";\n\n`;
            }
        });
    
        functions?.forEach(func => {
            if (func.outputs && Array.isArray(func.outputs)) {
                result += `interface ${BlueprintTranspile.capitalizeFirstLetter(func.name)}Return {\n`;
    
                func.outputs.forEach(output => {
                    result += `    ${output.name}: Property<${output.type}>,\n`;
                });
    
                result += `}\n`;
            }
        });
    
        result += '\n';
        result += `@CClass("${name}")\n`;
        result += `export class ${name} extends ${json.extends} {
    
    ${json.extends === "Blueprint" ? `constructor(name?: string){
        super(name);
        this.beginPlay = new BeginPlay(this);
    }\n\n`: ''}`;
    
        let lastNode;
    
        functions?.forEach(func => {
            result += `    @CFunction({})\n`;
            result += `    public async ${func.name} (): Promise<${func.outputs && Array.isArray(func.outputs) ? BlueprintTranspile.capitalizeFirstLetter(func.name) + 'Return' : 'void'}> {\n`;        
            result += `        const ${func.name} = new AbstractFunction(this);\n\n`;
    
            func.localVariables.forEach((variable) => {
                result += `        ${func.name}.set("${variable.name}", new Property<${variable.type}>(${(variable.type !== "string") ? variable.defaultValue : `"${variable.defaultValue}"`}));\n`;
            })
    
            func.graph.forEach(graphNode => {
                const nodeVar = `${graphNode.name}`;
                result += `        const ${nodeVar} = $.createNodeInstance<Node${BlueprintTranspile.capitalizeFirstLetter(graphNode.node)}>("${graphNode.node}");\n`;
                lastNode = nodeVar;
    
                if (graphNode.next) {
                    result += `        ${func.name}.next = ${nodeVar};\n`;
                }
    
                if (graphNode.link) {
                    graphNode.link.forEach(link => {
                        result += `        ${link.node}.get("${link.property}")?.link(${link.nodeTo}.${link.to}`;
                        if (link.fn) {
                            result += `, ${link.fn}`;
                        }
                        result += `);\n`;
                    });
                }
    
                result += ` \n`;
            });
    
            result += `        ${lastNode}.next = ${func.name}.endNode();\n`;
            result += `        await ${func.name}.await();\n`;
    
            if(func.outputs && Array.isArray(func.outputs)) {
                let outputs = [];
    
                func.outputs.forEach(output => {
                    outputs.push(`${output.name}: ${output.node}.get("${output.property}")`);
                });
    
                result += `        return { ${outputs.join(", ")} };\n`;
            }
            else{
                result += `        return;`;
            }
            
            result += `    }\n\n`;
        });
    
        result += '}\n';
    
        return result;
    }

    static capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
