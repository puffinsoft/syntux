import { SchemaNode, UISchema } from "./types";

/**
 * Utility class for parsing UISchema from stream.
 */
export class ResponseParser {
    buffer = ""; // unflushed existing deltas w/o newline
    
    // schema assembled thus far
    schema: UISchema = {
        childrenMap: {},
        componentMap: {},
        root: null
    }

    /**
     * Update schema with latest data chunk.
     * 
     * Handles multiline input gracefully; can be used to load entire schemas from cache.
     * @param delta delta from stream.
     */
    addDelta(delta: string) {
        this.buffer += delta;
        const split = this.buffer.split("\n")
        if (split.length > 1) {
            split.slice(0, split.length - 1).forEach((line) => this.handleLine(line));
            this.buffer = split[split.length - 1];
        }
    }

    /**
     * Parses a single line (full JSON object) and updates schema.
     * Generally should not be used when streaming data.
     */
    handleLine(line: string) {
        try {
            const node: SchemaNode = JSON.parse(line);

            const { childrenMap, componentMap } = this.schema;

            componentMap[node.id] = node;
            if (node.parentId === null) {
                this.schema.root = node;
            } else {
                if (!childrenMap[node.parentId]) childrenMap[node.parentId] = []
                childrenMap[node.parentId].push(node.id)
            }
        } catch (err) { /* probably markdown or generation inconsistency */ }
    }

    /**
     * Clears the buffer and handles any remaining information within.
     */
    finish(){
        this.handleLine(this.buffer);
        this.buffer = "";
    }
}