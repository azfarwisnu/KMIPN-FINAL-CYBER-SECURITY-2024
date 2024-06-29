from pwn import *
from Crypto.Util.number import *

f=process(['python3','soal.py'])
payload=b'a'*100
f.sendlineafter(b'> ',b'1')
f.sendlineafter(b'> ',payload)
enc=f.readline().strip(b'encrypted : ').decode().rstrip()
enc=long_to_bytes(int(enc,16))
key=xor(payload,enc)
f.sendlineafter(b'> ',b'2')
flag=f.readline().strip(b'encrypted : ').decode().rstrip()
flag=long_to_bytes(int(flag,16))
print(xor(flag,key))

