import * as assert from 'assert';
import { parseAIResponse, FileChange } from '../src/parser';

suite('Parser Tests', () => {
    test('Should parse single file with backticks', () => {
        const response = `## File: \`lib/core/constants/api_constants.dart\`

\`\`\`dart
import 'package:flutter/foundation.dart';

class ApiConstants {
  const ApiConstants._();
}
\`\`\``;

        const changes = parseAIResponse(response);
        
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

        const changes = parseAIResponse(response);
        
        assert.strictEqual(changes.length, 2);
        assert.strictEqual(changes[0].filePath, 'src/file1.ts');
        assert.strictEqual(changes[1].filePath, 'src/file2.ts');
    });

    test('Should parse file without backticks in path', () => {
        const response = `## File: src/simple.js

\`\`\`javascript
console.log('hello');
\`\`\``;

        const changes = parseAIResponse(response);
        
        assert.strictEqual(changes.length, 1);
        assert.strictEqual(changes[0].filePath, 'src/simple.js');
    });

    test('Should return empty array for invalid input', () => {
        const response = 'This is just plain text';
        const changes = parseAIResponse(response);
        assert.strictEqual(changes.length, 0);
    });
});
