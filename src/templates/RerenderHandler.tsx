"use server";

import { createAnthropic } from "@ai-sdk/anthropic";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamText } from "ai";

import spec from "./spec";

/**
 * IMPORTANT: replace the below with your own model.
 */
const anthropic = createAnthropic({
    apiKey: "..."
})
const model = anthropic("claude-haiku-4-5");

/**
 * The server action for rerendering the UI.
 * This is an UNSECURED ENDPOINT. Please modify it to perform your own authentication etc,.
 * 
 * @param context information about allowed components, component context etc,.
 * @param existing the current UI schema.
 * @param hint the update request.
 */
export async function rerenderAction(context: string, existing: string, hint: string) {
    const stream = createStreamableValue('');
    (async () => {
        let total = "";
        let errored = false;

        const { textStream } = await streamText({
            model,
            system: spec,
            prompt: `${context}\n<Existing>${existing}</Existing>\n<UserContext>${hint}</UserContext>`,
        })

        for await (const delta of textStream) {
            stream.update(delta);
            total += delta;
        }

        if (!errored) {
            stream.done();
        }
    })()

    return { value: stream.value }
}