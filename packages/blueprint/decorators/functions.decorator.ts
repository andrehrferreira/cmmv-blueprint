export interface CFunctionOptions {
    category?: string;
    pure?: boolean
}

export function CFunction(options?: CFunctionOptions): MethodDecorator {
    return (target: any, propertyKey: string | symbol, context?: any) => {
        
    };  
}