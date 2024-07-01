from Crypto.Util.number import *
from phe import paillier
from secret import flag
import random
from pwn import *
import string

charset=string.ascii_lowercase+string.ascii_uppercase+string.digits+'{}_'
mungkin=[charset for _ in range(55)]
kirim=[8577627131335996613063540869197101574090243,100]
for _ in range(5):
    f=process(['python3','soal.py'])
    target='6277616e6720666c61676e796120646f6e67'
    sig_asli=1
    for i in range(2):
        f.sendlineafter(b'> ',b'1')
        f.sendlineafter(b'> ',"{0:x}".format(kirim[i]).encode())
        sig=f.readline().strip(b"your signature : ").decode().rstrip()
        sig_asli=int(sig,16)*sig_asli
    sig_asli="{0:x}".format(sig_asli)
    print(sig_asli)
    f.sendlineafter(b'> ',b'2')
    f.sendlineafter(b'> ',sig_asli.encode())
    print(f.readline())
    arr=f.readline().strip(b'[')[:-2].decode().split(', ')
    arr=[int(i) for i in arr]
    for i in range(len(arr)):
        temp=""
        for j in range(len(mungkin[i])):
            if arr[i]%ord(mungkin[i][j])==0:
                temp+=mungkin[i][j]
        mungkin[i]=temp
    print(''.join(mungkin))