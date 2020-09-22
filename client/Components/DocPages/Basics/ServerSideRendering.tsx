import { React, CodeBlock, monokai } from '../../../../deps.ts';

const ServerSideRendering = (props: any) => {

  return (
    <div className="docContainer">
      <h1>Server-Side Rendering</h1>
      <p>In this chapter, we'll implement ObsidianWrapper, <code className="obsidianInline">obsidian</code>'s GraphQL client, in a React app built with server-side rendering.</p>
      <h2>ObsidianWrapper</h2>
      <p>Before we can discuss server-side rendering in Deno, we must first build out our client application.  Setting up ObsidianWrapper is super simple: simply wrap our app with ObsidianWrapper, and attach ObsidianRouter's <code className="obsidianInline">obsidianSchema</code> to the window object in your HTML, like so:</p>
      <p><code className="obsidianInline">window.__INITIAL_STATE__ = {"{ obsidianSchema: // obsidianSchema here }"}</code></p>
      <h3>Installation</h3>
      <p>Import React and ObsidianWrapper at your top-level component along with any child components:</p>
      <CodeBlock
        text={`// App.tsx
import React from 'https://dev.jspm.io/react@16.13.1';
import { ObsidianWrapper } from 'https://deno.land/x/obsidian@v1.0.0/mod.ts';
import MainContainer from './MainContainer.tsx';`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h3>App Setup</h3>
      <p>Wrap your main container in ObsidianWrapper.  This exposes the <code className="obsidianInline">useObsidian</code> hook, which will enable us to make GraphQL requests and access our cache from anywhere in our app.</p>
      <CodeBlock
        text={`// App.tsx
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

const App = () => {
  return (
    <ObsidianWrapper>
      <MainContainer />
    </ObsidianWrapper>
  );
};

export default App;`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <p>And let's set up our MainContainer with some static html:</p>
      <CodeBlock
        text={`// MainContainer.tsx
import React from 'https://dev.jspm.io/react@16.13.1';

const MainContainer = () => {
  return (
    <div>
      <h1>Obsidian Film Showcase</h1>
      <p>Check out our favorite movie by clicking the button below</p>
      <button>Get Movie</button>
    </div>
  );
};

export default MainContainer;`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h2>Serving Our App</h2>
      <p>Now that we've built a simple React app, let's utilize server-side rendering to send a pre-rendered version to the client.</p>
      <h3>obsidianSchema</h3>
      <p>The first step to constructing our HTML is to extract the <code className="obsidianInline">obsidianSchema</code> from our ObsidianRouter.  We can then attach it to an initialState object:</p>
      <CodeBlock
        text={`// server.tsx
interface initialState {
  obsidianSchema?: any;
}

const initialState: initialState = {
  obsidianSchema: GraphQLRouter.obsidianSchema
}`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h3>Router Setup</h3>
      <p>We can create a router for our base path like so:</p>
      <CodeBlock
        text={`// server.tsx
const router = new Router();
router.get('/', handlePage);

app.use(router.routes(), router.allowedMethods());`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h3>renderToString</h3>
      <p>At last, let's build our HTML file inside of our <code className="obsidianInline">handlePage</code> function, using ReactDomServer's <code className="obsidianInline">renderToString</code> method to insert our pre-rendered app inside the body.  We'll also send our initialState object in the head, providing ObsidianWrapper all of the tools it needs to execute caching on the client-side:</p>
      <CodeBlock
        text={`// server.tsx
import React from 'https://dev.jspm.io/react@16.13.1';
import ReactDomServer from 'https://dev.jspm.io/react-dom@16.13.1/server';
import App from './App.tsx';

function handlePage(ctx: any) {
  try {
    const body = (ReactDomServer as any).renderToString(<App />);
    ctx.response.body = \`<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Obsidian Film Showcase</title>
        <script>
          window.__INITIAL_STATE__ = \${JSON.stringify(initialState)};
        </script>
      </head>
      <body>
        <div id="root">\${body}</div>
        <script src="/static/client.tsx" defer></script>
      </body>
      </html>\`;
  } catch (error) {
    console.error(error);
  }
}`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h3>Hydration</h3>
      <p>We're almost there!  In order to reattach all of our React functionality to our prerendered app, we have to <i>hydrate</i> our root div.  First, let's create the client.tsx file that will contain the hydrate functionality:</p>
      <CodeBlock
        text={`// client.tsx
import React from 'https://dev.jspm.io/react@16.13.1';
import ReactDom from 'https://dev.jspm.io/react-dom@16.13.1';
import App from './App.tsx';

(ReactDom as any).hydrate(
  <App />,
  document.getElementById('root')
);`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <p>In the server, we'll use Deno's native bundle method to wrap up all of the React logic contained in our app, ready to be reattached to the DOM via hydration:</p>
      <CodeBlock
        text={`// server.tsx
const [_, clientJS] = await Deno.bundle('./client/client.tsx');`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <p>Once our client code is bundled, we can send it to the client via another router in our server:</p>
      <CodeBlock
        text={`// server.tsx
const hydrateRouter = new Router();

hydrateRouter.get('/static/client.js', (context) => {
  context.response.headers.set('Content-Type', 'text/html');
  context.response.body = clientJS;
});

app.use(hydrateRouter.routes(), hydrateRouter.allowedMethods());`}
        language={"tsx"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h3>Compiling</h3>
      <p>Just one more step before we're up and running: specify our compiler options with a tsconfig.json file.  To learn more about TypeScript project configuration, check out the official documentation <a href="https://www.typescriptlang.org/docs/handbook/tsconfig-json.html">here</a>.</p>
      <CodeBlock
        text={`// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react",
    "target": "es6",
    "module": "commonjs",
    "lib": [
      "DOM",
      "ES2017",
      "deno.ns"
    ],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}`}
        language={"json"}
        showLineNumbers={true}
        theme={monokai}
      />
      <br/>
      <h3>Spin Up the Server</h3>
      <p>Our command to start our server has expanded now that we're bundling our client.tsx file.  The new command to start up our server looks like this:</p>
      <p><code className="obsidianInline">deno run --allow-net --allow-read --unstable server.tsx -c tsconfig.json</code></p>
      <h4>Recap & Next Up</h4>
      <p>In this chapter we set up a simple React app and implemented ObsidianWrapper, enabling fetching and caching at a global level.  We utilized server-side rendering to send a pre-rendered version of our app to the client, along with <code className="obsidianInline">obsidianSchema</code> to enable client-side caching.  Next, we'll take a look at querying with <code className="obsidianInline">obsidian</code> and the different methods and options available.</p>
    </div>
  )
}

export default ServerSideRendering;
