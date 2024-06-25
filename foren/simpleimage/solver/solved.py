f = open("chall.png","rb").read()

print(f[::-1].hex())