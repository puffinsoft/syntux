export type SyntuxComponent<P = any> = React.ComponentType<P> & {
    userContext?: string;
    llmContext?: string;
    llmName?: string;
    identifier?: Symbol;
}

export type SyntuxElement<P = any> = React.ReactElement<P, SyntuxComponent<P>>;