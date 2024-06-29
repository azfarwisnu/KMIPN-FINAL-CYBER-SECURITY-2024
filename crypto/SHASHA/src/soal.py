from Crypto.Util.number import *
from secret import flag
import random
import os



class SS:
    def __init__(self, p: int, n: int, secret: int):
        self.p = p
        self.n = n
        self.poly = [secret] + [random.randint(0,p-1) for _ in range(n - 1)]

    def evaluate(self, x: int) -> int:
        return (
            sum([self.poly[i] * pow(x, i, self.p) for i in range(len(self.poly))])
            % self.p
        )

    def get_shares(self):
        return [self.evaluate(i + 1) for i in range(self.n)]
        
def lagrange_interpolation(x, points, prime_mod):
    # points = [(x0, y0), (x1, y1), ...]
    if prime_mod <= 1:
        raise ValueError("invalid prime mod")
    if x < 0 or x >= prime_mod:
        raise ValueError("out-of-range value")
    for (xi, yi) in points:
        if xi < 0 or xi >= prime_mod or yi < 0 or yi >= prime_mod:
            raise ValueError("invalid points")
    y = 0
    for i, (xi, yi) in enumerate(points):
        numerator = yi
        denominator = 1
        for j, (xj, yj) in enumerate(points):
            if j == i:
                continue
            numerator *= (x - xj + prime_mod) % prime_mod
            numerator %= prime_mod
            denominator *= (xi - xj + prime_mod) % prime_mod
            denominator %= prime_mod
        y += (numerator*inverse(denominator, prime_mod)) % prime_mod
        y %= prime_mod
    return y

def get_secret(p,key):
    temp=[(i+1,int(key[i])) for i in range(len(key))] 
    secret=lagrange_interpolation(0,temp,p)
    return secret

if __name__ == "__main__":
    secret = bytes_to_long(os.urandom(32))
    p=getPrime(512)
    n=30
    shares = SS(p, n, secret).get_shares()

    print("shares =", shares[:15])
    print("input shares : ")
    inp_shares=shares[15:]
    cnt=0
    while cnt<15:
        try:
            inp=input('> ')
            inp_shares.append(int(inp))
            cnt+=1
        except:
            print('invalid input')
            pass
    print('secret calculated as :',get_secret(p,inp_shares))
    if int(input("secret guessed : ")) == secret:
        print(flag)