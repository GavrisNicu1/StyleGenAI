import pypdf
import os

files = [
    "Diana_Dulf_licenta.pdf",
    "Licenta Vancea Bogdan (1).pdf",
    "Licență___Bonitarea_Terenurilor_Agricole___Bancoș_Andrei_Marius (1).pdf"
]

keywords = ["StyleGenAI", "vestimentar", "outfit", "fashion", "Flask", "React Native"]

for file in files:
    if os.path.exists(file):
        try:
            reader = pypdf.PdfReader(file)
            print(f"--- {file} ---")
            
            # Check the first 5 pages for broader coverage
            total_found = []
            excerpts = []
            
            for i in range(min(5, len(reader.pages))):
                text = reader.pages[i].extract_text()
                if not text: continue
                for kw in keywords:
                    if kw.lower() in text.lower() and kw not in total_found:
                        total_found.append(kw)
                        idx = text.lower().find(kw.lower())
                        start = max(0, idx - 40)
                        end = min(len(text), idx + 100)
                        excerpts.append(f"Page {i+1} [{kw}]: ...{text[start:end].replace('\n', ' ')}...")
            
            if total_found:
                print(f"Keywords found: {', '.join(total_found)}")
                for excerpt in excerpts:
                    print(excerpt)
            else:
                print("No keywords found in first 5 pages.")
        except Exception as e:
            print(f"Error processing {file}: {e}")
