import { JSX } from 'react';

import { createStreamableValue } from '@ai-sdk/rsc';
import { LanguageModel, streamText } from 'ai';

import { GeneratedClient, Renderer } from 'getsyntux/client';
import { AnimateOptions, ContextfulAction, ResponseParser, SyntuxComponent, UISchema, constructInput, generateComponentMap } from "getsyntux";

import spec from './spec';

export interface GeneratedContentProps {
  value: any;
  model: LanguageModel;
  components?: (SyntuxComponent | string)[];
  actions?: Record<string, ContextfulAction>;
  hint?: string;
  placeholder?: JSX.Element;
  cached?: string;
  /*
  * ^ this is a string for two reasons:
  * - it is easier to store
  * - it is parsed then mutated at runtime. This avoids unintended side effects.
  */
  onGenerate?: (arg0: string) => void;
  skeletonize?: boolean;

  onError?: (arg0: any) => void;
  errorFallback?: JSX.Element;
  animate?: AnimateOptions
}

/**
 * Section of user interface for LLM to generate.
 * @param values The values (object, primitive, or array) to be displayed.
 * @param model The LanguageModel (as provided from AI SDK) to use. Must support streaming
 * @param components List of allowed components that LLM can use.
 * @param actions Map of callbacks that can be attached to events (e.g., onClick, onMouseOver) by LLM.
 * @param hint Additional custom instructions for the LLM.
 * @param placeholder A placeholder to show while awaiting streaming (NOT during streaming)
 * @param cached Schema returned from onGenerate, used for caching UI
 * @param onGenerate Callback which accepts a string, to be passed to `cached` to reuse same UI
 * @param skeletonize Compresses value for large inputs (arrays) or untrusted input
 * @param onError Callback which accepts an error, invoked when necessary. If not provided, runtime error occurs.
 * @param errorFallback An element fallback to show if an error occurs during generation.
*/
export async function GeneratedUI(props: GeneratedContentProps) {
  const input = constructInput(props);

  const { value, model, components, placeholder, cached, onGenerate, actions, onError, errorFallback, animate } = props;

  const allowedComponents = generateComponentMap(components || []);

  // prerender if cached
  if (cached) {
    const parser = new ResponseParser();
    parser.addDelta(cached);
    parser.finish();

    const schema: UISchema = parser.schema;

    if (schema.root) {
      return <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap}
        allowedComponents={allowedComponents} global={value} local={value} actions={actions || {}} animate={animate} />
    } else {
      return <></>;
    }
  }

  const stream = createStreamableValue('');
  (async () => {
    let total = "";
    let errored = false;

    const { textStream } = await streamText({
      model,
      system: spec,
      prompt: input,
      onError: (err) => {
        stream.error(err)
        errored = true;

        if (!onError) {
          if (!errorFallback) {
            throw err;
          }
        } else {
          onError(err)
        }
      }
    })

    for await (const delta of textStream) {
      stream.update(delta);
      total += delta;
    }

    if (!errored) {
      stream.done();
    }

    if (onGenerate) onGenerate(total);
  })()

  return <GeneratedClient value={value} allowedComponents={allowedComponents} inputStream={stream.value} placeholder={placeholder} actions={actions} errorFallback={errorFallback} animate={animate} />
}