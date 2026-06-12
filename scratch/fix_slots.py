import os

def main():
    js_path = r"public/index.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. selectDraftAgent replacement
    target_select = """  const slotAvatar = document.getElementById(`dc-slot-avatar-${activeSlotIndex}`);
  const slotName = document.getElementById(`dc-slot-name-${activeSlotIndex}`);
  const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
  
  slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
  slotName.innerText = agKey.toUpperCase();"""

    replacement_select = """  const slotAvatar = document.getElementById(`dc-slot-avatar-${activeSlotIndex}`);
  const slotName = document.getElementById(`dc-slot-name-${activeSlotIndex}`);
  const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
  
  if (slotAvatar) {
    slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
  }
  if (slotName) {
    slotName.innerText = agKey.toUpperCase();
  }"""

    # 2. loadSavedDraft replacement
    target_load = """  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (agKey) {
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      slotName.innerText = agKey.toUpperCase();
    } else {
      slotAvatar.innerHTML = '➕';
      slotName.innerText = `Slot ${i+1}`;
    }
  }"""

    replacement_load = """  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (agKey) {
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      if (slotAvatar) {
        slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      }
      if (slotName) {
        slotName.innerText = agKey.toUpperCase();
      }
    } else {
      if (slotAvatar) {
        slotAvatar.innerHTML = '➕';
      }
      if (slotName) {
        slotName.innerText = `Slot ${i+1}`;
      }
    }
  }"""

    # 3. resetDraftComp replacement
    target_reset = """  for (let i = 0; i < 5; i++) {
    document.getElementById(`dc-slot-avatar-${i}`).innerHTML = '➕';
    document.getElementById(`dc-slot-name-${i}`).innerText = `Slot ${i+1}`;
  }"""

    replacement_reset = """  for (let i = 0; i < 5; i++) {
    safeSetInnerHtml(`dc-slot-avatar-${i}`, '➕');
    const slotName = document.getElementById(`dc-slot-name-${i}`);
    if (slotName) {
      slotName.innerText = `Slot ${i+1}`;
    }
  }"""

    # 4. buildAroundMe replacement
    target_build = """  // Render the selected agents into the UI slots
  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    if (agKey) {
      const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
      const slotName = document.getElementById(`dc-slot-name-${i}`);
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      
      slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      slotName.innerText = agKey.toUpperCase();
    }
  }"""

    replacement_build = """  // Render the selected agents into the UI slots
  for (let i = 0; i < 5; i++) {
    const agKey = draftSlots[i];
    if (agKey) {
      const slotAvatar = document.getElementById(`dc-slot-avatar-${i}`);
      const slotName = document.getElementById(`dc-slot-name-${i}`);
      const iconUrl = getAgentIconUrl(agKey.charAt(0).toUpperCase() + agKey.slice(1));
      
      if (slotAvatar) {
        slotAvatar.innerHTML = iconUrl ? `<img class="dc-slot-avatar-img" src="${iconUrl}">` : '👤';
      }
      if (slotName) {
        slotName.innerText = agKey.toUpperCase();
      }
    }
  }"""

    if target_select in content:
        content = content.replace(target_select, replacement_select)
        print("Replaced selectDraftAgent")
    if target_load in content:
        content = content.replace(target_load, replacement_load)
        print("Replaced loadSavedDraft")
    if target_reset in content:
        content = content.replace(target_reset, replacement_reset)
        print("Replaced resetDraftComp")
    if target_build in content:
        content = content.replace(target_build, replacement_build)
        print("Replaced buildAroundMe")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Done")

if __name__ == "__main__":
    main()
