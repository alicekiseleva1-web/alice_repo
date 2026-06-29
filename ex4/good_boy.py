t = int(input())
 
for _ in range(t):
    n = int(input())
    a = list(map(int, input().split()))
 
    max_product = 0
 
    for i in range(n):
        a[i] += 1
 
        product = 1
        for x in a:
            product *= x
 
        max_product = max(max_product, product)
 
        a[i] -= 1
 
    print(max_product)
