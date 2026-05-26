with open("public/index.html", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

start = content.find("function evaluateDraft()")
if start != -1:
    # Let's count newlines from start to get the line number
    line_start = content.count('\n', 0, start) + 1
    
    # Let's parse braces to find the end
    braces = 0
    in_func = False
    end = start
    for i in range(start, len(content)):
        c = content[i]
        if c == '{':
            braces += 1
            in_func = True
        elif c == '}':
            braces -= 1
        
        if in_func and braces == 0:
            end = i + 1
            break
            
    line_end = content.count('\n', 0, end) + 1
    print(f"Starts at line {line_start}, ends at line {line_end}")
    
    # Print the last few lines of the function to verify
    sub = content[start:end]
    print("--- Last 100 chars ---")
    print(sub[-150:])
else:
    print("evaluateDraft not found")
