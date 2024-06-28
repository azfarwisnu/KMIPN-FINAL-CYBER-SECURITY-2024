import os

# Function to convert a Gray code number to the original number
def from_gray(gray):
    num = gray
    shift = gray >> 1
    while shift:
        num ^= shift
        shift >>= 1
    return num

def gray_decrypt(input_filename, output_filename):
    with open(input_filename, 'rb') as input_file, open(output_filename, 'wb') as output_file:
        while True:
            buffer = input_file.read(1)
            if not buffer:
                break
            decrypted_byte = from_gray(buffer[0])
            output_file.write(bytes([decrypted_byte]))

def decrypt_all_files_in_directory():
    for filename in os.listdir('.'):
        if filename.endswith('.clown'):
            output_filename = filename[:-6] + '.recovered'
            print(f'Decrypting: {filename} -> {output_filename}')
            gray_decrypt(filename, output_filename)
    print('All files decrypted successfully.')

if __name__ == "__main__":
    decrypt_all_files_in_directory()