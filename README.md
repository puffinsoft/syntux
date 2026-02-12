![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/banner.png)

<p align="center">
<i>syntux</i> is the generative UI library for the web.
</p>

<p align="center">
You give it a <code>value</code> and it designs the UI to display it.
</p>

---

https://github.com/user-attachments/assets/694d4646-c36d-4c19-a111-86e546484101

- ⚡ **Streamable** - display UI as you generate.
- 🎨 **Custom Components** - use your own React components.
- 💾 **Cacheable** - reuse generated UIs with new values.

**How does it work?** *syntux* generates a JSON-DSL to represent the UI, known as the React Interface Schema. The specifics are in the FAQ [below](#faq).

<h3 align="center" margin="0"><a href="https://github.com/puffinsoft/syntux/wiki">➡️ view documentation</a></h3>

---

### API

<i>syntux</i> is built for React and Next.js.

One component is all you need:

```jsx
const valueToDisplay = {
    "username": "John",
    "email": "john@gmail.com",
    "age": 22
}

<GeneratedUI
    model={anthropic('claude-sonnet-4-5')}
    value={valueToDisplay}
    hint="UI should look like..."   
/>
```

*syntux* takes the `value` into consideration and designs a UI to best display it. `value` can be anything; an object, array or primitive.

> [!TIP]
> If you are passing in a **large array** as a value, or an object with untrusted input, use the `skeletonize` property. See [the explanation](https://github.com/puffinsoft/syntux/wiki/FAQ#handling-untrusted-input--large-arrays).

### Installation

In the root of your project:

```
$ npx getsyntux@latest
```

This will automatically install the required components in the `lib/getsyntux` folder.

We use the [Vercel AI SDK](https://github.com/vercel/ai) to provide support for all LLM providers. To install the model providers:

```
$ npm i ai
$ npm i @ai-sdk/anthropic (if you're using Claude)
```

---

### Examples

#### Basic Example

Generate a simple UI with a hint:

```jsx
import { GeneratedUI } from "@/lib/getsyntux/GeneratedUI";
import { createAnthropic } from "@ai-sdk/anthropic";

/* this example uses Claude, but all models are supported! */
const anthropic = createAnthropic({ apiKey: ... })

export default function Home(){
    const valueToDisplay = { ... };
    return <GeneratedUI model={anthropic("claude-sonnet-4-5")} value={valueToDisplay} hint="UI should look like..." />
}
```

#### Caching

Cache generated UI based on a user ID:

```jsx
const cache: Map<number, string> = new Map();
export default function Home(){
    const userID = 10;
    const valueToDisplay = { ... };
    return <GeneratedUI cached={cache.get(userID)} onGenerate={(result) => {
        cache.set(userID, result)
    }} model={anthropic("claude-sonnet-4-5")} value={valueToDisplay} />
}
```

#### Custom components

Use your own components, or someone else's (a library):

```jsx
import { CustomOne, CustomTwo } from '@/my_components'
export default function Home(){
   const valueToDisplay = { ... };

   <GeneratedUI components={[
    { name: 'Button', props: "{ color: string, text: string }", component: CustomOne },
    { name: 'Input', props: "{ initial: string, disabled: boolean }", component: CustomTwo, context: "Creates an input field with an (initial) value. Can be disabled." }
   ]} />
}
```

<sup>

**Note**: the `components` array above can be generated automatically with `npx getsyntux generate-defs <component.tsx>`. See the [documentation](https://github.com/puffinsoft/syntux/wiki).

</sup>

#### Custom actions

Perform server actions, attached automatically to component events:

```jsx
import { defineTool } from "getsyntux";

export default function Home(){
   const valueToDisplay = { ... };

   <GeneratedUI actions = {{
    "delete": defineTool(async (id: string) => { "use server"; /* ... */ }, "id: string", "deletes post with id"),
    "refresh": defineTool(async () => { "use server"; /* ... */})
   }} />
}
```
<sup>

**Note**: The name of the action should specify its purpose (it is seen by the LLM). Use `defineTool` to add further context to actions. See the [documentation](https://github.com/puffinsoft/syntux/wiki).

</sup>

---

### FAQ

<details>
 <summary>How expensive is generation?</summary>

*syntux* is highly optimized to save tokens. See [here](https://github.com/puffinsoft/syntux/wiki/FAQ#how-expensive-is-this) for a cost estimation table and an explanation.
</details>

<details>
 <summary>How does generation work? (Does it generate source code?)</summary>

Generated UIs must be *secure*, *reusable* and *cacheable*.

As such, *syntux* does not generate source code. It generates a schema for the UI, known as a "React Interface Schema" (RIS). See the question below to get a better understanding.

This schema is tailored to the `value` that you provide. It is then hydrated by *syntux* and rendered.

![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/workflow.png)
</details>

<details>
 <summary>How does caching work?</summary>

 The generated UI is determined by the React Interface Schema (see the above question).

 Thus, if the same schema is provided, the same UI will be generated.

 For simplicity, the schema is simply a string. It is up to you how you wish to store it; in memory, in a file, in a database etc,.

 Use the `onGenerate` and `cached` properties to retrieve/provide a cached schema respectively.
</details>

<details>
 <summary>What about state? Can state be generated?</summary>
 
 Generating state is an anti-pattern and leads to poorly performing, insecure applications.

 If you need to handle state, wrap non-stateful components in stateful ones, then pass those as custom components to *syntux*.
</details>

<details>
 <summary>What does the React Interface Schema look like?</summary>
 
 It's a list of JSON objects, each delimited by a newline. Each object contains information about the element/component, props, and an `id` and `parentId`.

 The RIS **does not hardcode values**. It **binds** to properties of the `value` and has **built-in iterators** (with the `type` field), making it reusable and token-efficient (for arrays).

 Originally (pre-v0.2.x), the schema was a deep JSON tree. However, post-v0.2.x it was switched to a flat JSON list, as this allows for the UI to be built progressively (streamed).

 As such, the `id` and `parentId` fields are used to construct the tree as-you-go.

 Below is an example:

 ```json
 {"id":"loop_1", "parentId":"root", "type":"__ForEach__", "props":{"source":"authors"}}
{"id":"card_1", "parentId":"loop_1", "type":"div", "props":{"className":"card"}, "content": {"$bind": "$item.name"}}
 ```

 To get a better understanding, or to implement your own parser, see the [spec](https://raw.githubusercontent.com/puffinsoft/syntux/refs/heads/master/src/templates/spec.md).
</details>

---

*syntux* is open source software, licensed under the [MIT](LICENSE) license.
