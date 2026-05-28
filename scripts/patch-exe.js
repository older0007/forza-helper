const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

async function main() {
  const exePath = path.join(__dirname, '..', 'dist', 'forza-companion.exe');
  const iconPath = path.join(__dirname, '..', 'logo.ico');
  const pkgPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(exePath)) {
    console.error("[Patch-Exe] Executable not found! Build it first using npm run build.");
    process.exit(1);
  }
  
  console.log("[Patch-Exe] Reading executable resources...");
  const data = fs.readFileSync(exePath);
  const exe = ResEdit.NtExecutable.from(data);
  const res = ResEdit.NtExecutableResource.from(exe);
  
  console.log("[Patch-Exe] Loading package details...");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version || '1.0.0';
  const versionParts = version.split('.').map(Number);
  while (versionParts.length < 4) {
    versionParts.push(0);
  }
  
  console.log(`[Patch-Exe] Customizing VersionInfo block (Version: ${version})...`);
  const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  if (viList.length > 0) {
    const vi = viList[0];
    
    vi.setStringValues(
      { lang: 1033, codepage: 1200 },
      {
        FileDescription: 'Forza Horizon 6 Companion + Dualsense Support',
        FileVersion: version,
        ProductVersion: version,
        LegalCopyright: 'older0007',
        ProductName: 'Forza Horizon 6 Companion',
        OriginalFilename: 'forza-companion.exe',
        InternalName: 'forza-companion.exe',
        CompanyName: 'older0007'
      }
    );
    
    vi.setFileVersion(versionParts[0], versionParts[1], versionParts[2], versionParts[3]);
    vi.setProductVersion(versionParts[0], versionParts[1], versionParts[2], versionParts[3]);
    vi.outputToResourceEntries(res.entries);
  } else {
    console.warn("[Patch-Exe] Warning: No VersionInfo entries found inside template binary.");
  }
  
  if (fs.existsSync(iconPath)) {
    console.log("[Patch-Exe] Injecting application icon (logo.ico)...");
    const iconData = fs.readFileSync(iconPath);
    const iconFile = ResEdit.Data.IconFile.from(iconData);
    
    // Clean existing default Node.js icons to ensure new one is recognized cleanly
    res.entries = res.entries.filter(entry => entry.type !== 3 && entry.type !== 14);
    
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      1, // ID of main icon
      1033,
      iconFile.icons.map(icon => icon.data)
    );
  } else {
    console.warn("[Patch-Exe] Warning: logo.ico not found at project root.");
  }
  
  console.log("[Patch-Exe] Generating new binary structure...");
  res.outputResource(exe);
  const patchedBuffer = exe.generate();
  fs.writeFileSync(exePath, Buffer.from(patchedBuffer));
  console.log("[Patch-Exe] Successfully patched executable metadata and icon!");
}

main().catch(err => {
  console.error("[Patch-Exe] Exception during resource patching:", err);
  process.exit(1);
});
