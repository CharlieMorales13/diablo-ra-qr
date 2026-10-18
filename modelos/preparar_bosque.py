"""Recorta dos árboles y una roca del bosque de Sketchfab para el paisaje.

Uso:
    blender --background --python modelos/preparar_bosque.py -- <update_dirt_road_through_forest.glb>

"[UPDATE] Dirt Road Through Forest" de 99.Miles (CC BY 4.0) pesa 89 MB y sus
árboles no son objetos sueltos: cada tipo es una sola malla con miles de
planos de follaje. Aquí se elige el tronco más aislado de cada tipo y se
recorta todo lo que está a su alrededor (tronco + follaje), se reduce y se
exporta con el origen en la base. Genera en assets/models/:
    bosque_pino.glb, bosque_abedul.glb, bosque_roca.glb
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

FUENTE = sys.argv[sys.argv.index("--") + 1]
AQUI = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(os.path.dirname(AQUI), "assets", "models")


def cargar():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=FUENTE)
    por_material = {}
    for o in bpy.data.objects:
        if o.type == "MESH" and o.data.materials:
            por_material.setdefault(o.data.materials[0].name, []).append(o)
    return por_material


def islas(obj):
    """Centro (x, y), base z y alto de cada pieza suelta de la malla, en coordenadas de mundo."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    bm.verts.ensure_lookup_table()
    visto, res = set(), []
    for v in bm.verts:
        if v.index in visto:
            continue
        pila, pts = [v], []
        visto.add(v.index)
        while pila:
            a = pila.pop()
            pts.append(a.co.copy())
            for e in a.link_edges:
                b = e.other_vert(a)
                if b.index not in visto:
                    visto.add(b.index)
                    pila.append(b)
        zs = [p.z for p in pts]
        res.append((sum(p.x for p in pts) / len(pts), sum(p.y for p in pts) / len(pts), min(zs), max(zs) - min(zs)))
    bm.free()
    return res


def mas_aislado(candidatos, todos):
    def separacion(c):
        return min((math.hypot(c[0] - o[0], c[1] - o[1]) for o in todos if o is not c), default=1e9)
    return max(candidatos, key=separacion)


def recortar(objetos, cx, cy, radio, z0, z1, caras, nombre):
    """Copia las caras de `objetos` dentro del cilindro, las une, reduce y exporta."""
    piezas = []
    for o in objetos:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bm.transform(o.matrix_world)
        fuera = [f for f in bm.faces
                 if math.hypot(f.calc_center_median().x - cx, f.calc_center_median().y - cy) > radio
                 or not z0 <= f.calc_center_median().z <= z1]
        bmesh.ops.delete(bm, geom=fuera, context="FACES")
        if not bm.faces:
            bm.free()
            continue
        malla = bpy.data.meshes.new(nombre)
        bm.to_mesh(malla)
        bm.free()
        for m in o.data.materials:
            malla.materials.append(m)
        pieza = bpy.data.objects.new(nombre, malla)
        bpy.context.collection.objects.link(pieza)
        piezas.append(pieza)
    for o in [x for x in bpy.data.objects if x.type == "MESH" and x not in piezas]:
        bpy.data.objects.remove(o)
    bpy.ops.object.select_all(action="DESELECT")
    for p in piezas:
        p.select_set(True)
    bpy.context.view_layer.objects.active = piezas[0]
    if len(piezas) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    for v in obj.data.vertices:  # origen en la base, al centro
        v.co = Vector((v.co.x - cx, v.co.y - cy, v.co.z - z0))
    if len(obj.data.polygons) > caras:
        d = obj.modifiers.new("reducir", "DECIMATE")
        d.ratio = caras / len(obj.data.polygons)
        bpy.ops.object.modifier_apply(modifier="reducir")
    # solo color (con transparencia): sin mapas de normales ni rugosidad, que en el teléfono casi no se notan
    for mat in obj.data.materials:
        bsdf = mat.node_tree.nodes.get("Principled BSDF") if mat and mat.node_tree else None
        if not bsdf:
            continue
        for entrada in ("Normal", "Roughness", "Metallic", "Specular IOR Level", "Specular Tint"):
            if entrada in bsdf.inputs:
                for enlace in list(bsdf.inputs[entrada].links):
                    mat.node_tree.links.remove(enlace)
    for img in bpy.data.images:
        if img.size[0] > 512:
            img.scale(512, 512)
    ruta = os.path.join(SALIDA, nombre)
    # PNG: el follaje usa transparencia
    bpy.ops.export_scene.gltf(filepath=ruta, export_format="GLB", use_selection=True, export_image_format="AUTO", export_animations=False)
    print("OK", nombre, len(obj.data.polygons), "caras", os.path.getsize(ruta) // 1024, "KB")


def arbol(material_tronco, alto_min, alto_max, nombre, copa=0.35):
    m = cargar()
    troncos = islas(m[material_tronco][0])
    altos = [t for t in troncos if alto_min <= t[3] <= alto_max]
    cx, cy, z0, h = mas_aislado(altos, troncos)
    recortar(m[material_tronco] + m["Background_Tree_Atlas"], cx, cy, copa * h, z0 - 0.5, z0 + h * 1.1, 2500, nombre)


arbol("Trunk_Oak", 14, 26, "bosque_pino.glb")
arbol("Trunk_Birch", 8, 15, "bosque_abedul.glb", copa=0.22)

m = cargar()
rocas = islas(m["Broken_Rocks"][0])
cx, cy, z0, h = max(rocas, key=lambda r: r[3])
recortar(m["Broken_Rocks"], cx, cy, 7, z0 - 1.5, z0 + h + 1, 1500, "bosque_roca.glb")
