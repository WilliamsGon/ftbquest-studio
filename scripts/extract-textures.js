import fs from 'fs';
import path from 'path';
import readline from 'readline';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

// Salida
const OUT_DIR = path.join(__dirname, '../public/textures');

async function extractFromJar(jarPath, typeLabel) {
  if (!fs.existsSync(jarPath)) {
    console.log(`[!] Archivo no encontrado: ${jarPath}`);
    return;
  }
  
  console.log(`[*] Procesando ${typeLabel}: ${path.basename(jarPath)}...`);
  
  try {
    const zip = new AdmZip(jarPath);
    const zipEntries = zip.getEntries();
    
    let extractedCount = 0;
    
    const textureRegex = /^assets\/([^\/]+)\/textures\/(item|block|items|blocks)\/.*\.png$/;
    
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const match = entry.entryName.match(textureRegex);
      if (match) {
        const namespace = match[1];
        let type = match[2];
        if (type === 'items') type = 'item';
        if (type === 'blocks') type = 'block';
        
        const relativePath = entry.entryName.substring(`assets/${namespace}/textures/`.length);
        const outPath = path.join(OUT_DIR, namespace, relativePath);
        
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        
        fs.writeFileSync(outPath, entry.getData());
        extractedCount++;
      }
    }
    
    if (extractedCount > 0) {
      console.log(`  -> Extraídas ${extractedCount} texturas.`);
    }
  } catch (e) {
    console.error(`  [x] Error procesando ${jarPath}: ${e.message}`);
  }
}

async function main() {
  console.log("=========================================");
  console.log(" FTB Quests - Extractor de Texturas (PNG)");
  console.log("=========================================\n");
  
  const modsPath = await question("1. Ingresa la ruta de la carpeta 'mods' de tu instancia de Minecraft\n   (Dejar en blanco para omitir): ");
  const vanillaPath = await question("\n2. Ingresa la ruta al archivo .jar de Minecraft Vanilla (ej. 1.20.1.jar)\n   (Dejar en blanco para omitir): ");
  
  rl.close();
  console.log("\nIniciando extracción...");
  
  if (vanillaPath && vanillaPath.trim() !== "") {
    await extractFromJar(vanillaPath.trim().replace(/"/g, ''), "Vanilla");
  }
  
  if (modsPath && modsPath.trim() !== "") {
    const dir = modsPath.trim().replace(/"/g, '');
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir);
      const jars = files.filter(f => f.endsWith('.jar'));
      console.log(`\nEncontrados ${jars.length} archivos .jar en mods.`);
      for (const jar of jars) {
        await extractFromJar(path.join(dir, jar), "Mod");
      }
    } else {
      console.log(`[!] La ruta de mods no es un directorio válido: ${dir}`);
    }
  }
  
  console.log("\n¡Extracción finalizada!");
  console.log(`Revisa la carpeta: ${OUT_DIR}`);
}

main().catch(console.error);
