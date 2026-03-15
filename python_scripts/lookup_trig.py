import math
N=256
scale=16384
for i in range(1,32):
    raw_result=math.sin(i*(2*math.pi)/N)
    result = int(round(raw_result * scale))
    print(result)
