// api/execute-code.js
// import ivm from 'isolated-vm';

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Only POST method is allowed' });
//   }

//   const { code } = req.body;
//   if (!code) {
//     return res.status(400).json({ error: 'Code is required' });
//   }

//   try {
//     // Create an isolate with a 128MB memory limit
//     const isolate = new ivm.Isolate({ memoryLimit: 128 });

//     // Create a context within the isolate
//     const context = await isolate.createContext();

//     // Set up a reference to the global object in the isolate's context
//     const jail = context.global;
//     await jail.set('global', jail.derefInto());

//     // Inject the code as a function that returns a result
//     const script = await isolate.compileScript(`
//       (function() {
//         return ${code};
//       })()
//     `);

//     // Run the script in the isolate's context with a timeout
//     const result = await script.run(context, { timeout: 1000 });

//     // Send the result back as JSON
//     res.status(200).json({ result });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }


// api/execute-code.js
// api/execute-code.js
import ivm from 'isolated-vm';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const isolate = new ivm.Isolate({ memoryLimit: 128 });
    const context = await isolate.createContext();

    // Initialize logs array and console in one evaluation
    await context.eval(`
      const __logs = [];
      const console = {
        log: function(...args) {
          __logs.push(args.map(String).join(' '));
        },
        error: function(...args) {
          __logs.push('Error: ' + args.map(String).join(' '));
        },
        warn: function(...args) {
          __logs.push('Warning: ' + args.map(String).join(' '));
        },
        info: function(...args) {
          __logs.push('Info: ' + args.map(String).join(' '));
        }
      };
    `);

    // Execute user code and get both result and logs
    const script = await isolate.compileScript(`
      function runCode() {
        const result = ${code};
        return JSON.stringify({
          result: result,
          logs: __logs
        });
      }
      runCode();
    `);

    const rawResult = await script.run(context, { timeout: 1000 });
    const { result, logs } = JSON.parse(rawResult);

    res.status(200).json({
      result: result,
      console: logs
    });

  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      console: []
    });
  }
}