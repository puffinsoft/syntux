import { JSX } from 'react';

import { createStreamableValue, StreamableValue } from '@ai-sdk/rsc';
import { LanguageModel, streamText } from 'ai';

import { AnimateOptions, constructInput, generateComponentMap, ResponseParser, SyntuxComponent, UISchema } from "getsyntux";
import { GeneratedClient, Renderer } from 'getsyntux/client';

import spec from './spec';

export interface GeneratedContentProps {
  value: any;
  model: LanguageModel;
  components?: (SyntuxComponent | string)[];
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
  
  rerender?: (arg0: string, arg1: string, arg2: string) => Promise<{ value: StreamableValue }>
}

/**
 * Section of user interface for LLM to generate.
 * @param values The values (object, primitive, or array) to be displayed.
 * @param model The LanguageModel (as provided from AI SDK) to use. Must support streaming
 * @param components List of allowed components that LLM can use.
 * @param hint Additional custom instructions for the LLM.
 * @param placeholder A placeholder to show while awaiting streaming (NOT during streaming)
 * @param cached Schema returned from onGenerate, used for caching UI
 * @param onGenerate Callback which accepts a string, to be passed to `cached` to reuse same UI
*/
export async function GeneratedUI(props: GeneratedContentProps) {
  const input = constructInput(props);
  const rerenderContext = input.split('\n').slice(0, 2);

  const { value, model, components, placeholder, cached, onGenerate, rerender } = props;
  
  const allowedComponents = generateComponentMap(components || []);

  // prerender if cached
  if(cached){
    const parser = new ResponseParser();
    parser.addDelta(cached);
    parser.finish();

    const schema: UISchema = parser.schema;

    if(schema.root){
      return <Renderer id={schema.root.id} componentMap={schema.componentMap} childrenMap={schema.childrenMap}
        allowedComponents={allowedComponents} global={value} local={value} />
    } else {
      return <></>;
    }
  }

  const stream = createStreamableValue('');

  (async () => {
    let total = "";

    const { textStream } = await streamText({
      model,
      system: spec,
      prompt: input
    })

    for await(const delta of textStream){
      stream.update(delta);
      total += delta;
    }

    stream.done();

    if(onGenerate) onGenerate(total);
  })()

  return <GeneratedClient value={value} allowedComponents={allowedComponents} inputStream={stream.value} placeholder={placeholder} rerender={{
    context: rerenderContext.join('\n'),
    action: rerender
  }} />
}