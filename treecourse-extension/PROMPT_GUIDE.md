# AI Response Format Guide for Treecourse

This guide shows how to format AI responses so the Treecourse VS Code extension can automatically parse and apply changes.

## Basic Structure

### 1. File Creation/Update (XML Tags)

```xml
<file path="relative/path/to/file.extension">
// Complete file content goes here
class Example {
  void main() {
    print("Hello World");
  }
}
</file>
```

### 2. File Deletion

```xml
<delete path="relative/path/to/file.extension" />
```

### 3. File Rename

```xml
<rename from="old/path/file.ts" to="new/path/file.ts" />
```

### 4. Specific Line Modifications

```xml
<modify path="relative/path/to/file.dart" line="42">
  static const String newUrl = "https://api.example.com";
</modify>
```

### 5. Shell Commands

```xml
<shell>
npm install package-name
</shell>
```

### 6. Code Blocks with Path Annotation

```dart:path/to/file.dart
class MyWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
```

## Complete Example Response

```markdown
## File: `lib/core/constants/api_constants.dart`

<file path="lib/core/constants/api_constants.dart">
import "package:flutter/foundation.dart";

@immutable
class ApiConstants {
  const ApiConstants._();

  static const String baseUrl = String.fromEnvironment(
    "BASE_URL",
    defaultValue: "http://192.168.1.7:8080",
  );

  static const String apiVersion = "/api/v1";
  static const String loginEndpoint = "/api/auth/login";
  static const String registerEndpoint = "/api/auth/register";

  static String buildUrl(String endpoint) => "$baseUrl$endpoint";
}
</file>
```

## Prompt Template for AI

Use this prompt when requesting code:

```
Please provide code changes using this format:

1. For file creation/updates:
   <file path="path/to/file.ext">
   [complete file content]
   </file>

2. For deletion:
   <delete path="path/to/file.ext" />

3. For renaming:
   <rename from="old/path" to="new/path" />

4. For line changes:
   <modify path="path/to/file.ext" line="LINE_NUMBER">
   [new line content]
   </modify>

5. For shell commands:
   <shell>
   [command]
   </shell>
```

## How It Works

1. Copy AI response to clipboard
2. Press `Ctrl+Shift+V` in VS Code
3. Review parsed changes in queue
4. Accept or reject each change

## Tips

- Use paths relative to project root
- Include complete file content
- Line numbers are 1-indexed
- Group related changes together

For more info, see README.md
