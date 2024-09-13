import { CClass, CFunction } from "../decorators";

@CClass("convert")
export class Convert {
    @CFunction({ pure: true })
    public static IntToString(value: number) : string {
        return value.toString();
    }
}