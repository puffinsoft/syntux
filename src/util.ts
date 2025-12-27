import { GeneratedContentProps } from "./GeneratedUI";
import { SyntuxComponent } from "./types";

/**
 * Converts a list of components into a dictionary for fast-retrieval
 * during rendering.
 * 
 * Components whose context is not known at runtime are automatically excluded.
 */
export function generateComponentMap(allowedComponents: (SyntuxComponent | string)[]){
    return allowedComponents.reduce((acc: Record<string, React.ComponentType<any> | string>, curr: SyntuxComponent | string) => {
        if(typeof curr === "string"){
            acc[curr] = curr;
            return acc;
        }

        acc[curr.name] = curr.component;
        return acc;
    }, {})
}

export function constructInput({
    value, components, hint
} : GeneratedContentProps){
    const allowedComponents = components?.map((item: SyntuxComponent | string) => {
        if(typeof item === "string") return item;
        return item.name;
    }).join(',') || ""

    const customComponents = components?.filter((item): item is SyntuxComponent => typeof item !== "string");
    const componentContext = customComponents?.map((item) => {
        if(!item.context){
            return  `${item.name} [props: ${item.props}]`
        } else {
            return  `${item.name} [props: ${item.props}, details: ${item.context}]`
        }
    }).join(',') || ""

    const userContext = hint;
    const inputValue = JSON.stringify(value)

    return `<AllowedComponents>${allowedComponents}</AllowedComponents>\n<ComponentContext>${componentContext}</ComponentContext>\n<UserContext>${userContext || ""}</UserContext>\n<Value>\n${inputValue}</Value>`
}