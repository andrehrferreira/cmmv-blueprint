import * as crypto from "node:crypto";
import { v4 as uuid } from 'uuid';

import { Blueprint, Property, NodeGraph } from "../../lib";
import { Node, Exec, Output, Input } from "../../decorators";

const metadata = Object.assign({}, require("./crypto.node.json"));

@Node("node.crypto", "crypto")
export class NodeCrypto extends NodeGraph {
    @Input("option", "hash", metadata.actions)
    public action: Property<string>;

    @Input("option", "sha256", metadata.types)
    public type: Property<string>;

    @Input("option", "hex", metadata.encodings)
    public encoding: Property<string>;

    @Input("int32", 32, null, true)
    public stringLength: Property<number>;

    @Input("options", "uuid", metadata.generateEncodingType, true)
    public encodingType: Property<"uuid" | "base64" | "buffer">;

    @Input("string")
    public value: Property<string>;

    @Input("crypto.KeyLike")
    public privateKey: Property<crypto.KeyLike>;

    @Output("string")
    public result: Property<string>;

    @Exec()
    public handlerExec(cxt: Blueprint, $args?: any[]) {
        try{
            const encoding = this.getNodeParameter<crypto.BinaryToTextEncoding>("encoding");
            const type = this.getNodeParameter<string>("type");
            const value = this.getNodeParameter<string>("value");
            const secret = this.getNodeParameter<string>("secret");
            const privateKey = this.getNodeParameter<crypto.KeyLike>("privateKey");

            switch(this.action.value){
                case "generate": 
                    const encodingType = this.getNodeParameter<"uuid" | "base64" | "string">("encodingType");

                    if(encodingType === "uuid"){
                        this.result.value = uuid();
                    }
                    else{
                        const stringLength = this.getNodeParameter<number>("stringLength");

                        if(encodingType === "base64"){
                            this.result.value = crypto.randomBytes(stringLength)
                            .toString(encodingType as BufferEncoding)
                            .replace(/\W/g, '').slice(0, stringLength);
                        }
                        else{
                            this.result.value = crypto.randomBytes(stringLength)
                            .toString(encodingType as BufferEncoding)
                            .slice(0, stringLength);
                        }
                    }
                break;
                case "hash": 
                    this.result.value = crypto.
                    createHash(type)?.
                    update(value).digest(encoding);
                break;
                case "hmac":
                    this.result.value = crypto.
                    createHmac(type, secret)?.
                    update(value).digest(encoding);
                break;
                case "sign":
                    const sign = crypto.createSign(type);
                    sign.write(value);
                    sign.end();

                    this.result.value = sign.sign(privateKey, encoding);
                break;
            }

            this.next?.execute(cxt, $args);
        }
        catch(e){
            cxt.catch(e);
        }
    }
}

@Node("node.crypto.generatekey", "rsa-generatekey")
export class NodeCryptoGenerateKey extends NodeGraph {
    @Input("option", "rsa", metadata.keyTypes)
    public type: Property<string>;

    @Input("int32", 1024, null, true)
    public modulusLength: Property<number>;

    @Input("int32", 0x10001, null, true)
    public publicExponent: Property<number>;

    @Input("string", "RSA-PSS", null, true)
    public hashAlgorithm: Property<string>;

    @Input("string", undefined, null, true)
    public mgf1HashAlgorithm: Property<string>;

    @Input("string", "pkcs1", null, true)
    public publicKeyRSAEncodingType: Property<"pkcs1" | "spki">;

    @Input("string", "pkcs1", null, true)
    public privateKeyRSAEncodingType: Property<"pkcs1" | "pkcs8">;

    @Input("string", undefined, null, true)
    public privateKeyRSACipher: Property<string>;

    @Input("string", undefined, null, true)
    public privateKeyRSAPassphrase: Property<string>;

    @Output("publicKey")
    public publicKey: Property<string>;

    @Output("privateKey")
    public privateKey: Property<string>;

    @Exec()
    public handlerExec(cxt: Blueprint, $args?: any[]) {
        try{
            const type = this.getNodeParameter<string>("type");
            const modulusLength = this.getNodeParameter<number>("modulusLength");
            const divisorLength = this.getNodeParameter<number>("divisorLength");
            const publicExponent = this.getNodeParameter<number>("publicExponent");
            const hashAlgorithm = this.getNodeParameter<string>("hashAlgorithm");
            const mgf1HashAlgorithm = this.getNodeParameter<string>("mgf1HashAlgorithm");

            //RSA
            const privateKeyRSACipher = 
                this.getNodeParameter<string>("privateKeyRSACipher");
            const privateKeyRSAPassphrase = 
                this.getNodeParameter<string>("privateKeyRSAPassphrase");

            switch(type){
                case "rsa":
                    const publicKeyRSAEncodingType = 
                        this.getNodeParameter<"pkcs1" | "spki">("publicKeyRSAEncodingType");
                    const privateKeyRSAEncodingType = 
                        this.getNodeParameter<"pkcs1" | "pkcs8">("privateKeyRSAEncodingType");
                    
                    const RSAKeys = crypto.generateKeyPairSync("rsa", {
                        modulusLength,
                        publicExponent,
                        publicKeyEncoding: {
                            type: publicKeyRSAEncodingType,
                            format: "pem",
                        },
                        privateKeyEncoding: {
                            type: privateKeyRSAEncodingType,
                            format: 'pem',
                            cipher: privateKeyRSACipher,
                            passphrase: privateKeyRSAPassphrase
                        },
                    }); 
            
                    this.publicKey.value = RSAKeys.publicKey;
                    this.privateKey.value = RSAKeys.privateKey;
                break;
                case "rsa-pss":
                    const RSAPSSKeys = crypto.generateKeyPairSync("rsa-pss", {
                        modulusLength,
                        publicExponent,
                        hashAlgorithm,
                        mgf1HashAlgorithm,
                        publicKeyEncoding: {
                            type: "spki",
                            format: "pem",
                        },
                        privateKeyEncoding: {
                            type: "pkcs8",
                            format: 'pem',
                            cipher: privateKeyRSACipher,
                            passphrase: privateKeyRSAPassphrase
                        },
                    }); 
            
                    this.publicKey.value = RSAPSSKeys.publicKey;
                    this.privateKey.value = RSAPSSKeys.privateKey;
                break;
                case "dsa":
                    const DSAKeys = crypto.generateKeyPairSync("dsa", {
                        modulusLength,
                        divisorLength,
                        publicKeyEncoding: {
                            type: "spki",
                            format: "pem",
                        },
                        privateKeyEncoding: {
                            type: "pkcs8",
                            format: 'pem',
                            cipher: privateKeyRSACipher,
                            passphrase: privateKeyRSAPassphrase
                        },
                    }); 
            
                    this.publicKey.value = DSAKeys.publicKey;
                    this.privateKey.value = DSAKeys.privateKey;
                break;
            }

            this.next?.execute(cxt, $args);
        }
        catch(e){
            cxt.catch(e);
        }
    }
}
 
export default NodeCrypto;