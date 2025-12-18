import { SchemaNode } from "./Renderer"

const endDelimiter = "</UISchema>"
export function parseResponse(llmResponse: string): SchemaNode[] {
    const split = llmResponse.split(/\<UISchema index="\d+">/m).slice(1).map(e => e.trim())
    const contents = split.map(e => e.slice(0, -endDelimiter.length));
    const parsed = contents.map(e => JSON.parse(e))
    return parsed
}