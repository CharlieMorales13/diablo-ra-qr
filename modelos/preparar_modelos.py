"""Prepara los 3 modelos del juego a partir de assets CC0 de Kenney.

Uso:
    blender --background --python modelos/preparar_modelos.py -- <carpeta_kenney>

<carpeta_kenney> debe contener los kits descomprimidos (https://kenney.nl, CC0):
    kenney_mini-characters/   (Mini Characters 1.0)
    kenney_food-kit/          (Food Kit 2.0)
    kenney_nature-kit/        (Nature Kit 2.1)

Genera en assets/models/ (texturas incrustadas, < 5 MB cada uno):
    tiliche.glb   personaje "character-male-c" vestido de Tiliche: traje de
                  retazos de tela pegado a los huesos (se mueve al correr),
                  sombrero de palma y barba de máscara de viejito.
                  Solo conserva las animaciones "sprint" e "idle".
    maguey.glb    "plant_flatShort" del Nature Kit, en verde azulado de agave.
    mazorca.glb   "corn" del Food Kit.
"""
import math
import os
import random
import sys

import bpy

KENNEY = sys.argv[sys.argv.index("--") + 1]
AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(os.path.dirname(AQUI), "assets", "models")
os.makedirs(SALIDA, exist_ok=True)
COLORES = [(1, .35, 0), (1, .76, 0), (0, .66, .42), (.9, 0, .49), (.12, .56, 1), (.54, .17, .89)]
random.seed(7)


def limpiar():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def importar(ruta):
    bpy.ops.import_scene.gltf(filepath=ruta)


def material(nombre, color):
    m = bpy.data.materials.get(nombre) or bpy.data.materials.new(nombre)
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Roughness"].default_value = 0.8
    return m


def exportar(nombre, animaciones=False):
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(SALIDA, nombre),
        export_format="GLB",
        export_animations=animaciones,
        export_yup=True,
    )
    print("OK", nombre, os.path.getsize(os.path.join(SALIDA, nombre)) // 1024, "KB")


PEGADOS = []


def pegar_a_hueso(obj, armadura, hueso):
    """Pesa todos los vértices al hueso; al final se une a la malla del cuerpo
    para que se exporte como piel (skinning), que glTF/three.js leen bien."""
    grupo = obj.vertex_groups.new(name=hueso)
    grupo.add(range(len(obj.data.vertices)), 1.0, "REPLACE")
    PEGADOS.append(obj)


def unir_al_cuerpo(cuerpo):
    bpy.ops.object.select_all(action="DESELECT")
    for o in PEGADOS:
        o.select_set(True)
    cuerpo.select_set(True)
    bpy.context.view_layer.objects.active = cuerpo
    bpy.ops.object.join()


def tira(x, y, z, ang, largo, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    t = bpy.context.active_object
    t.scale = (0.04, 0.008, largo)
    t.rotation_euler = (math.radians(random.uniform(-8, 8)), math.radians(random.uniform(-10, 10)), ang)
    t.data.materials.append(mat)
    return t


def anillo_de_tiras(armadura, hueso, cx, cy, z0, z1, radio, n, largo):
    """Varias filas de retazos alrededor de una parte del cuerpo."""
    filas = max(1, round((z1 - z0) / (largo * 0.6)))
    for f in range(filas):
        z = z1 - f * (z1 - z0) / filas - largo / 2
        for i in range(n):
            a = (i + 0.5 * f) / n * 2 * math.pi
            mat = material(f"retazo{(i + f) % len(COLORES)}", COLORES[(i + f) % len(COLORES)])
            t = tira(cx + math.cos(a) * radio, cy + math.sin(a) * radio, z, a + math.pi / 2, largo, mat)
            pegar_a_hueso(t, armadura, hueso)


# ---------------------------------------------------------------- tiliche
limpiar()
importar(os.path.join(KENNEY, "kenney_mini-characters", "Models", "GLB format", "character-male-c.glb"))
for o in list(bpy.data.objects):
    if o.name.startswith("Icosphere"):  # ayudante del kit, no se usa
        bpy.data.objects.remove(o)
arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")

# medidas reales del cuerpo para colocar los retazos
cuerpo = bpy.data.objects["body-mesh"]
cabeza = bpy.data.objects["head-mesh"]
zs_cuerpo = [(cuerpo.matrix_world @ v.co).z for v in cuerpo.data.vertices]
zs_cabeza = [(cabeza.matrix_world @ v.co) for v in cabeza.data.vertices]
cadera = arm.data.bones["torso"].head_local.z
hombro = arm.data.bones["arm-left"].head_local.z
tope_cabeza = max(v.z for v in zs_cabeza)
frente_cara = min(v.y for v in zs_cabeza)
centro_cabeza_z = (tope_cabeza + min(v.z for v in zs_cabeza)) / 2

anillo_de_tiras(arm, "torso", 0, 0.029, cadera - 0.06, hombro + 0.05, 0.175, 20, 0.12)
for lado, x in (("left", 0.084), ("right", -0.084)):
    anillo_de_tiras(arm, f"leg-{lado}", x, 0.029, 0.03, cadera, 0.085, 10, 0.1)
    anillo_de_tiras(arm, f"arm-{lado}", x * 1.75, 0.017, hombro - 0.14, hombro + 0.02, 0.07, 8, 0.09)

# sombrero de palma
palma = material("palma", (0.82, 0.66, 0.38))
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.33, depth=0.02, location=(0, 0, tope_cabeza - 0.02))
ala = bpy.context.active_object
bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.17, radius2=0.08, depth=0.16, location=(0, 0, tope_cabeza + 0.06))
copa = bpy.context.active_object
for o in (ala, copa):
    o.data.materials.append(palma)
    pegar_a_hueso(o, arm, "head")

# barba y bigote de la máscara de viejito
blanco = material("barba", (0.95, 0.93, 0.88))
for i in range(7):
    x = (i - 3) * 0.035
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.03, depth=0.16 - abs(i - 3) * 0.02,
                                    location=(x, frente_cara + 0.02, centro_cabeza_z - 0.15), rotation=(math.pi, 0, 0))
    b = bpy.context.active_object
    b.data.materials.append(blanco)
    pegar_a_hueso(b, arm, "head")
for s in (-1, 1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.022, depth=0.12,
                                        location=(s * 0.06, frente_cara - 0.005, centro_cabeza_z - 0.05), rotation=(0, math.radians(90 + s * 20), 0))
    m = bpy.context.active_object
    m.data.materials.append(blanco)
    pegar_a_hueso(m, arm, "head")

unir_al_cuerpo(cuerpo)

# solo las animaciones que usa el juego
for accion in list(bpy.data.actions):
    if accion.name not in ("sprint", "idle"):
        bpy.data.actions.remove(accion)
exportar("tiliche.glb", animaciones=True)

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
