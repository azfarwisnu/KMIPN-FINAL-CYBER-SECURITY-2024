f = open("combined.txt","r").readlines()
flag = []
index = 0

for x in range(len(f)):
	output = (f[x].split("response"))
	depan = output[0]
	belakang = output[1]
	parsingindex = depan.split("LIMIT")[1].split("THEN")[0]
	valueindex = parsingindex.split("),")[1][0]
	if ("login success" in belakang):
		print(output)