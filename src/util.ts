import { GeneratedContentProps } from "./templates/GeneratedUI";
import { SyntuxComponent } from "./types";

/**
 * Converts a list of components into a dictionary for fast-retrieval
 * during rendering.
 */
export function generateComponentMap(allowedComponents: (SyntuxComponent | string)[]) {
    return allowedComponents.reduce((acc: Record<string, React.ComponentType<any> | string>, curr: SyntuxComponent | string) => {
        if (typeof curr === "string") {
            acc[curr] = curr;
            return acc;
        }

        acc[curr.name] = curr.component;
        return acc;
    }, {})
}

/**
 * Creates LLM input in accordance to the spec
 */
export function constructInput({
    value, skeletonize = false, components, hint
}: GeneratedContentProps) {
    const allowedComponents = components?.map((item: SyntuxComponent | string) => {
        if (typeof item === "string") return item;
        return item.name;
    }).join(',') || ""

    const customComponents = components?.filter((item): item is SyntuxComponent => typeof item !== "string");
    const componentContext = customComponents?.map((item) => {
        if (!item.context) {
            return `${item.name} [props: ${item.props}]`
        } else {
            return `${item.name} [props: ${item.props}, details: ${item.context}]`
        }
    }).join(',') || ""

    const userContext = hint;
    const inputValue = JSON.stringify(value)

    return `<AllowedComponents>${allowedComponents}</AllowedComponents>\n<ComponentContext>${componentContext}</ComponentContext>\n<UserContext>${userContext || ""}</UserContext>\n<IsSkeleton>${skeletonize.toString()}</IsSkeleton>\n<Value>\n${inputValue}</Value>`
}

/**
 * generates a skeleton of the input value, ideal for large arrays or untrusted input.
 * see the FAQ for more information: https://github.com/puffinsoft/syntux/wiki/FAQ#handling-untrusted-input--large-arrays.
 * 
 * *important*: assumes arrays are non-polymorphic
 */
export function skeletonize(input: any) {
    if (input === null) return "null";

    if (typeof input !== "object") return typeof input;

    if (Array.isArray(input)) {
        if (input.length == 0) {
            return "null"; // ignore this field completely
        } else {
            return [skeletonize(input[0])]
        }
    }
    return Object.entries(input).reduce((acc, [key, value]) => {
        acc[key] = skeletonize(value);
        return acc;
    }, {})
}