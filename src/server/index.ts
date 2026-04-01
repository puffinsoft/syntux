import { LanguageModel, streamText } from 'ai';
import { constructInput } from '../util';
export interface SyntuxHandlerOptions {
    model: LanguageModel;
    spec: string;
    onGenerate?: (schema: string) => void;
}

/**
 * HTTP handler for UI generation requests. Framework-agnostic.
 * 
 * Important: does not support rerendering. Use `createSyntuxRerenderHandler`.
 * 
 * @param model The LanguageModel (as provided from AI SDK) to use. Must support streaming.
 * @param spec The model specification to use.
 * @param onGenerate Schema generation callback, used for caching.
 */
export function createSyntuxHandler(options: SyntuxHandlerOptions) {
    return async (request: Request): Promise<Response> => {
        const { value, hint, components, skeletonize } = await request.json();
        const prompt = constructInput({ value, hint, components, skeletonize });

        return makeStreamResponse(options.model, options.spec, prompt, options.onGenerate);
    };
}

/**
 * HTTP handler for UI rerender requests. Framework-agnostic.
 *
 * @param model The LanguageModel (as provided from AI SDK) to use. Must support streaming.
 * @param spec The model specification to use.
 * @param onGenerate Schema generation callback, used for caching.
 */
export function createSyntuxRerenderHandler(options: SyntuxHandlerOptions) {
    return async (request: Request): Promise<Response> => {
        const { context, existing, hint } = await request.json();
        const prompt = `${context}\n<Existing>${existing}</Existing>\n<UserContext>${hint}</UserContext>`;
        return makeStreamResponse(options.model, options.spec, prompt, options.onGenerate);
    };
}


/**
 * utility function for creating responses using the Stream API.
 */
function makeStreamResponse(
    model: LanguageModel,
    spec: string,
    prompt: string,
    onGenerate?: (s: string) => void,
): Response {
    const result = streamText({
        model,
        system: spec,
        prompt,
        onFinish: ({ text }) => onGenerate?.(text),
    });
    return result.toTextStreamResponse();
}

