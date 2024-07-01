output_file = "combined.txt"

with open(output_file, "w") as combined_file:
    for x in range(983, 1563):
        filename = f"output/{x}.txt"
        try:
            with open(filename, "r") as file:
                lines = file.readlines()
                if len(lines) > 30:
                    line30 = lines[30].strip()
                    line_minus2 = lines[-2].strip()
                    combined_file.write(f"{line30} response {line_minus2} \n")
                else:
                    print(f"Not enough lines in {filename} to read.")
        except FileNotFoundError:
            print(f"File {filename} not found.")
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Combined output written to {output_file}")
