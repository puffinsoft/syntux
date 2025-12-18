import { ComponentType } from 'react'
import { SyntuxComponent } from './types';

export interface GeneratedContentProps {
    values: any;
    components?: (SyntuxComponent<any> | string)[];
    hint?: string;
}

/**
 * Section of user interface for LLM to generate.
 * @param values The values (object, primitive, or array) to be displayed.
 * @param components List of allowed components that LLM can use.
 * @param hint Additional custom instructions for the LLM.
 */
export function GeneratedContent(props: GeneratedContentProps) {
  /**
   * This is an empty component.
   * It acts as a declarative slot that <GeneratedPage> recognizes
   * and replaces with a Renderer during hydration.
   */
  return <></>;
}
export const SIGNATURE = Symbol('GeneratedContent');
GeneratedContent.identifier = SIGNATURE;