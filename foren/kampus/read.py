import json

# Baca file JSON
with open('all.json') as f:
    data = json.load(f)
    for x in data:
        print(x)