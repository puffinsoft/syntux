![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/banner.png)

<p align="center">
<i>syntux</i> lets you build <b>personalized</b> generative UIs that are <i>secure</i> and <i>declarative</i>.
</p>

---

**Why generative UIs?** Modern user interfaces are static, one-size-fits-all solutions. With generative UIs, you can create interfaces tailored to individual users.

---
How it works:

![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/diagram_code.png)
<br/><br/>
`values` can be anything:

![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/diagram_ui.png)


<h3 align="center" margin="0"><a href="https://github.com/puffinsoft/syntux/wiki">➡️ view documentation</a></h3>


Features:

- 💾 **Cacheable** - generated interfaces <b>can be reused</b> (*) with different values.
- 🎨 **Consistency** - use and restrict custom components for reusability and consistent aesthetics.
- 🔒 **Secure by default** - uses built-in component mapping engine. No `dangerouslySetInnerHTML`.
- 🌐 **Server-sided** - for full SEO support and stronger first load performance.

<sup>* assuming same object structure (type). arrays are fully supported!</sup>

---

### Examples

Personalized analytics dashboard on Next.js:

```jsx
import { GeneratedPage, GeneratedContent } from 'getsyntux';

const interest = "marketing";
const statistics = [{ ... }, { ... }, { ... }];

<GeneratedPage context={`Analytics dashboard. User interest: ${interest}`} schema={
    <div>
        <Navbar />
        <GeneratedContent
            value={statistics}
            allowedComponents={[ BarChart, LineChart, Histogram ]}
            hint="show charts related to user interest first"
        />
        <Footer />
    </div>
} />
```
<sup><i>syntux</i> is tested for Next.js, but should support all React frameworks.</sup>

<h3 align="center" margin="0"><a href="https://github.com/puffinsoft/syntux/wiki">➡️ view documentation</a></h3>

### Installation

We use the [Vercel AI SDK](https://github.com/vercel/ai) to provide support for all LLM providers.

First, install via npm:
```
npm i ai
npm i getsyntux
```

That's not it though! See the [wiki](https://github.com/puffinsoft/syntux/wiki) on how to set it up. It takes less than 5 minutes.

---

### FAQ

**How does generation work?**

![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/workflow.png)

---

 Generated designs are designed to be *reusable* and *cacheable*.

 To do this, *syntux* generates a "React Interface Schema" (RIS). It's essentially an Abstract Syntax Tree tailored to the `value` that you pass in. This schema is then hydrated by *syntux* and rendered.

 The RIS has built-in support for arrays, and thus can handle inputs of arbitrary lengths, making it cacheable. To get a better understanding, see the [LLM prompt itself](src/prompt.md).

\-

<details>
 <summary>How does <i>syntux</i> understand how to use components?</summary>
 
👀 **tl:dr**: *syntux* is not designed to understand your codebase. It is only designed to know ***how to use*** your codebase.

**The LLM never sees your source code.** The result? Better privacy, lower LLM costs, faster generation time.

---

To do this, *syntux* automatically generates documentation (known as *llmContext*) for your components at compilation time.

We use Babel to scan your code and attach *llmContext* to components (automatically). Additionally, for best results, developers should provide *user context* to reinforce LLM understanding.

For instance:

```js
const Profile = ({ username, imageURL }: { username: string, imageURL: string }) => { /* ... */ }
console.log(Profile.llmContext) // "props: ({ username, imageURL }: { username: string, imageURL: string })"
console.log(Profile.llmName) // "Profile"

Profile.userContext = "Displays a small user profile"; // add further context
```

> **Note**: The name of your components and props matter! 
>
> That information is directly sent to the LLM for context on how to incorporate it into the UI.

</details>

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