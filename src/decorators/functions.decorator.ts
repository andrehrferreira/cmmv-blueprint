export interface CFunctionOptions {
    category?: string;
    pure?: boolean
}

export function CFunction(options?: CFunctionOptions): MethodDecorator {
    return (target: Function, propertyKey: string | symbol, context?: any) => {
        
    };  
}