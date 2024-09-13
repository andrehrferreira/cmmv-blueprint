import * as fs from 'fs';
import * as path from 'path';
import * as fg from 'fast-glob';

interface ImportMetadata {
    module?: string;
    deconstructor?: boolean;
}

interface BlueprintMetadata {
    name: string;
    extends?: string;
    imports?: { [key: string]: string | ImportMetadata };
    beginplay?: { next: string };
    functions?: Array<FunctionMetadata>;
}

interface FunctionMetadata {
    name: string;
    next: string;
    localVariables: Array<LocalVariable>;
    graph: Array<GraphNode>;
    outputs: Array<FunctionOutput> | FunctionOutput;
}

interface FunctionOutput {
    name: string;
    type: string;
    node?: string;
    property: string;
}

interface LocalVariable {
    name: string;
    type: string;
    defaultValue?: any;
}

interface GraphNode {
    name: string;
    node: string;
    next?: string;
    link?: Array<LinkMetadata>;
}

interface LinkMetadata {
    node: string;
    property: string;
    nodeTo: string;
    to: string;
    fn?: string;
}

async function transpileBlueprint(json: BlueprintMetadata) {
    const { name, imports, beginplay, functions } = json;

    if(!json.extends)
        json.extends = "Blueprint";

    let result = '// Generated automatically by CMMV\n\n';

    result += 'import { \n';
    result += `    $, Blueprint, 
    BeginPlay, AbstractFunction,
    Property, CFunction, CClass`;
    
    const allNodes = new Set<string>();

    functions?.forEach(func => {
        func.graph.forEach(graph => {
            allNodes.add(graph.node);
        });
    });

    allNodes.forEach(node => {
        result += `,\n    Node${capitalizeFirstLetter(node)}`;
    });

    result += `\n} from "@cmmv/blueprint";\n\n`;

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
            result += `interface ${capitalizeFirstLetter(func.name)}Return {\n`;

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
        result += `    public async ${func.name} (): Promise<${func.outputs && Array.isArray(func.outputs) ? capitalizeFirstLetter(func.name) + 'Return' : 'void'}> {\n`;        
        result += `        const ${func.name} = new AbstractFunction(this);\n\n`;

        func.localVariables.forEach((variable) => {
            result += `        ${func.name}.set("${variable.name}", new Property<${variable.type}>(${(variable.type !== "string") ? variable.defaultValue : `"${variable.defaultValue}"`}));\n`;
        })

        func.graph.forEach(graphNode => {
            const nodeVar = `${graphNode.name}`;
            result += `        const ${nodeVar} = $.createNodeInstance<Node${capitalizeFirstLetter(graphNode.node)}>("${graphNode.node}");\n`;
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

function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

(async _ => {
    const files = await fg([
        './src/blueprints/**/*.blueprint.json', 
        './src/blueprints/*.blueprint.json'
    ], {
        ignore: ['node_modules/**'],
        cwd: process.cwd()
    });

    for await (let filename of files) {
        const blueprintMetadata: BlueprintMetadata = require(path.resolve(filename));
        const transpiledCode = await transpileBlueprint(blueprintMetadata);

        // Write the transpiled TypeScript to a file
        const outputFilename = filename.replace('.blueprint.json', '.generated.ts');
        fs.writeFileSync(outputFilename, transpiledCode);
        console.log(`Generated ${outputFilename}`);
    }
})();
