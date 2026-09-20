
// Utility to generate UUID v4
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Save item to localStorage
function saveToStorage(key, data) {
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(data);
    localStorage.setItem(key, JSON.stringify(list));
}

// Load items count
function updateCounts() {
    ['bloco', 'item', 'script', 'mob'].forEach(k => {
        let el = document.getElementById('count-' + k);
        if (el) {
            let list = JSON.parse(localStorage.getItem(k) || '[]');
            el.innerText = list.length;
        }
    });
}

document.addEventListener('DOMContentLoaded', updateCounts);

// Master .mcaddon generator
async function exportMcAddon() {
    if (typeof JSZip === 'undefined') {
        alert('JSZip não carregado! Verifique sua conexão com a internet.');
        return;
    }

    const zip = new JSZip();
    
    // UUIDs for BP and RP
    const bpUuid1 = uuidv4();
    const bpUuid2 = uuidv4();
    const rpUuid1 = uuidv4();
    const rpUuid2 = uuidv4();

    // --- BEHAVIOR PACK ---
    const bp = zip.folder("Behavior_Pack");
    
    // BP Manifest
    const bpManifest = {
        "format_version": 2,
        "header": {
            "name": "Add-on Gerado por StarCat Tools",
            "description": "Behavior Pack gerado automaticamente via Web IDE.",
            "uuid": bpUuid1,
            "version": [1, 0, 0],
            "min_engine_version": [1, 20, 0]
        },
        "modules": [
            {
                "description": "Behavior Module",
                "type": "data",
                "uuid": bpUuid2,
                "version": [1, 0, 0]
            }
        ],
        "dependencies": [
            {
                "uuid": rpUuid1,
                "version": [1, 0, 0]
            }
        ]
    };
    bp.file("manifest.json", JSON.stringify(bpManifest, null, 2));

    // Pack Icon placeholder (1x1 transparent PNG base64 or similar)
    const defaultIconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    bp.file("pack_icon.png", defaultIconBase64, {base64: true});

    // Subfolders in BP
    const bpBlocks = bp.folder("blocks");
    const bpItems = bp.folder("items");
    const bpEntities = bp.folder("entities");
    const bpScripts = bp.folder("scripts");

    // Add Blocks
    let blocos = JSON.parse(localStorage.getItem('bloco') || '[]');
    blocos.forEach((b, idx) => {
        let blockJson = {
            "format_version": "1.20.0",
            "minecraft:block": {
                "description": {
                    "identifier": `${b.namespace}:${b.name}`,
                    "menu_category": { "category": "construction", "group": "itemGroup.name.stone" }
                },
                "components": {
                    "minecraft:loot": `loot_tables/blocks/${b.name}.json`,
                    "minecraft:destructible_by_mining": { "seconds_to_destroy": parseFloat(b.hardness) || 1.5 },
                    "minecraft:collision_box": true,
                    "minecraft:selection_box": true
                }
            }
        };
        bpBlocks.file(`${b.name}.json`, JSON.stringify(blockJson, null, 2));
    });

    // Add Items
    let itens = JSON.parse(localStorage.getItem('item') || '[]');
    itens.forEach((i, idx) => {
        let itemJson = {
            "format_version": "1.20.0",
            "minecraft:item": {
                "description": {
                    "identifier": `${i.namespace}:${i.name}`,
                    "category": "items"
                },
                "components": {
                    "minecraft:max_stack_size": parseInt(i.stack) || 64,
                    "minecraft:icon": { "texture": i.name }
                }
            }
        };
        bpItems.file(`${i.name}.json`, JSON.stringify(itemJson, null, 2));
    });

    // Add Mobs
    let mobs = JSON.parse(localStorage.getItem('mob') || '[]');
    mobs.forEach((m, idx) => {
        let mobJson = {
            "format_version": "1.20.0",
            "minecraft:entity": {
                "description": {
                    "identifier": `${m.namespace}:${m.name}`,
                    "is_spawnable": true,
                    "is_summonable": true,
                    "is_experimental": false
                },
                "components": {
                    "minecraft:health": { "value": parseInt(m.health) || 20, "max": parseInt(m.health) || 20 },
                    "minecraft:movement": { "value": parseFloat(m.speed) || 0.3 }
                }
            }
        };
        bpEntities.file(`${m.name}.json`, JSON.stringify(mobJson, null, 2));
    });

    // Add Scripts (@minecraft/server)
    let scripts = JSON.parse(localStorage.getItem('script') || '[]');
    if (scripts.length > 0) {
        // Add dependency to manifest for server script
        bpManifest.modules.push({
            "description": "Script Module",
            "type": "script",
            "language": "javascript",
            "uuid": uuidv4(),
            "version": [1, 0, 0],
            "entry": "scripts/main.js"
        });
        // Update manifest file in zip
        bp.file("manifest.json", JSON.stringify(bpManifest, null, 2));

        let combinedScript = `// Gerado por StarCat Addon Builder\nimport { world, system } from '@minecraft/server';\n\n`;
        scripts.forEach((s, idx) => {
            combinedScript += `// --- Script ${idx+1}: ${s.title || 'Custom'} ---\n`;
            combinedScript += s.code + `\n\n`;
        });
        bpScripts.file("main.js", combinedScript);
    }

    // --- RESOURCE PACK ---
    const rp = zip.folder("Resource_Pack");
    
    // RP Manifest
    const rpManifest = {
        "format_version": 2,
        "header": {
            "name": "Add-on Gerado por StarCat Tools (RP)",
            "description": "Resource Pack gerado automaticamente via Web IDE.",
            "uuid": rpUuid1,
            "version": [1, 0, 0],
            "min_engine_version": [1, 20, 0]
        },
        "modules": [
            {
                "description": "Resources",
                "type": "resources",
                "uuid": rpUuid2,
                "version": [1, 0, 0]
            }
        ]
    };
    rp.file("manifest.json", JSON.stringify(rpManifest, null, 2));
    rp.file("pack_icon.png", defaultIconBase64, {base64: true});

    const rpTextures = rp.folder("textures");
    rpTextures.file("item_texture.json", JSON.stringify({
        "format_version": "1.10.0",
        "resource_pack_name": "starcat",
        "texture_name": "atlas.items",
        "texture_data": {}
    }, null, 2));

    // Generate and download zip as .mcaddon
    const content = await zip.generateAsync({type: "blob"});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = "starcat_addon.mcaddon";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function limparDados() {
    if (confirm('Deseja limpar todos os itens criados na sessão?')) {
        localStorage.clear();
        updateCounts();
        alert('Dados limpos com sucesso!');
    }
}
