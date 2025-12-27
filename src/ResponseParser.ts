import { SchemaNode, UISchema } from "./types";

export class ResponseParser {
    buffer = "";
    schema: UISchema = {
        childrenMap: {},
        componentMap: {},
        root: null
    }

    addDelta(delta: string) {
        this.buffer += delta;
        const split = this.buffer.split("\n")
        if (split.length > 1) {
            split.slice(0, split.length - 1).forEach((line) => this.handleLine(line));
            this.buffer = split[split.length - 1];
        }
    }

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

    finish(){
        this.handleLine(this.buffer);
        this.buffer = "";
    }
}