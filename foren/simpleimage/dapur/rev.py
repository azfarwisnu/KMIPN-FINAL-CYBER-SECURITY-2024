f = open("flag.png","rb").read()

print(f[::-1].hex())