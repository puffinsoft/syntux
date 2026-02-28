import { createContext, useContext } from "react";

export type SyntuxContextType = {
    value: any,
    setValue: (arg0: any) => void
}

export const SyntuxContext = createContext<SyntuxContextType | null>(null)

export function useSyntux(){
    const context = useContext(SyntuxContext);
    if(!context) throw new Error("useSyntux must be used inside a GeneratedUI.");
    return context;
}