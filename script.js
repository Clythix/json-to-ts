let currentMode = 'ts'; // 'ts' or 'zod'
let lastParsedJson = null;

function inferType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'any[]';
    return `${inferType(val[0])}[]`;
  }
  return typeof val;
}

function jsonToTs(obj, rootName = 'RootObject') {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return `type ${rootName} = ${inferType(obj)};`;
  }

  let output = `interface ${rootName} {\n`;
  for (const [key, val] of Object.entries(obj)) {
    let typeStr = '';
    if (val === null) {
      typeStr = 'any';
    } else if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
        typeStr = `${key.charAt(0).toUpperCase() + key.slice(1, -1)}[]`;
      } else {
        typeStr = `${inferType(val[0] ?? 'any')}[]`;
      }
    } else if (typeof val === 'object') {
      typeStr = key.charAt(0).toUpperCase() + key.slice(1);
    } else {
      typeStr = typeof val;
    }
    output += `  ${key}: ${typeStr};\n`;
  }
  output += `}`;

  let nested = '';
  for (const [key, val] of Object.entries(obj)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      nested += '\n\n' + jsonToTs(val, key.charAt(0).toUpperCase() + key.slice(1));
    }
  }

  return output + nested;
}

function jsonToZod(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return `z.any()`;
  }

  let output = `z.object({\n`;
  for (const [key, val] of Object.entries(obj)) {
    let zodStr = 'z.any()';
    if (val === null) {
      zodStr = 'z.nullable(z.any())';
    } else if (typeof val === 'string') {
      zodStr = 'z.string()';
    } else if (typeof val === 'number') {
      zodStr = 'z.number()';
    } else if (typeof val === 'boolean') {
      zodStr = 'z.boolean()';
    } else if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
        zodStr = `z.array(${jsonToZod(val[0])})`;
      } else {
        zodStr = `z.array(z.${typeof(val[0]) || 'any'}())`;
      }
    } else if (typeof val === 'object') {
      zodStr = jsonToZod(val);
    }
    output += `  ${key}: ${zodStr},\n`;
  }
  output += `})`;

  return output;
}

function convertJson() {
  const input = document.getElementById('jsonInput').value;
  const outputEl = document.getElementById('codeOutput');
  
  try {
    lastParsedJson = JSON.parse(input);
    renderOutput();
  } catch (err) {
    outputEl.innerText = `// Error: Invalid JSON syntax\n// ${err.message}`;
    lastParsedJson = null;
  }
}

function renderOutput() {
  const outputEl = document.getElementById('codeOutput');
  if (!lastParsedJson) return;

  if (currentMode === 'ts') {
    outputEl.innerText = jsonToTs(lastParsedJson);
  } else {
    outputEl.innerText = `import { z } from 'zod';\n\nexport const generatedSchema = ${jsonToZod(lastParsedJson)};`;
  }
}

function switchOutputMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderOutput();
}

function loadSample() {
  document.getElementById('jsonInput').value = JSON.stringify({
    userId: 9821,
    username: "clythix",
    permissions: ["read", "write", "execute"],
    metadata: {
      lastLogin: "2026-09-15",
      verified: true
    }
  }, null, 2);
  convertJson();
}

function copyOutput() {
  const text = document.getElementById('codeOutput').innerText;
  navigator.clipboard.writeText(text);
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

convertJson();
