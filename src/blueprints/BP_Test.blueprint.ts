// Generated automatically by CMMV

import { 
    $, Blueprint, 
    BeginPlay, AbstractFunction,
    Property, CFunction, CClass
} from "@cmmv/blueprint";

import {
    NodeCrypto
} from "@cmmv/nodes";

import { Convert } from "@cmmv/blueprint";

interface GenerateHashReturn {
    result: Property<undefined>,
}

@CClass("BP_Test")
export class BP_Test extends Blueprint {
    
    constructor(name?: string){
        super(name);
        this.beginPlay = new BeginPlay(this);
    }

    @CFunction({})
    public async generateHash (): Promise<GenerateHashReturn> {
        const generateHash = new AbstractFunction(this);

        generateHash.set("tmpHash", new Property<string>(""));
        const cryptNode = $.createNodeInstance<NodeCrypto>("crypto");
        generateHash.get("tmpHash")?.link(cryptNode.result, Convert.IntToString);
 
        cryptNode.next = generateHash.endNode();
        await generateHash.await();
        return { result: generateHash.get("tmpHash") };
    }

}
