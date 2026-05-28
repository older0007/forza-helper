const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

async function main() {
  const exePath = path.join(__dirname, '..', 'dist', 'forza-companion.exe');
  const iconPath = path.join(__dirname, '..', 'logo.ico');
  
  if (!fs.existsSync(exePath)) {
    console.error("Executable not found!");
    return;
  }
  
  const data = fs.readFileSync(exePath);
  const exe = ResEdit.NtExecutable.from(data);
  const res = ResEdit.NtExecutableResource.from(exe);
  
  console.log("Existing icon entries before cleaning:");
  res.entries.forEach(entry => {
    if (entry.type === 14 || entry.type === 3) {
      console.log(`Type: ${entry.type === 14 ? 'RT_GROUP_ICON' : 'RT_ICON'}, ID: ${entry.id}, LangID: ${entry.langID}, Size: ${entry.bin ? entry.bin.byteLength : 'N/A'}`);
    }
  });
  
  // Clean existing icons
  console.log("\nCleaning existing icons...");
  res.entries = res.entries.filter(entry => entry.type !== 3 && entry.type !== 14);
  
  // Add new icon
  console.log("Adding new icon from logo.ico...");
  const iconData = fs.readFileSync(iconPath);
  const iconFile = ResEdit.Data.IconFile.from(iconData);
  
  // Let's print details of logo.ico's sub-icons
  console.log(`logo.ico contains ${iconFile.icons.length} sub-icons.`);
  iconFile.icons.forEach((icon, i) => {
    console.log(`  Icon #${i}: Width: ${icon.width}, Height: ${icon.height}, Colors: ${icon.colors}, Size: ${icon.data.byteLength}`);
  });
  
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1, // ID of main icon
    1033, // Use standard Lang ID 1033
    iconFile.icons.map(icon => icon.data)
  );
  
  console.log("\nNew icon entries after replacing:");
  res.entries.forEach(entry => {
    if (entry.type === 14 || entry.type === 3) {
      console.log(`Type: ${entry.type === 14 ? 'RT_GROUP_ICON' : 'RT_ICON'}, ID: ${entry.id}, LangID: ${entry.langID}, Size: ${entry.bin ? entry.bin.byteLength : 'N/A'}`);
    }
  });
  
  res.outputResource(exe);
  const patchedBuffer = exe.generate();
  fs.writeFileSync(exePath, Buffer.from(patchedBuffer));
  console.log("\nPatched file written successfully.");
}

main().catch(console.error);
