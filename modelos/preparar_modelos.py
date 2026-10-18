"""Prepara los 3 modelos del juego.

Uso:
    blender --background --python modelos/preparar_modelos.py -- <diablo_meshy.glb> <carpeta_kenney>

<diablo_meshy.glb>: Diablo de Juxtlahuaca generado con Meshy AI (plan gratuito,
CC BY 4.0) con su rig automático y animaciones ("Running", "Alert", ...).
<carpeta_kenney>: kits CC0 de https://kenney.nl descomprimidos:
    kenney_food-kit/          (Food Kit 2.0)
    kenney_nature-kit/        (Nature Kit 2.1)

Genera en assets/models/ (texturas incrustadas):
    diablo.glb    el diablo reducido de ~211 k a ~20 k triángulos, texturas de
                  1024 px y solo la animación "Running" que usa el juego.
    maguey.glb    "plant_flatShort" del Nature Kit, en verde azulado de agave.
    mazorca.glb   "corn" del Food Kit.
"""
import os
import sys

import bpy

DIABLO, KENNEY = sys.argv[sys.argv.index("--") + 1:][:2]
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
    if accion.name != "Running":
        bpy.data.actions.remove(accion)
exportar("diablo.glb", animaciones=True)

# ---------------------------------------------------------------- maguey
limpiar()
importar(os.path.join(KENNEY, "kenney_nature-kit", "Models", "GLTF format", "plant_flatShort.glb"))
for m in bpy.data.materials:
    bsdf = m.node_tree.nodes.get("Principled BSDF") if m.node_tree else None
    if bsdf and not bsdf.inputs["Base Color"].is_linked:
        bsdf.inputs["Base Color"].default_value = (0.42, 0.72, 0.62, 1)  # verde azulado de agave
exportar("maguey.glb")

# ---------------------------------------------------------------- mazorca
limpiar()
importar(os.path.join(KENNEY, "kenney_food-kit", "Models", "GLB format", "corn.glb"))
exportar("mazorca.glb")
