import { GeneratedContentProps } from "./templates/GeneratedUI";
import { ContextfulAction, SyntuxComponent } from "./types";

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
    value, skeletonize = false, components, hint, actions
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

    let availableActions = "";
    if(actions){
        availableActions = "\n" + Object.keys(actions).map((key: string) => {
            const action: ContextfulAction = actions[key];
            return `- ${key}(${action.params}): ${action.context}`
        }).join('\n') + "\n"
    }

    const inputValue = JSON.stringify(skeletonize ? createSkeleton(value) : value)

    return `<AllowedComponents>${allowedComponents}</AllowedComponents>\n<ComponentContext>${componentContext}</ComponentContext>\n<UserContext>${userContext || ""}</UserContext>\n<AvailableActions>${availableActions}</AvailableActions>\n<IsSkeleton>${skeletonize.toString()}</IsSkeleton>\n<Value>\n${inputValue}\n</Value>`
}

/**
 * generates a skeleton of the input value, ideal for large arrays or untrusted input.
 * see the FAQ for more information: https://github.com/puffinsoft/syntux/wiki/FAQ#handling-untrusted-input--large-arrays.
 * 
 * *important*: assumes arrays are non-polymorphic
 */
export function createSkeleton(input: any) {
    if (input === null) return "null";

    if (typeof input !== "object") return typeof input;

    if (Array.isArray(input)) {
        if (input.length == 0) {
            return "null"; // ignore this field completely
        } else {
            return [createSkeleton(input[0])]
        }
    }
    return Object.entries(input).reduce((acc, [key, value]) => {
        acc[key] = createSkeleton(value);
        return acc;
    }, {})
}

/**
 * attaches metadata to callback to allow LLM understanding
 * @param fn the action to be binded to an event on the UI
 * @param params the parameters the function accepts, in Typescript format (e.g., "id: number, name: string")
 * @param context a description of what the function does, for better LLM context
 */
export function defineTool(fn: Function, params?: string, context?: string): ContextfulAction {
    return {
        fn, 
        params: params || "",
        context: context || "no context provided"
    }
}