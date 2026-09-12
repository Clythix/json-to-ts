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

function convertJson() {
  const input = document.getElementById('jsonInput').value;
  const outputEl = document.getElementById('tsOutput');
  
  try {
    const parsed = JSON.parse(input);
    outputEl.innerText = jsonToTs(parsed);
  } catch (err) {
    outputEl.innerText = `// Error: Invalid JSON syntax\n// ${err.message}`;
  }
}

function loadSample() {
  document.getElementById('jsonInput').value = JSON.stringify({
    userId: 9821,
    username: "clythix",
    permissions: ["read", "write", "execute"],
    metadata: {
      lastLogin: "2026-09-12",
      verified: true
    }
  }, null, 2);
  convertJson();
}

function copyOutput() {
  const text = document.getElementById('tsOutput').innerText;
  navigator.clipboard.writeText(text);
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

convertJson();