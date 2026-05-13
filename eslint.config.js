import tsParser from "@typescript-eslint/parser";

const tokenHexClassPattern = /\b(?:bg|text|border)-\[#/;
const tokenHexClassMatch = /\b(?:bg|text|border)-\[#(?:[^\]\s]+)\](?:\/[^\s"'`}]*)?/;

const noTokenHexClassName = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow token-equivalent Tailwind hex color utilities in className.",
    },
    messages: {
      tokenHexClass:
        "Use a design token instead of token-equivalent Tailwind hex utility '{{className}}' in className.",
    },
    schema: [],
  },
  create(context) {
    function checkText(node, text) {
      if (!tokenHexClassPattern.test(text)) {
        return;
      }

      const className = text.match(tokenHexClassMatch)?.[0] ?? "hex color utility";
      context.report({
        node,
        messageId: "tokenHexClass",
        data: { className },
      });
    }

    function checkExpression(node) {
      if (!node) {
        return;
      }

      switch (node.type) {
        case "Literal":
          if (typeof node.value === "string") {
            checkText(node, node.value);
          }
          break;
        case "TemplateElement":
          checkText(node, node.value.raw);
          break;
        case "TemplateLiteral":
          for (const quasi of node.quasis) {
            checkExpression(quasi);
          }
          for (const expression of node.expressions) {
            checkExpression(expression);
          }
          break;
        case "JSXExpressionContainer":
        case "ChainExpression":
        case "TSAsExpression":
        case "TSTypeAssertion":
        case "TSNonNullExpression":
          checkExpression(node.expression);
          break;
        case "ConditionalExpression":
          checkExpression(node.test);
          checkExpression(node.consequent);
          checkExpression(node.alternate);
          break;
        case "LogicalExpression":
        case "BinaryExpression":
          checkExpression(node.left);
          checkExpression(node.right);
          break;
        case "CallExpression":
        case "NewExpression":
          for (const argument of node.arguments) {
            checkExpression(argument);
          }
          break;
        case "ArrayExpression":
          for (const element of node.elements) {
            checkExpression(element);
          }
          break;
        case "ObjectExpression":
          for (const property of node.properties) {
            checkExpression(property);
          }
          break;
        case "Property":
          checkExpression(node.key);
          checkExpression(node.value);
          break;
        case "SpreadElement":
          checkExpression(node.argument);
          break;
      }
    }

    return {
      JSXAttribute(node) {
        if (node.name?.name !== "className") {
          return;
        }

        checkExpression(node.value);
      },
    };
  },
};

export default [
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "laica-ui": {
        rules: {
          "no-token-hex-classname": noTokenHexClassName,
        },
      },
    },
    rules: {
      "laica-ui/no-token-hex-classname": "error",
    },
  },
];
