![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/banner.png)

<p align="center">
<i>syntux</i> is the generative UI library for the web. It lets you build generative UIs that are <b><i>consistent</i></b> and <b><i>flexible</i></b>.
</p>

---

https://github.com/user-attachments/assets/f968d2c3-3b1e-4fc8-8e72-628f4361359b

- ⚡ **Streamable** - display UI as you generate.
- 🎨 **Custom Components** - maintain aesthetics and reusability.
- 💾 **Cacheable** - reuse generated UIs with new values.

⚠️ this library is still in **beta**. All npm versions are **stable**, but the API may change across versions.

<h3 align="center" margin="0"><a href="https://github.com/puffinsoft/syntux/wiki">➡️ view documentation</a></h3>

---

### Examples

Generate a UI based on `valueToDisplay` (can be anything, including arrays):

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

Cache generated UI for different `value`s based on a user ID:

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

<sup>Note: <i>syntux</i> is built for Next.js. It likely works on other React frameworks, but isn't guaranteed.</sup>

---

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

### FAQ

**How does generation work?**

![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/workflow.png)


 Generated designs are designed to be *reusable* and *cacheable*.

 To do this, *syntux* generates a "React Interface Schema" (RIS). It's essentially an Abstract Syntax Tree tailored to the `value` that you pass in. This schema is then hydrated by *syntux* and rendered.

 The RIS has built-in support for arrays, and thus can handle inputs of arbitrary lengths, making it cacheable. To get a better understanding, see the [LLM prompt itself](src/templates/spec.md).

\-

<details>
 <summary>What about state? Can state be generated?</summary>
 
 Non-stateful components should be wrapped in stateful components, then passed to *syntux* to generate.

 Dynamic state generation violates the semi-deterministic paradigm of <i>syntux</i>, and is thus not supported by design.
</details>

<details>
 <summary>How do generated components share information?</summary>

  Use contexts.

 ```jsx
 <GeneratedPage schema={
    <Context.Provider>
        <GeneratedContent components={[ MyComponent ]} />
    </Context.Provider>
} />
```
</details>

---

*syntux* is open source software, licensed under the [MIT](LICENSE) license.
