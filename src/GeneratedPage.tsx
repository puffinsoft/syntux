import { isValidElement } from 'react';
import { GeneratedContentProps, SIGNATURE } from "./GeneratedContent";
import { Renderer, SchemaNode } from "./Renderer";
import { SyntuxComponent, SyntuxElement } from "./types";
import { parseResponse } from "./util";
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from "ai";
import systemPrompt from './prompt.md';

export interface GeneratedPageProps {
    context?: string;
    schema: SyntuxElement;
}

function extractChildren(element: any) {
    if (element?.props?.children) {
        let children = element.props.children;
        if (!Array.isArray(children)) children = [children];
        return children;
    }
    return [];
}

function searchChildren(element: any, acc: ContentSchema[]) {
    const children = extractChildren(element);

    children.forEach((element: SyntuxElement, index: number) => {
        if (element?.type.identifier === SIGNATURE) {
            const { values, components, hint } = element.props as GeneratedContentProps;
            const realComponents: any = []

            if (components) {
                components.forEach((comp: string | SyntuxComponent) => {
                    if (typeof comp === "string") {
                        realComponents.push({
                            llmName: comp
                        })
                    } else {
                        realComponents.push({
                            llmName: comp.llmName,
                            llmContext: comp.llmContext,
                            userContext: comp.userContext
                        })
                    }
                })
            }
            acc.push({
                values, components: realComponents, hint: hint || ""
            })
        } else {
            searchChildren(element, acc)
        }
    })
}

function generateInput(content: ContentSchema[], context?: string) {
    let str = '';
    if (context) {
        str = `<PageContext>${context}</PageContext>\n`;
    }

    content.forEach(schema => {
        const allowedComponents = schema.components.map(e => e.llmName);
        const componentContext: any = []
        schema.components.forEach(comp => {
            if (comp.llmContext) {
                let contextStr;
                if (comp.userContext) {
                    contextStr = `${comp.llmName} [${comp.llmContext}, details: ${comp.userContext}]`
                } else {
                    contextStr = `${comp.llmName} [${comp.llmContext}]`;
                }
                componentContext.push(contextStr)
            }
        })
        const userContext = schema.hint;
        const value = JSON.stringify(schema.values);

        str += `<GeneratedContent>
    <AllowedComponents>${allowedComponents.join(',')}</AllowedComponents>
    <ComponentContext>${componentContext.join(',')}</ComponentContext>
    <UserContext>${userContext}</UserContext>
    <Value>${value}</Value>
</GeneratedContent>\n`
    })

    return str;
}

function createComponentRegistry(components: (SyntuxComponent<any> | string)[] | undefined) {
    if (!components) return {};
    return components.reduce((acc: Record<string, SyntuxComponent<any> | string>, curr: SyntuxComponent<any> | string) => {
        if (typeof curr === "string") {
            acc[curr] = curr;
        } else {
            if (curr.llmName) {
                acc[curr.llmName] = curr;
            }
        }
        return acc;
    }, {})
}

function hydrate(schema: SyntuxElement, dsl: (SchemaNode | string)[]) {
    let componentIndex = 0;
    function swapChildren(element: SyntuxElement) {
        const children = extractChildren(element);

        return children.map((child: SyntuxElement) => {
            if (!isValidElement(child)) return child;

            if (child.type.identifier === SIGNATURE) {
                const { values, components, hint } = child.props as GeneratedContentProps;
                return <Renderer schema={dsl[componentIndex++]} global={values} local={values} components={createComponentRegistry(components)} />
            }

            return swapChildren(child);
        })
    }

    return swapChildren(schema);
}

interface ContentSchema {
    values: any;
    components: { llmContext?: string, userContext?: string, llmName: string }[];
    hint: string;
}

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
})

export async function GeneratedPage({
    context, schema
}: GeneratedPageProps) {
    const contents: ContentSchema[] = [];
    searchChildren(schema, contents);
    const llmInput = generateInput(contents, context);

    const { text: llmResponse } = await generateText({
        model: anthropic("claude-sonnet-4-5"),
        system: systemPrompt,
        prompt: llmInput
    })
    const parsedResponse = parseResponse(llmResponse)
    return <>{hydrate(schema, parsedResponse)}</>
}
