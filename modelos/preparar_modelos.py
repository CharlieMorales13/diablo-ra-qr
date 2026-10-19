"""Prepara los modelos del juego.

Uso:
    blender --background --python modelos/preparar_modelos.py -- <diablo_meshy.glb> <carpeta_sketchfab>

<diablo_meshy.glb>: Diablo de Juxtlahuaca generado con Meshy AI (plan gratuito,
CC BY 4.0) con su rig automático y animaciones ("Running", "Alert", ...).
<carpeta_sketchfab>: GLB de Sketchfab con licencia CC BY 4.0:
    agave_americana.glb           "Agave Americana" de Discobolo
    malaespina_mezcal_bottle.glb  "Malaespina Mezcal bottle" de santibanezjuan
    takis_fuego_-_mexico.glb      "Takis Fuego - México" de Luiss Maker
    gravel_road.glb               "gravel road" de SPLEEN VISION

Genera en assets/models/ (texturas incrustadas):
    diablo.glb    el diablo reducido de ~211 k a ~20 k triángulos, texturas de
                  1024 px y solo las animaciones que usa el juego: "Alert" de
                  frente antes de arrancar, "Running" al correr y
                  "All_Night_Dance" en la pantalla final.
    maguey.glb    agave escaneado (1 M triángulos, 48 MB) reducido para el teléfono.
    mezcal.glb    botella de mezcal reducida (turbo del Diablo).
    takis.glb     bolsa de Takis Fuego reducida (premio de +25).
    camino.glb    tramo de camino de grava escaneado: el piso por el que corre.
"""
import os
import sys

import bmesh
import bpy
import numpy as np

DIABLO, SKETCHFAB = sys.argv[sys.argv.index("--") + 1:][:2]
AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(os.path.dirname(AQUI), "assets", "models")
os.makedirs(SALIDA, exist_ok=True)


def limpiar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def importar(ruta):
    bpy.ops.import_scene.gltf(filepath=ruta)


def exportar(nombre, animaciones=False):
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(SALIDA, nombre),
        export_format="GLB",
        export_animations=animaciones,
        export_image_format="JPEG",
        export_jpeg_quality=85,
        export_yup=True,
    )
    print("OK", nombre, os.path.getsize(os.path.join(SALIDA, nombre)) // 1024, "KB")


# ---------------------------------------------------------------- diablo
limpiar()
importar(DIABLO)
for o in list(bpy.data.objects):
    if o.name.startswith("Icosphere"):  # ayudante que exporta Meshy, no se usa
        bpy.data.objects.remove(o)
cuerpo = next(o for o in bpy.data.objects if o.type == "MESH")
bpy.context.view_layer.objects.active = cuerpo
reducir = cuerpo.modifiers.new("reducir", "DECIMATE")
reducir.ratio = 20000 / len(cuerpo.data.polygons)
# primero en la pila: se reduce la malla en reposo y conserva los pesos del rig
bpy.ops.object.modifier_move_to_index(modifier="reducir", index=0)
bpy.ops.object.modifier_apply(modifier="reducir")
for img in bpy.data.images:
    if img.size[0] > 1024:
        img.scale(1024, 1024)
for accion in list(bpy.data.actions):
    if accion.name not in ("Alert", "Running", "All_Night_Dance"):
        bpy.data.actions.remove(accion)
exportar("diablo.glb", animaciones=True)

def quitar_suelo(obj):
    """El escaneo del agave trae un cuadro de tierra: quita las caras cafés de la
    parte baja (color de la textura en su UV) y deja solo las pencas verdes."""
    img = next(i for i in bpy.data.images if i.size[0] > 0)
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    zs = [v.co.z for v in obj.data.vertices]
    corte = min(zs) + 0.35 * (max(zs) - min(zs))
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    uv = bm.loops.layers.uv.active
    borrar = []
    for f in bm.faces:
        u = sum(l[uv].uv.x for l in f.loops) / len(f.loops)
        v = sum(l[uv].uv.y for l in f.loops) / len(f.loops)
        r, g, b, _ = px[int(v % 1 * (h - 1)), int(u % 1 * (w - 1))]
        if f.calc_center_median().z < corte and g < max(r, b) * 1.08:
            borrar.append(f)
    bmesh.ops.delete(bm, geom=borrar, context="FACES")
    # pedacitos verdes que quedaron sobre la tierra: muy abajo y lejos del tronco
    centros = [f.calc_center_median() for f in bm.faces]
    cx = sum(c.x for c in centros) / len(centros)
    cy = sum(c.y for c in centros) / len(centros)
    zc = sorted(c.z for c in centros)
    piso = zc[0] + 0.15 * (zc[-1] - zc[0])  # con lo que quedó, no con la tierra
    radio = max(((c.x - cx) ** 2 + (c.y - cy) ** 2) ** 0.5 for c in centros)
    sueltas = [f for f, c in zip(bm.faces, centros)
               if c.z < piso and ((c.x - cx) ** 2 + (c.y - cy) ** 2) ** 0.5 > 0.3 * radio]
    bmesh.ops.delete(bm, geom=sueltas, context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()
    print("suelo: caras quitadas", len(borrar), "sueltas", len(sueltas))


def reducir_sketchfab(archivo, caras, salida, limpiar_malla=None, px=512):
    """Une las mallas de un GLB de Sketchfab, las reduce y exporta con texturas de `px` px."""
    limpiar()
    importar(os.path.join(SKETCHFAB, archivo))
    mallas = [o for o in bpy.data.objects if o.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for o in mallas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = mallas[0]
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(obj.data.polygons) > caras:
        d = obj.modifiers.new("reducir", "DECIMATE")
        d.ratio = caras / len(obj.data.polygons)
        bpy.ops.object.modifier_apply(modifier="reducir")
    for e in [x for x in bpy.data.objects if x.type == "EMPTY"]:
        bpy.data.objects.remove(e)
    for img in bpy.data.images:
        if img.size[0] > px:
            img.scale(px, px)
    if limpiar_malla:
        limpiar_malla(obj)
    exportar(salida)


# ---------------------------------------------------------------- maguey (obstáculo)
reducir_sketchfab("agave_americana.glb", 6000, "maguey.glb", quitar_suelo)

# ---------------------------------------------------------------- mezcal (turbo)
reducir_sketchfab("malaespina_mezcal_bottle.glb", 4000, "mezcal.glb")

# ---------------------------------------------------------------- takis (premio)
reducir_sketchfab("takis_fuego_-_mexico.glb", 5000, "takis.glb")

# ---------------------------------------------------------------- camino de grava (piso)
# Llena toda la pantalla: conserva la textura de 1024 px.
reducir_sketchfab("gravel_road.glb", 5000, "camino.glb", px=1024)
