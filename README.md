![](https://raw.githubusercontent.com/puffinsoft/syntux/HEAD/docs/images/banner.png)

<p align="center">
<i>syntux</i> is the generative UI library for the web.
</p>

<p align="center">
You give it a <code>value</code> and it designs the UI to display it.
</p>

---

https://github.com/user-attachments/assets/6c94f914-6217-45d9-ad17-0c2b568d1b4b

### Features

- ⚡ **Streamable** - display UI as you generate.
- 🎨 **Custom Components** - use your own React components.
- 💾 **Cacheable** - reuse generated UIs with new values.
- 🔄 **Reactive** - update the UI programmatically.

**How does it work?** *syntux* generates a JSON-DSL to represent the UI, known as the React Interface Schema. The specifics are in the FAQ [below](#faq).

<h3 align="center" margin="0"><a href="https://docs.getsyntux.com/">➡️ view documentation</a></h3>

---

### API

<i>syntux</i> is built for React, supporting Next.js, React Router / Remix and Astro.

One component is all you need:

```jsx
const valueToDisplay = {
    "username": "John",
    "email": "john@gmail.com",
    "age": 22
}

<GeneratedUI
    endpoint="/api/syntux"
    value={valueToDisplay}
    hint="UI should look like..."   
/>
```

*syntux* reads the `value` and designs the UI to best display it, taking the `hint` into consideration.

> [!TIP]
> If you are passing in a **large array** as a value, use the `skeletonize` property. See [the explanation](https://docs.getsyntux.com/usage/advanced#skeletonize-property).

---

### Examples

The following examples are meant to give you an idea of how *syntux* works.

See [wiki: Installation](https://docs.getsyntux.com/installation) once you're ready to begin.

#### Basic Example

Generate a simple UI with a hint:

```jsx
import { GeneratedUI } from 'getsyntux/client';

export default function Page() {
  const value = { username: 'John', email: 'john@gmail.com', age: 22 };

  return (
    <GeneratedUI
      endpoint="/api/syntux"
      value={value}
      hint="display as a profile card"
    />
  );
}
```

#### Caching

Cache generated UI based on a user ID:

```jsx
import { cache } from './api/syntux/route';

export default function Page() {
  const userId = 10;
  const value = { username: 'John', email: 'john@gmail.com', age: 22 };

  return (
    <GeneratedUI
      endpoint="/api/syntux"
      value={value}
      hint="UI should look like..."

      cached={cache.get(userId)}
    />
  );
}
```

#### Custom components

Use your own components, or someone else's (a library):

```jsx
import { GeneratedUI } from 'getsyntux/client';
import { Card, Avatar } from '@/components/ui';

export default function Page() {
  const value = { username: 'John', email: 'john@gmail.com', avatar: '/john.png' };

  return (
    <GeneratedUI
      endpoint="/api/syntux"
      value={value}
      hint="use custom components when possible"

      components={[
        {
          name: 'Card',
          props: '{ title: string, body: string }',
          component: Card,
        },
        {
          name: 'Avatar',
          props: '{ src: string, alt: string }',
          component: Avatar,
          context: 'Displays a circular profile image.', /* optional */
        },
      ]}
    />
  );
}
```

<sup>

**Note**: the `components` array above can be generated automatically with `npx @getsyntux/cli generate-defs <component.tsx>`. See the [documentation](https://docs.getsyntux.com/api#generate-defs).

</sup>

Make sure components are marked with `"use client"`.

#### Reactivity

To regenerate the UI dynamically, in response to user action, create a separate endpoint:

```jsx
<GeneratedUI
  endpoint="/api/syntux"
  rerenderEndpoint="/api/syntux/rerender" /* <-- over here */

  value={value}
  hint="display as a profile card"
/>
```

Then use the `useSyntux` hook:

```jsx
"use client";

export default function CustomComponent() {
  const { value, setValue } = useSyntux();

  return (
    <button
      onClick={() => {
        setValue(value, {
            regenerate: true, // if false, treated as static
            hint: "Change the style to be more..."
        })
      }}
    >
      Update UI!
    </button>
  );
}
```
<h3 align="center" margin="0"><a href="https://docs.getsyntux.com/">➡️ view documentation</a></h3>


---

### FAQ

<details>
 <summary>How does generation work? (Does it generate source code?)</summary>

Generated interfaces must be *secure*, *reusable* and *cacheable*.

As such, syntux does not:
- generate code (HTML/JSX), or...
- hardcode the `value`

Instead, syntux generates a JSON-DSL representation of the UI, known as the React Interface Schema (RIS).

The RIS **does not hardcode values**. It **binds** to properties of the `value` and has **built-in iterators**, making it reusable and token-efficient for arrays.

An example of the RIS:

```json
{"id":"loop_1", "parentId":"root", "type":"__ForEach__", "props":{"source":"authors"}}
{"id":"card_1", "parentId":"loop_1", "type":"div", "props":{"className":"card"}, "content": {"$bind": "$item.name"}}
```

</details>

<details>
 <summary>How expensive is generation?</summary>

*syntux* is highly optimized to save tokens. See [here](https://docs.getsyntux.com/usage/advanced#cost-estimation) for a cost estimation table and an explanation.
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
