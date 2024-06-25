def extract_password_from_log(file_path):
    f = open(file_path, "r").readlines()

    current_index = None
    current_value = None
    results = {}

    for data in f:
        try:
            getindex = int(data.split("LIMIT")[1].split("),")[1].split(",")[0])
            getvalue = int(data.split("LIMIT")[1].split("),")[1].split(">")[1].split(")")[0])
            
            if current_index != getindex:
                if current_value is not None:
                    # Simpan nilai terakhir sebelum index berubah
                    results[current_index] = current_value + 1
                current_index = getindex
                current_value = getvalue
            else:
                if getvalue > current_value:
                    current_value = getvalue
        except (ValueError, IndexError):
            continue
    
    # Simpan nilai terakhir
    if current_value is not None:
        results[current_index] = current_value + 1

    return results

# File path ke final.txt
file_path = 'final.txt'
results = extract_password_from_log(file_path)
flag = ""

# Cetak hasil
for index in sorted(results):
    value = results[index]
    flag += str(chr(value))
    print(f"Index {index} memiliki nilai {chr(value)} (ASCII: {value})")

print(flag)
