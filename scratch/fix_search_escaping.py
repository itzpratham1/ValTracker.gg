import os

def main():
    js_path = r"public/index.js"
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Normalize newlines
    content = content.replace("\r\n", "\n")

    # 1. Bookmarks replacement
    target_bookmark = """        <div class="search-item" data-name="${p.name}" data-tag="${p.tag}" data-region="${p.region}">
          <div class="search-item-left">
            <div class="search-item-card">👤</div>
            <div class="search-item-details">
              <span class="search-item-name">${p.name}<span class="search-item-tag">#${p.tag}</span></span>"""

    replacement_bookmark = """        <div class="search-item" data-name="${escapeHtml(p.name)}" data-tag="${escapeHtml(p.tag)}" data-region="${escapeHtml(p.region)}">
          <div class="search-item-left">
            <div class="search-item-card">👤</div>
            <div class="search-item-details">
              <span class="search-item-name">${escapeHtml(p.name)}<span class="search-item-tag">#${escapeHtml(p.tag)}</span></span>"""

    # 2. Recent searches replacement
    target_recent = """        <div class="search-item" data-name="${p.name}" data-tag="${p.tag}" data-region="${p.region}">
          <div class="search-item-left">
            <div class="search-item-card">👤</div>
            <div class="search-item-details">
              <span class="search-item-name">${p.name}<span class="search-item-tag">#${p.tag}</span></span>"""

    replacement_recent = """        <div class="search-item" data-name="${escapeHtml(p.name)}" data-tag="${escapeHtml(p.tag)}" data-region="${escapeHtml(p.region)}">
          <div class="search-item-left">
            <div class="search-item-card">👤</div>
            <div class="search-item-details">
              <span class="search-item-name">${escapeHtml(p.name)}<span class="search-item-tag">#${escapeHtml(p.tag)}</span></span>"""

    # 3. Database searches replacement
    target_db = """        <div class="search-item" data-name="${p.name}" data-tag="${p.tag}" data-region="${p.region}">
          <div class="search-item-left">
            <div class="search-item-card">${avatarHtml}</div>
            <div class="search-item-details">
              <span class="search-item-name">${p.name}<span class="search-item-tag">#${p.tag}</span></span>"""

    replacement_db = """        <div class="search-item" data-name="${escapeHtml(p.name)}" data-tag="${escapeHtml(p.tag)}" data-region="${escapeHtml(p.region)}">
          <div class="search-item-left">
            <div class="search-item-card">${avatarHtml}</div>
            <div class="search-item-details">
              <span class="search-item-name">${escapeHtml(p.name)}<span class="search-item-tag">#${escapeHtml(p.tag)}</span></span>"""

    count = 0
    if target_bookmark in content:
        content = content.replace(target_bookmark, replacement_bookmark)
        print("Replaced bookmark search items")
        count += 1
    else:
        print("WARNING: Bookmark search items not found")

    if target_recent in content:
        content = content.replace(target_recent, replacement_recent)
        print("Replaced recent search items")
        count += 1
    else:
        print("WARNING: Recent search items not found")

    if target_db in content:
        content = content.replace(target_db, replacement_db)
        print("Replaced db search items")
        count += 1
    else:
        print("WARNING: Db search items not found")

    with open(js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Done, count={count}")

if __name__ == "__main__":
    main()
