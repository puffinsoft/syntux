import { createContext, useContext } from "react";
import { RerenderOptions } from "src/types";

export type SyntuxContextType = {
    value: any,
    setValue: (value: any, options?: RerenderOptions) => void
}

export const SyntuxContext = createContext<SyntuxContextType | null>(null)

export function useSyntux(){
    const context = useContext(SyntuxContext);
    if(!context) throw new Error("useSyntux must be used inside a GeneratedUI.");
    return context;
}