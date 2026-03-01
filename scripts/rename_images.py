import os
import re
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration
URL = "https://pbzeuxbmiawnjwpnbwkh.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiemV1eGJtaWF3bmp3cG5id2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMzczNzcsImV4cCI6MjA4MzgxMzM3N30.YeGT5vQm2-LAdtCmWcX7EfTWyqIoyVJaO1mfCir2HgI"

# Configuration parameters
DRY_RUN = False # Set to False for actual renaming
FOLDER_PATH = r"c:\Users\forza\Documents\Raines1.0\immagini\immagini Raines non scontornate"

def clean_name(text):
    if not text: return set()
    # Rimuove unità di misura e quantità comuni
    text = re.sub(r'\d+[LlGgMmKk]+', '', text)
    # Rimuove caratteri speciali
    text = re.sub(r'[^\w\s]', ' ', text)
    # Tokenizza e pulisce
    words = text.lower().split()
    # Parole non significative
    stop_words = {'lt', 'kg', 'ml', 'tn', 'pz', 'conf', 'raines', 'product', 'per', 'di', 'ad', 'effetto', 'composto', 'composta'}
    return {w for w in words if len(w) > 2 and w not in stop_words}

def main():
    try:
        supabase: Client = create_client(URL, KEY)
        
        # 1. Fetch products (generic IMG_ entries)
        products_resp = supabase.table("products").select("id, name").like("id", "IMG_%").execute()
        products = products_resp.data
        
        # 2. Fetch catalog (actual article codes)
        catalog_resp = supabase.table("catalogo").select("codice_articolo, descrizione, descrizione_estesa, immagine_locale").execute()
        catalog = catalog_resp.data
        
        print(f"Loaded {len(products)} products and {len(catalog)} catalog items.")
        
        # Pre-process catalog descriptions
        catalog_keywords = []
        for item in catalog:
            desc = (item['descrizione'] or "") + " " + (item['descrizione_estesa'] or "")
            catalog_keywords.append({
                'code': item['codice_articolo'],
                'keywords': clean_name(desc),
                'has_image': item['immagine_locale'] is not None
            })
            
        mapping = {}
        processed_count = 0
        
        for p in products:
            p_id = p['id']
            p_name = p['name']
            p_keywords = clean_name(p_name)
            
            if not p_keywords:
                continue
                
            best_match = None
            max_score = 0
            best_intersection = set() # To store the words that led to the best match
            
            for c in catalog_keywords:
                # Intersezione delle parole chiave
                intersection = p_keywords.intersection(c['keywords'])
                score = len(intersection)
                
                # Bonus se ha già un'immagine (segno di associazione precedente)
                if score > 0 and c['has_image']:
                    score += 0.5
                
                if score > max_score:
                    max_score = score
                    best_match = c['code']
                    best_intersection = intersection # Store the intersection for the current best match
            
            # Soglia minima di confidenza
            if max_score >= 1.0:
                mapping[p_id] = best_match
                processed_count += 1
                print(f"Mapped '{p_id}' (name: '{p_name}') to '{best_match}' with score {max_score} and words: {best_intersection}")

        print(f"Found {processed_count} potential mappings.")
        
        # 3. Handle local files
        local_files = [f for f in os.listdir(FOLDER_PATH) if f.upper().endswith('.JPG')]
        renamed_count = 0
        
        for filename in local_files:
            img_id = os.path.splitext(filename)[0]
            if img_id in mapping:
                new_filename = f"{mapping[img_id]}.JPG"
                old_path = os.path.join(FOLDER_PATH, filename)
                new_path = os.path.join(FOLDER_PATH, new_filename)
                
                try:
                    if not os.path.exists(new_path):
                        if DRY_RUN:
                            print(f"[DRY-RUN] Will rename: {filename} -> {new_filename}")
                        else:
                            os.rename(old_path, new_path)
                            print(f"Renamed: {filename} -> {new_filename}")
                        renamed_count += 1
                    else:
                        print(f"Skipped (target exists): {filename}")
                except Exception as e:
                    print(f"Error renaming {filename}: {e}")
            else:
                print(f"No mapping found for: {filename}")
                
        print(f"\nFinal Summary:")
        print(f"Total files processed: {len(local_files)}")
        print(f"Successfully renamed: {renamed_count}")
        
    except Exception as e:
        print(f"Fatal error: {e}")

if __name__ == "__main__":
    main()
