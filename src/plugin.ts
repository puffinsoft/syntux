module.exports = function ({ types: t }) {
    // pulls props list verbatim from file for maximum context
    function extractProps(state, params) {
      let signature = "props: ( empty )";
  
      if (params.length > 0) {
        const start = params[0].start;
        const end = params[params.length - 1].end;
        signature = `props: (${state.file.code.slice(start, end)})`;
      }
  
      return signature;
    }
  
    // create expression name.llmContext = signature
    function contextAssignment(name, signature) {
      return t.expressionStatement(
        t.assignmentExpression(
          "=",
          t.memberExpression(t.identifier(name), t.identifier("llmContext")),
          t.stringLiteral(signature)
        )
      );
    }

    // create expression name.llmName = name
    function nameAssignment(name){
      return t.expressionStatement(
        t.assignmentExpression(
          "=",
          t.memberExpression(t.identifier(name), t.identifier("llmName")),
          t.stringLiteral(name)
        )
      ); 
    }
  
    return {
      visitor: {
        /**
         * functional components.
         */
        FunctionDeclaration(path, state) {
          const { node } = path;
          if (!node.id) return;
  
          const name = node.id.name;
          if (!/^[A-Z]/.test(name)) return;
  
          const params = node.params;
          const props = extractProps(state, params);
  
          path.insertAfter([contextAssignment(name, props), nameAssignment(name)]);
        },
  
        /**
         * arrow function components.
         */
        VariableDeclarator(path, state) {
          const { node } = path;
          if (!t.isIdentifier(node.id)) return;
  
          const name = node.id.name;
          if (!/^[A-Z]/.test(name)) return;
  
          if (!t.isArrowFunctionExpression(node.init) &&
            !t.isFunctionExpression(node.init)) return;
  
          const params = node.init.params;
          const props = extractProps(state, params);
  
          path.parentPath.insertAfter([contextAssignment(name, props), nameAssignment(name)]);
        },
      },
    };
  };