t = int(input())
 
for _ in range(t):
    n, d = map(int, input().split())
    s = input()
 
    inserted = False
    result = ""
 
    for ch in s:
        if not inserted and int(ch) < d:
            result += str(d)
            inserted = True
 
        result += ch
 
    if not inserted:
        result += str(d)
 
    print(result)
