"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const parser_1 = require("../src/parser");
suite('Parser Tests', () => {
    test('Should parse single file with backticks', () => {
        const response = `## File: \`lib/core/constants/api_constants.dart\`

\`\`\`dart
import 'package:flutter/foundation.dart';

class ApiConstants {
  const ApiConstants._();
}
\`\`\``;
        const changes = (0, parser_1.parseAIResponse)(response);
        assert.strictEqual(changes.length, 1);
        assert.strictEqual(changes[0].filePath, 'lib/core/constants/api_constants.dart');
        assert.strictEqual(changes[0].language, 'dart');
        assert.ok(changes[0].content.includes('class ApiConstants'));
    });
    test('Should parse multiple files', () => {
        const response = `## File: \`src/file1.ts\`

\`\`\`typescript
export const a = 1;
\`\`\`

## File: \`src/file2.ts\`

\`\`\`typescript
export const b = 2;
\`\`\``;
        const changes = (0, parser_1.parseAIResponse)(response);
        assert.strictEqual(changes.length, 2);
        assert.strictEqual(changes[0].filePath, 'src/file1.ts');
        assert.strictEqual(changes[1].filePath, 'src/file2.ts');
    });
    test('Should parse file without backticks in path', () => {
        const response = `## File: src/simple.js

\`\`\`javascript
console.log('hello');
\`\`\``;
        const changes = (0, parser_1.parseAIResponse)(response);
        assert.strictEqual(changes.length, 1);
        assert.strictEqual(changes[0].filePath, 'src/simple.js');
    });
    test('Should return empty array for invalid input', () => {
        const response = 'This is just plain text';
        const changes = (0, parser_1.parseAIResponse)(response);
        assert.strictEqual(changes.length, 0);
    });
});
//# sourceMappingURL=parser.test.js.map