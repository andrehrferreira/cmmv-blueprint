import * as fs from 'fs';
import * as path from 'path';
import * as fg from 'fast-glob';

import { 
    BlueprintMetadata, 
    BlueprintTranspile 
} from "../transpilers";

export class BlueprintCompile {
    public static async start(){
        const files = await fg([            
            './src/blueprints/**/*.blueprint.json', 
            './dist/blueprints/**/*.blueprint.json', 
            './src/blueprints/*.blueprint.json',
            './dist/blueprints/*.blueprint.json'
        ], {
            ignore: ['node_modules/**'],
            cwd: process.cwd()
        });
    
        for await (let filename of files) {
            const blueprintMetadata: BlueprintMetadata = require(path.resolve(filename));
            const transpiledCode = await BlueprintTranspile.transpileBlueprint(blueprintMetadata);
            const outputFilename = filename.replace('.blueprint.json', '.blueprint.ts');
            fs.writeFileSync(outputFilename, transpiledCode);
            console.log(`Generated ${outputFilename}`);
        }
    }
}