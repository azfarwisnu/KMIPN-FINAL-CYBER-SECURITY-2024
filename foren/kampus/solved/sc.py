import os


for x in range(983,1563):
	#f = open("output/983.txt","r").readlines()
	#print(f[30], f[-2])
	#exit()
	os.system(f"tshark -r dblast.pcapng -qz follow,tcp,ascii,{x} > output/{x}.txt")