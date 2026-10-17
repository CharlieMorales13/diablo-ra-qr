"""Marcador personalizado de la Actividad 1 (RA).

Uso: python generar_marcador.py <URL_FINAL> <salida.png>
Requiere: pip install qrcode pillow opencv-python numpy
Genera el PNG de 2000x2000 y reporta puntos de rastreo, simetria, cobertura
y si el QR se lee. Volver a correrlo con la URL definitiva antes de compilar
el target de MindAR (ver README).
"""
import os, random, sys
import numpy as np, cv2, qrcode
from PIL import Image, ImageDraw, ImageFont

S = 2000
OR = (255, 90, 0)
BK = (18, 18, 18)
WH = (255, 255, 255)
HERE = os.path.dirname(os.path.abspath(__file__))
COL = os.path.join(HERE, "assets", "a-naranja.png")
URL = sys.argv[1] if len(sys.argv) > 1 else "https://example.com/ra-01"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "marcador.png")


def first(*paths):
    """Primera fuente que exista (Linux con Inter / Windows)."""
    for p in paths:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Ninguna fuente encontrada: %s" % (paths,))


F_BLACK = first("/usr/share/fonts/opentype/inter/InterDisplay-Black.otf", "C:/Windows/Fonts/seguibl.ttf")
F_BLACK_I = first("/usr/share/fonts/opentype/inter/InterDisplay-BlackItalic.otf", "C:/Windows/Fonts/seguibli.ttf")
F_MONO = first("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", "C:/Windows/Fonts/consolab.ttf")
font = lambda p, s: ImageFont.truetype(p, s)

m = Image.new("RGB", (S, S), WH)
d = ImageDraw.Draw(m)

# ---------- marco con muesca asimetrica ----------
FR = 64
d.rectangle([0, 0, S - 1, S - 1], fill=BK)
d.rectangle([FR, FR, S - 1 - FR, S - 1 - FR], fill=WH)

# ---------- greca escalonada (xicalcoliuhqui, Mitla) ----------
PATH = [(0, 10), (0, 8), (2, 8), (2, 6), (4, 6), (4, 0), (10, 0),
        (10, 8), (6, 8), (6, 2), (8, 2), (8, 6)]

def greca(ox, oy, u, color, flipx=False, flipy=False):
    pts = []
    for x, y in PATH:
        x = 10 - x if flipx else x
        y = 10 - y if flipy else y
        pts.append((ox + x * u, oy + y * u))
    h = u / 2
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        d.rectangle([min(x1, x2) - h, min(y1, y2) - h, max(x1, x2) + h, max(y1, y2) + h], fill=color)

# ---------- A naranja, esquina superior izquierda ----------
a = Image.open(COL).convert("RGBA")
a.thumbnail((440, 440), Image.LANCZOS)
m.paste(a, (120, 120), a)

# ---------- titulo ----------
d.text((600, 118), "ATRAPA AL", fill=BK, font=font(F_BLACK, 150))
d.text((596, 262), "INTRUSO", fill=OR, font=font(F_BLACK_I, 186))
d.text((606, 478), "RA//01  ·  UAO  ·  2026", fill=BK, font=font(F_MONO, 44))

# ---------- esquirlas, esquina superior derecha ----------
shards = [
    [(1650, 130), (1880, 150), (1720, 330)],
    [(1800, 230), (1880, 470), (1700, 420)],
    [(1600, 380), (1690, 360), (1640, 520)],
    [(1760, 520), (1860, 560), (1790, 600)],
]
for i, t in enumerate(shards):
    d.polygon(t, fill=OR if i in (1, 3) else BK)

# ---------- QR al centro con sello ----------
qr = qrcode.QRCode(border=2, box_size=20, error_correction=qrcode.constants.ERROR_CORRECT_H)
qr.add_data(URL)
qr.make(fit=True)
qi = qr.make_image(fill_color=BK, back_color=WH).convert("RGB")
QS = 820
qi = qi.resize((QS, QS), Image.NEAREST)
QX, QY = 590, 650
m.paste(qi, (QX, QY))
# sello central (dentro del margen de correccion H)
cs = 150
cx, cy = QX + QS // 2, QY + QS // 2
d.rectangle([cx - cs // 2 - 10, cy - cs // 2 - 10, cx + cs // 2 + 10, cy + cs // 2 + 10], fill=WH)
d.rectangle([cx - cs // 2, cy - cs // 2, cx + cs // 2, cy + cs // 2], fill=OR)
d.text((cx, cy + 4), "CGM", fill=WH, font=font(F_BLACK, 56), anchor="mm")

# ---------- columna izquierda: dos grecas distintas ----------
greca(130, 690, 30, BK)
greca(150, 1100, 24, OR, flipx=True, flipy=True)

# ---------- columna derecha: texto vertical + barras ----------
lbl = Image.new("RGBA", (820, 90), (0, 0, 0, 0))
ImageDraw.Draw(lbl).text((0, 0), "OAXACA · MÉXICO", fill=BK, font=font(F_MONO, 74))
lbl = lbl.rotate(90, expand=True)
m.paste(lbl, (1490, 640), lbl)
for i, (y, w) in enumerate([(660, 220), (720, 120), (790, 260), (880, 90),
                            (950, 300), (1050, 160), (1120, 240), (1230, 110), (1300, 280)]):
    h = 34 if i % 3 else 52
    d.rectangle([1600, y, 1600 + w, y + h], fill=OR if i in (2, 6) else BK)
d.text((1600, 1380), "v1.0", fill=BK, font=font(F_MONO, 60))

# ---------- banda inferior ----------
x = 130
for w in [14, 42, 18, 64, 10, 30, 22, 52, 12]:
    d.rectangle([x, 1560, x + w, 1840], fill=BK)
    x += w + 16
d.text((560, 1550), "CARLOS GÓMEZ", fill=BK, font=font(F_BLACK, 104))
d.text((566, 1680), "REALIDAD VIRTUAL Y AUMENTADA", fill=BK, font=font(F_MONO, 44))
d.text((566, 1745), "> apunta la cámara aquí_", fill=OR, font=font(F_MONO, 44))

# bloque "ESCANÉAME" que rompe el marco abajo a la derecha
d.polygon([(1540, S), (1600, 1560), (S, 1560), (S, S)], fill=OR)
d.text((1615, 1610), "ESCA-", fill=WH, font=font(F_BLACK, 84))
d.text((1615, 1700), "NÉAME", fill=WH, font=font(F_BLACK, 84))
d.polygon([(1850, 1840), (1930, 1840), (1890, 1800)], fill=WH)
d.rectangle([1880, 1840, 1900, 1910], fill=WH)

m.save(OUT)

# ---------- analisis ----------
g = cv2.cvtColor(np.array(m), cv2.COLOR_RGB2GRAY)
g1k = cv2.resize(g, (1000, 1000), interpolation=cv2.INTER_AREA)
kp = cv2.ORB_create(nfeatures=10000, fastThreshold=20).detect(g1k, None)
sym = np.corrcoef(g1k.flatten().astype(float), np.fliplr(g1k).flatten().astype(float))[0, 1]
cells = set((int(k.pt[0] // 125), int(k.pt[1] // 125)) for k in kp)
q0, q1 = QX / 2, (QX + QS) / 2
inq = sum(1 for k in kp if q0 <= k.pt[0] <= q1 and QY / 2 <= k.pt[1] <= (QY + QS) / 2)
ok, *_ = cv2.QRCodeDetector().detectAndDecode(np.array(m))
print("puntos=%d simetria=%.2f cobertura=%.0f%% fuera_del_QR=%.0f%% qr_lee=%r"
      % (len(kp), sym, len(cells) / 64 * 100, 100 * (len(kp) - inq) / len(kp), ok))

ov = cv2.cvtColor(g1k, cv2.COLOR_GRAY2RGB)
for k in kp:
    cv2.circle(ov, (int(k.pt[0]), int(k.pt[1])), 5, (0, 200, 90), 2)
Image.fromarray(ov).save(OUT.replace(".png", "_puntos.png"))
