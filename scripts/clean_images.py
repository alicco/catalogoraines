"""
Script per pulire e standardizzare le immagini del catalogo Raines:
1. Identifica immagini trasparenti vs non trasparenti
2. Rimuove duplicati (tiene PNG trasparenti se disponibili)
3. Ridimensiona tutte a 500x500 pixel mantenendo proporzioni
"""

import os
from PIL import Image
from collections import defaultdict
import shutil

# Configurazione
IMAGES_DIR = r"c:\Users\forza\Documents\Raines1.0\public\raines_images"
OUTPUT_DIR = r"c:\Users\forza\Documents\Raines1.0\public\raines_images_cleaned"
BACKUP_DIR = r"c:\Users\forza\Documents\Raines1.0\public\raines_images_backup"
TARGET_SIZE = (500, 500)

def has_transparency(img):
    """Controlla se un'immagine ha pixel trasparenti"""
    if img.mode == 'RGBA':
        # Controlla se ci sono pixel con alpha < 255
        alpha = img.getchannel('A')
        return alpha.getextrema()[0] < 255  # Min alpha < 255 significa trasparenza
    elif img.mode == 'LA':
        alpha = img.getchannel('A')
        return alpha.getextrema()[0] < 255
    elif img.mode == 'P':
        # Palette mode - controlla se ha trasparenza
        if 'transparency' in img.info:
            return True
        # Converti per controllare meglio
        try:
            rgba = img.convert('RGBA')
            alpha = rgba.getchannel('A')
            return alpha.getextrema()[0] < 255
        except:
            return False
    return False

def trim_white(img):
    """Rimuove i bordi che sono bianchi o quasi bianchi usando differenza RGB"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Ignoriamo l'Alpha per il rilevamento del bianco (l'autocrop gestisce l'alpha)
    rgb = img.convert('RGB')
    bg = Image.new('RGB', rgb.size, (255, 255, 255))
    
    # Calcola differenza dal bianco
    from PIL import ImageChops
    diff = ImageChops.difference(rgb, bg)
    gray = diff.convert('L')
    
    # Threshold: Pixel con differenza > 30 (non bianchi) diventano 255 (Keep)
    # 30 è una tolleranza aggressiva per rimuovere grigi chiari (255-30 = 225)
    mask = gray.point(lambda p: 255 if p > 30 else 0)
    
    bbox = mask.getbbox()
    if bbox:
        # Aggiungiamo un micro margine per sicurezza
        return img.crop(bbox)
    
    return img

def autocrop(img):
    """Ritaglio automatico dei bordi trasparenti e bianchi"""
    # 1. Prima rimuoviamo la trasparenza standard
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    bbox_transp = img.getbbox()
    if bbox_transp:
        img = img.crop(bbox_transp)
    
    # 2. Poi rimuoviamo il bianco eccessivo
    img = trim_white(img)
    
    return img

def resize_with_padding(img, target_size, bg_color=(255, 255, 255, 0)):
    """
    Ritaglio automatico millimetrico e inserimento in un quadrato target_size (500x500)
    """
    # 1. Autocrop millimetrico con soglia
    img = autocrop(img)
    
    # 2. Resizing per entrare nel target mantenendo proporzioni
    img.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    # 3. Creazione canvas quadrato 500x500
    new_img = Image.new('RGBA', target_size, bg_color)
    
    # 4. Centratura
    left = (target_size[0] - img.size[0]) // 2
    top = (target_size[1] - img.size[1]) // 2
    new_img.paste(img, (left, top), img)
    
    return new_img

def analyze_images():
    """Analizza tutte le immagini e crea un report"""
    files = os.listdir(IMAGES_DIR)
    
    # Raggruppa per nome base (senza estensione)
    groups = defaultdict(list)
    for f in files:
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
            base_name = os.path.splitext(f)[0]
            groups[base_name].append(f)
    
    report = {
        'duplicates': [],
        'single_jpg': [],
        'single_png': [],
        'transparent': [],
        'non_transparent': [],
        'to_keep': [],
        'to_remove': [],
        'sizes': {}
    }
    
    print("\n" + "="*60)
    print("ANALISI IMMAGINI CATALOGO RAINES")
    print("="*60)
    
    print(f"\nTotale file: {len(files)}")
    print(f"Gruppi unici (per nome base): {len(groups)}")
    
    # Analizza ogni gruppo
    duplicates_count = 0
    for base_name, file_list in sorted(groups.items()):
        if len(file_list) > 1:
            duplicates_count += 1
            report['duplicates'].append({
                'base_name': base_name,
                'files': file_list
            })
    
    print(f"Duplicati trovati: {duplicates_count}")
    
    print("\n" + "-"*60)
    print("DETTAGLIO DUPLICATI E DECISIONI:")
    print("-"*60)
    
    for base_name, file_list in sorted(groups.items()):
        # Analizza ogni file nel gruppo
        file_info = []
        for f in file_list:
            path = os.path.join(IMAGES_DIR, f)
            try:
                with Image.open(path) as img:
                    is_transparent = has_transparency(img)
                    size = img.size
                    file_info.append({
                        'filename': f,
                        'extension': os.path.splitext(f)[1].lower(),
                        'transparent': is_transparent,
                        'size': size,
                        'path': path
                    })
                    report['sizes'][f] = size
                    if is_transparent:
                        report['transparent'].append(f)
                    else:
                        report['non_transparent'].append(f)
            except Exception as e:
                print(f"  ⚠️ Errore leggendo {f}: {e}")
        
        # Decidi quale tenere
        if len(file_info) > 1:
            # Preferisci PNG trasparente, poi PNG, poi JPG
            transparent_pngs = [fi for fi in file_info if fi['extension'] == '.png' and fi['transparent']]
            pngs = [fi for fi in file_info if fi['extension'] == '.png']
            jpgs = [fi for fi in file_info if fi['extension'] in ['.jpg', '.jpeg']]
            
            if transparent_pngs:
                keep = transparent_pngs[0]
            elif pngs:
                keep = pngs[0]
            else:
                keep = file_info[0]
            
            report['to_keep'].append(keep['filename'])
            for fi in file_info:
                if fi['filename'] != keep['filename']:
                    report['to_remove'].append(fi['filename'])
            
            print(f"\n📁 {base_name}:")
            for fi in file_info:
                status = "✅ TENGO" if fi['filename'] == keep['filename'] else "❌ RIMUOVO"
                transp_status = "🔳 trasparente" if fi['transparent'] else "⬜ opaco"
                print(f"   {status} {fi['filename']} - {fi['size'][0]}x{fi['size'][1]} - {transp_status}")
        else:
            # Solo un file, tienilo
            if file_info:
                report['to_keep'].append(file_info[0]['filename'])
                if file_info[0]['extension'] == '.jpg':
                    report['single_jpg'].append(file_info[0]['filename'])
                else:
                    report['single_png'].append(file_info[0]['filename'])
    
    print("\n" + "="*60)
    print("RIEPILOGO:")
    print("="*60)
    print(f"File da TENERE: {len(report['to_keep'])}")
    print(f"File da RIMUOVERE (duplicati): {len(report['to_remove'])}")
    print(f"File trasparenti: {len(report['transparent'])}")
    print(f"File opachi: {len(report['non_transparent'])}")
    
    # Mostra dimensioni diverse
    unique_sizes = set(report['sizes'].values())
    print(f"\nDimensioni trovate: {len(unique_sizes)} diverse")
    for size in sorted(unique_sizes, key=lambda x: x[0]*x[1], reverse=True)[:10]:
        count = sum(1 for s in report['sizes'].values() if s == size)
        print(f"   {size[0]}x{size[1]}: {count} immagini")
    
    return report

def process_images(report, dry_run=False):
    """Processa le immagini: rimuovi duplicati e ridimensiona"""
    
    if dry_run:
        print("\n⚠️ MODALITÀ DRY RUN - Nessuna modifica effettuata")
        return
    
    # Crea cartelle
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    print(f"\n📂 Backup immagini originali in: {BACKUP_DIR}")
    print(f"📂 Immagini processate in: {OUTPUT_DIR}")
    
    # Backup originali
    for f in os.listdir(IMAGES_DIR):
        src = os.path.join(IMAGES_DIR, f)
        dst = os.path.join(BACKUP_DIR, f)
        if os.path.isfile(src):
            shutil.copy2(src, dst)
    
    print(f"✅ Backup completato: {len(os.listdir(BACKUP_DIR))} file")
    
    # Processa solo i file da tenere
    processed = 0
    errors = 0
    
    for filename in report['to_keep']:
        src_path = os.path.join(IMAGES_DIR, filename)
        # Output sempre come PNG per mantenere trasparenza
        base_name = os.path.splitext(filename)[0]
        # Suffisso _v2 per rompere la cache su tutti i file
        dst_path = os.path.join(OUTPUT_DIR, f"{base_name}_v2.png")
        
        try:
            with Image.open(src_path) as img:
                # Ridimensiona con padding trasparente
                processed_img = resize_with_padding(img, TARGET_SIZE)
                processed_img.save(dst_path, 'PNG', optimize=True)
                processed += 1
                print(f"✅ {filename} → {base_name}_v2.png ({TARGET_SIZE[0]}x{TARGET_SIZE[1]})")
        except Exception as e:
            errors += 1
            print(f"❌ Errore processando {filename}: {e}")
    
    print("\n" + "="*60)
    print("PROCESSAMENTO COMPLETATO:")
    print("="*60)
    print(f"✅ Immagini processate: {processed}")
    print(f"❌ Errori: {errors}")
    print(f"📂 Output: {OUTPUT_DIR}")

def main():
    print("\n🔍 Inizio analisi immagini...")
    report = analyze_images()
    print("\n🚀 Procedo con il processamento Standard (500x500)...")
    process_images(report, dry_run=False)

if __name__ == "__main__":
    main()
